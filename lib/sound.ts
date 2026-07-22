// Cross-platform beep via the Web Audio API — replaces the desktop app's
// winsound.Beep (Windows-only). Lazily creates a single AudioContext.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// Browsers suspend AudioContext until a user gesture. Call this from a click.
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

export function beep(freq = 1000, durationMs = 400, volume = 0.15): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durationMs / 1000);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + durationMs / 1000);
}

// A pleasant two-note chime for session open.
export function chimeOpen(): void {
  beep(660, 220, 0.12);
  setTimeout(() => beep(990, 350, 0.12), 180);
}

// A triple alert for imminent high-impact news.
export function alertNews(): void {
  beep(1500, 160, 0.14);
  setTimeout(() => beep(1500, 160, 0.14), 220);
  setTimeout(() => beep(1500, 220, 0.14), 440);
}

// Soft click for checklist completion.
export function chimeSuccess(): void {
  beep(880, 120, 0.1);
  setTimeout(() => beep(1320, 200, 0.1), 110);
}
