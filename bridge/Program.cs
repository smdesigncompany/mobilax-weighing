// MobilaxBridge — small console process that talks to the Hikrobot
// MV-DS505-Y volumetric camera through Hikrobot's MvVolMeasure SDK and
// streams measurements as one JSON object per line on stdout.
//
// Stdin accepts simple commands (one per line):
//   start                 : (re)connect and begin streaming
//   stop                  : stop streaming, keep handle
//   shutdown              : tear down and exit
//   set-mode <int>        : change algorithm type before next start
//   set-config <path>     : override HikBinoConfig folder before start
//
// The renderer never talks to this process directly — Electron's main
// process owns it via spawn() and forwards relevant events over IPC.

using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using MvVolmeasureLib = MvVolmeasure.NET.MvVolmeasure;
// Brings VOLM_RESULT_INFO, ERROR_DEFINE, CAMERATYPE_DEFINE into scope.
// Cannot put `using MvVolmeasure.NET;` directly because the outer
// namespace `MvVolmeasure` collides with the class of the same name.
using ResultInfo = MvVolmeasure.NET.VOLM_RESULT_INFO;
using ErrorCode = MvVolmeasure.NET.ERROR_DEFINE;
using CameraType = MvVolmeasure.NET.CAMERATYPE_DEFINE;

namespace MobilaxBridge
{
    internal static class Program
    {
        private static MvVolmeasureLib _sdk;
        private static MvVolmeasureLib.ResultCallback _callback;
        // Default mode: 10 = CAMERA_TYPE_BINOSTEREO_VOLUME_DIRECT (camera computes
        // volume on-board, no PC-side calibration files needed). If the camera
        // refuses this mode we fall through the candidate list below.
        private static int _algorithmType = (int)CameraType.CAMERA_TYPE_BINOSTEREO_VOLUME_DIRECT;
        private static readonly int[] FALLBACK_MODES = new int[] {
            (int)CameraType.CAMERA_TYPE_BINOSTEREO_VOLUME_DIRECT,   // 10
            (int)CameraType.CAMERA_TYPE_BINOSTEREO_VOLUME_160W,     // 8
            (int)CameraType.CAMERA_TYPE_BINOSTEREO_VOLUME,          // 7
            (int)CameraType.CAMERA_TYPE_BINOSTEREO_RGBD,            // 14
            (int)CameraType.CAMERA_TYPE_BINOSTEREO_MONO8_VOLUME,    // 11
        };
        private static string _configFolder = null;
        private static string _selectedSerial = null;
        private static bool _running = false;
        private static int _frameCount = 0;
        private static readonly object _lock = new object();

        private static int Main(string[] args)
        {
            // Parse CLI args (overrides over defaults)
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "--mode" && i + 1 < args.Length && int.TryParse(args[i + 1], out var m)) _algorithmType = m;
                if (args[i] == "--config" && i + 1 < args.Length) _configFolder = args[i + 1];
                if (args[i] == "--serial" && i + 1 < args.Length) _selectedSerial = args[i + 1];
            }

            // Make sure Stop()/DeInit() runs even if the host kills us with
            // SIGTERM / closes the parent process. Otherwise the camera
            // firmware keeps thinking we hold it and refuses 3DMVS, etc.
            AppDomain.CurrentDomain.ProcessExit += (_, __) => ShutdownInternal();
            Console.CancelKeyPress += (_, e) => { e.Cancel = false; ShutdownInternal(); };

            Console.OutputEncoding = Encoding.UTF8;
            EmitEvent("ready", new Dictionary<string, object> {
                { "mode", _algorithmType },
                { "config", _configFolder },
                { "serial", _selectedSerial },
            });

            // The SDK loads HikBinoConfig from the current working dir, so
            // hop there before initialising. Falls back to the bundled
            // sample calibration alongside the executable.
            if (!string.IsNullOrEmpty(_configFolder) && Directory.Exists(_configFolder))
            {
                Directory.SetCurrentDirectory(_configFolder);
                EmitEvent("info", new Dictionary<string, object> { { "msg", "cwd set to " + _configFolder } });
            }

            // Auto-start once unless the host explicitly asked us to wait.
            if (TryStart() == false)
            {
                EmitEvent("error", new Dictionary<string, object> { { "msg", "initial start failed; awaiting commands on stdin" } });
            }

            // stdin command loop — keeps the process alive
            string line;
            while ((line = Console.In.ReadLine()) != null)
            {
                line = line.Trim();
                if (line.Length == 0) continue;
                try { HandleCommand(line); }
                catch (Exception ex) { EmitEvent("error", new Dictionary<string, object> { { "msg", ex.Message } }); }
            }

            ShutdownInternal();
            return 0;
        }

        private static void HandleCommand(string line)
        {
            var space = line.IndexOf(' ');
            var cmd = (space < 0 ? line : line.Substring(0, space)).ToLowerInvariant();
            var arg = space < 0 ? "" : line.Substring(space + 1).Trim();

            switch (cmd)
            {
                case "start":
                    TryStart();
                    break;
                case "stop":
                    StopOnly();
                    break;
                case "shutdown":
                case "exit":
                case "quit":
                    Environment.Exit(0);
                    return;
                case "set-mode":
                    if (int.TryParse(arg, out var m))
                    {
                        _algorithmType = m;
                        EmitEvent("info", new Dictionary<string, object> { { "msg", "mode set to " + m } });
                    }
                    break;
                case "set-config":
                    _configFolder = arg;
                    if (Directory.Exists(_configFolder)) Directory.SetCurrentDirectory(_configFolder);
                    EmitEvent("info", new Dictionary<string, object> { { "msg", "config set to " + arg } });
                    break;
                default:
                    EmitEvent("error", new Dictionary<string, object> { { "msg", "unknown command: " + cmd } });
                    break;
            }
        }

        private static bool TryStart()
        {
            lock (_lock)
            {
                if (_running) return true;
                try
                {
                    _sdk = _sdk ?? new MvVolmeasureLib();

                    // Enumerate GigE devices and pick the first (or by serial)
                    var devList = new MvVolmeasureLib.VOLM_DEVICE_INFO_LIST();
                    var enumRet = MvVolmeasureLib.EnumStereoCamEx(MvVolmeasureLib.MV_VOLM_GIGE_DEVICE, ref devList);
                    if (enumRet != (int)ErrorCode.MV_VOLM_OK || devList.nDeviceNum == 0)
                    {
                        EmitEvent("error", new Dictionary<string, object> {
                            { "msg", "no GigE camera found" },
                            { "ret", enumRet },
                            { "count", devList.nDeviceNum },
                        });
                        return false;
                    }

                    int chosenIndex = 0;
                    string serial = ExtractSerial(devList, chosenIndex);
                    if (!string.IsNullOrEmpty(_selectedSerial))
                    {
                        for (int i = 0; i < devList.nDeviceNum; i++)
                        {
                            var s = ExtractSerial(devList, i);
                            if (s == _selectedSerial) { chosenIndex = i; serial = s; break; }
                        }
                    }

                    EmitEvent("camera-found", new Dictionary<string, object> {
                        { "serial", serial },
                        { "index", chosenIndex },
                        { "totalDevices", devList.nDeviceNum },
                    });

                    var ret = _sdk.CreateHandleBySerial(serial);
                    if (ret != (int)ErrorCode.MV_VOLM_OK)
                    {
                        EmitEvent("error", new Dictionary<string, object> {
                            { "msg", "CreateHandleBySerial failed" },
                            { "ret", ret },
                            { "serial", serial },
                        });
                        return false;
                    }

                    // Try the user-requested mode first, then fall through the
                    // built-in fallback list. Camera variants accept different
                    // modes; we pick the first one the firmware accepts.
                    int chosenMode = -1;
                    foreach (int candidate in EnumerateModeCandidates(_algorithmType))
                    {
                        var rt = _sdk.SetAlgorithmType((uint)candidate);
                        EmitEvent("info", new Dictionary<string, object> {
                            { "msg", "SetAlgorithmType try" },
                            { "mode", candidate },
                            { "ret", rt },
                        });
                        if (rt == (int)ErrorCode.MV_VOLM_OK) { chosenMode = candidate; break; }
                    }
                    if (chosenMode < 0)
                    {
                        EmitEvent("error", new Dictionary<string, object> {
                            { "msg", "no algorithm mode accepted by camera" },
                            { "tried", string.Join(",", EnumerateModeCandidates(_algorithmType)) },
                        });
                        return false;
                    }
                    _algorithmType = chosenMode;

                    _callback = new MvVolmeasureLib.ResultCallback(OnResult);
                    ret = _sdk.RegisterResultCallBack(_callback, IntPtr.Zero);
                    if (ret != (int)ErrorCode.MV_VOLM_OK)
                    {
                        EmitEvent("error", new Dictionary<string, object> {
                            { "msg", "RegisterResultCallBack failed" },
                            { "ret", ret },
                        });
                        return false;
                    }

                    ret = _sdk.Start();
                    if (ret != (int)ErrorCode.MV_VOLM_OK)
                    {
                        EmitEvent("error", new Dictionary<string, object> {
                            { "msg", "Start failed" },
                            { "ret", ret },
                        });
                        return false;
                    }

                    _running = true;
                    EmitEvent("started", new Dictionary<string, object> {
                        { "mode", _algorithmType },
                        { "serial", serial },
                    });
                    return true;
                }
                catch (Exception ex)
                {
                    EmitEvent("error", new Dictionary<string, object> { { "msg", "Start threw: " + ex.Message } });
                    return false;
                }
            }
        }

        private static void StopOnly()
        {
            lock (_lock)
            {
                if (!_running) return;
                try { _sdk?.Stop(); } catch { }
                _running = false;
                EmitEvent("stopped", null);
            }
        }

        private static void ShutdownInternal()
        {
            lock (_lock)
            {
                try { if (_running) _sdk?.Stop(); } catch { }
                try { _sdk?.DeInit(); } catch { }
                _sdk = null;
                _running = false;
            }
        }

        // Walk the user's preferred mode first, then everything in FALLBACK_MODES
        // (skipping duplicates). Yields ints in order, no dedup-allocation needed.
        private static IEnumerable<int> EnumerateModeCandidates(int preferred)
        {
            yield return preferred;
            foreach (int m in FALLBACK_MODES)
            {
                if (m != preferred) yield return m;
            }
        }

        private static string ExtractSerial(MvVolmeasureLib.VOLM_DEVICE_INFO_LIST devList, int index)
        {
            try
            {
                var device = (MvVolmeasureLib.VOLM_DEVICE_INFO)Marshal.PtrToStructure(
                    devList.pDeviceInfo[index], typeof(MvVolmeasureLib.VOLM_DEVICE_INFO));
                if (device.nTLayerType == MvVolmeasureLib.MV_VOLM_GIGE_DEVICE)
                {
                    var buffer = Marshal.UnsafeAddrOfPinnedArrayElement(device.SpecialInfo.stGigEInfo, 0);
                    var gige = (MvVolmeasureLib.MV_VOLM_GIGE_NET_INFO)Marshal.PtrToStructure(
                        buffer, typeof(MvVolmeasureLib.MV_VOLM_GIGE_NET_INFO));
                    return gige.chSerialNumber;
                }
            }
            catch { }
            return string.Empty;
        }

        // SDK callback — fires for every result frame the camera produces.
        // We always count + emit a heartbeat event so the journal shows that
        // frames ARE flowing (even when the volume flag is off, e.g. camera
        // streams images but not yet a measurement). Volume frames come on
        // top with the dimensions payload.
        private static int _heartbeatEvery = 10; // throttle non-volume heartbeats
        private static void OnResult(ref ResultInfo info, IntPtr pUser)
        {
            _frameCount++;
            bool hasVolume = info.nVolumeFlag == 1;
            bool hasImage = info.nImgFlag == 1;
            if (hasVolume)
            {
                EmitEvent("volume", new Dictionary<string, object> {
                    { "len", info.stVolumeInfo.length },
                    { "width", info.stVolumeInfo.width },
                    { "height", info.stVolumeInfo.height },
                    { "vol", info.stVolumeInfo.volume },
                    { "frame", _frameCount },
                });
            }
            else if ((_frameCount % _heartbeatEvery) == 1)
            {
                // Non-volume frames are common — log a lightweight heartbeat
                // periodically so we can see the SDK is alive even without
                // a measurement.
                EmitEvent("info", new Dictionary<string, object> {
                    { "msg", "frame received without volume" },
                    { "frame", _frameCount },
                    { "imgFlag", info.nImgFlag },
                    { "volumeFlag", info.nVolumeFlag },
                });
            }
        }

        // ---------- minimal JSON emission (one line per event) ----------

        private static void EmitEvent(string type, Dictionary<string, object> data)
        {
            var sb = new StringBuilder(128);
            sb.Append('{').Append("\"type\":\"").Append(Escape(type)).Append('"');
            sb.Append(",\"ts\":").Append(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
            if (data != null)
            {
                foreach (var kv in data)
                {
                    sb.Append(",\"").Append(Escape(kv.Key)).Append("\":");
                    AppendValue(sb, kv.Value);
                }
            }
            sb.Append('}');
            Console.Out.WriteLine(sb.ToString());
            try { Console.Out.Flush(); } catch { }
        }

        private static void AppendValue(StringBuilder sb, object v)
        {
            if (v == null) { sb.Append("null"); return; }
            switch (v)
            {
                case bool b: sb.Append(b ? "true" : "false"); break;
                case int i: sb.Append(i); break;
                case uint ui: sb.Append(ui); break;
                case long l: sb.Append(l); break;
                case float f: sb.Append(f.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)); break;
                case double d: sb.Append(d.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)); break;
                default: sb.Append('"').Append(Escape(v.ToString())).Append('"'); break;
            }
        }

        private static string Escape(string s)
        {
            if (string.IsNullOrEmpty(s)) return s ?? string.Empty;
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "");
        }
    }
}
