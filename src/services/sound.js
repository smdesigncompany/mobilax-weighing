// Synthesised "lock confirmed" chirp via Web Audio API. Avoids shipping an
// audio asset and stays inaudible if the AudioContext can't resolve (e.g.
// page hasn't received a user gesture yet — common on first paint).
let ctx = null;

function getCtx() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

export function playLockSound() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});

  const now = ac.currentTime;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  gain.connect(ac.destination);

  // Two quick rising tones — short, crisp, "validation" feel.
  const o1 = ac.createOscillator();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(880, now);
  o1.connect(gain);
  o1.start(now);
  o1.stop(now + 0.09);

  const o2 = ac.createOscillator();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(1320, now + 0.08);
  o2.connect(gain);
  o2.start(now + 0.08);
  o2.stop(now + 0.22);
}
