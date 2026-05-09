# MobilaxBridge

Console process that talks to the Hikrobot MV-DS505-Y volumetric camera through
Hikrobot's `MvVolMeasure.NET` SDK and streams measurements as one JSON object per
line on stdout.

## Build

```powershell
dotnet build bridge/MobilaxBridge.csproj -c Release
```

The output is `bridge/bin/Release/MobilaxBridge.exe` plus `VolMeasure.Net.dll`.
On the deployment machine `MvVolMeasure.dll` and the rest of the SDK runtime
must be available — install
`Runtime/VolumeMeasureSDK_V2.6.0.1_VC90_Runtime.exe` from the SDK first.

## Runtime layout expected

```
MobilaxBridge.exe
VolMeasure.Net.dll
HikBinoConfig/
  BinoVol.ini
  bg_depth.bin
  bg_rgb.bin
  cfg.xml
  fusion.xml
  innercalib.xml
  rgbd_cfg.xml
  ...
```

The SDK loads `HikBinoConfig` from the **current working directory** so the
launcher (Electron main) sets cwd to the resources folder before spawning, or
the bridge accepts `--config <path>` to override.

## CLI

```
MobilaxBridge.exe [--mode N] [--config <path>] [--serial <n>]
```

| Flag | Description | Default |
| --- | --- | --- |
| `--mode` | Algorithm type (10=direct, 14=RGBD DB500S) | 14 |
| `--config` | HikBinoConfig folder | cwd |
| `--serial` | Pick a specific camera serial | first found |

## stdin commands

One per line:

| Command | Effect |
| --- | --- |
| `start` | (re)connect and begin streaming |
| `stop` | stop streaming, keep handle |
| `set-mode N` | change algorithm before next start |
| `set-config <path>` | change HikBinoConfig folder |
| `shutdown` | tear down and exit |

## stdout JSON event types

```jsonc
{"type":"ready","ts":...,"mode":14,"config":null,"serial":null}
{"type":"camera-found","ts":...,"serial":"...","index":0,"totalDevices":1}
{"type":"started","ts":...,"mode":14,"serial":"..."}
{"type":"volume","ts":...,"len":350.5,"width":220.1,"height":180.3,"vol":13923100,"frame":42}
{"type":"info","ts":...,"msg":"..."}
{"type":"error","ts":...,"msg":"...","ret":-1}
{"type":"stopped","ts":...}
```

`len/width/height` are in millimetres, `vol` in mm³.
