import { mkdir, writeFile } from "node:fs/promises";

const rate = 22050;
const peakTarget = 0.8;
const tailSeconds = 0.12;
const root = new URL("../../", import.meta.url);

function shape(wave, phase, seed) {
  if (wave === "sine") {
    return Math.sin(phase);
  }

  if (wave === "noise") {
    const scrambled = Math.sin(seed * 12.9898) * 43758.5453;

    return (scrambled - Math.floor(scrambled)) * 2 - 1;
  }

  const cycle = phase / (Math.PI * 2) - Math.floor(phase / (Math.PI * 2));

  if (wave === "triangle") {
    return 4 * Math.abs(cycle - 0.5) - 1;
  }

  if (wave === "saw") {
    return cycle * 2 - 1;
  }

  return cycle < 0.5 ? 1 : -1;
}

function render(notes) {
  const seconds =
    Math.max(...notes.map((note) => note.at + note.seconds)) + tailSeconds;
  const frames = Math.ceil(seconds * rate);
  const samples = new Float32Array(frames);

  for (const note of notes) {
    const start = Math.floor(note.at * rate);
    const span = Math.floor(note.seconds * rate);
    const attack = Math.max(1, Math.floor((note.attack ?? 0.008) * rate));
    const decay = note.decay ?? 1.8;

    for (let index = 0; index < span; index += 1) {
      const position = start + index;

      if (position >= frames) {
        break;
      }

      const progress = index / span;
      const sweptHz = note.to
        ? note.hz + ((note.to - note.hz) * progress) / 2
        : note.hz;
      const phase = (2 * Math.PI * sweptHz * index) / rate;
      const fadeIn = Math.min(1, index / attack);
      const fadeOut = Math.pow(1 - progress, decay);

      samples[position] +=
        shape(note.wave, phase, position) * note.gain * fadeIn * fadeOut;
    }
  }

  let peak = 0;

  for (const value of samples) {
    peak = Math.max(peak, Math.abs(value));
  }

  const scale = peak > 0 ? peakTarget / peak : 1;
  const body = Buffer.alloc(frames * 2);

  for (let index = 0; index < frames; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index] * scale));

    body.writeInt16LE(Math.round(clamped * 32767), index * 2);
  }

  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + body.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(body.length, 40);

  return { buffer: Buffer.concat([header, body]), seconds };
}

const sounds = {
  tap: [
    { hz: 1046.5, at: 0, seconds: 0.05, wave: "square", gain: 0.16, decay: 3 },
    { hz: 1567.98, at: 0, seconds: 0.04, wave: "sine", gain: 0.08, decay: 3.4 },
  ],
  card: [
    { hz: 640, at: 0, seconds: 0.09, wave: "noise", gain: 0.26, decay: 3 },
    {
      hz: 420,
      to: 1320,
      at: 0.02,
      seconds: 0.14,
      wave: "triangle",
      gain: 0.2,
      decay: 2.2,
    },
    { hz: 987.77, at: 0.13, seconds: 0.1, wave: "sine", gain: 0.12, decay: 2.6 },
  ],
  right: [
    { hz: 523.25, at: 0, seconds: 0.1, wave: "triangle", gain: 0.24 },
    { hz: 659.25, at: 0.075, seconds: 0.1, wave: "triangle", gain: 0.24 },
    { hz: 783.99, at: 0.15, seconds: 0.11, wave: "triangle", gain: 0.26 },
    {
      hz: 1046.5,
      at: 0.225,
      seconds: 0.26,
      wave: "triangle",
      gain: 0.28,
      decay: 1.6,
    },
    {
      hz: 1567.98,
      at: 0.26,
      seconds: 0.22,
      wave: "sine",
      gain: 0.12,
      decay: 1.8,
    },
  ],
  steal: [
    {
      hz: 880,
      to: 440,
      at: 0,
      seconds: 0.16,
      wave: "triangle",
      gain: 0.24,
      decay: 1.8,
    },
    {
      hz: 415.3,
      to: 830.61,
      at: 0.16,
      seconds: 0.18,
      wave: "saw",
      gain: 0.16,
      decay: 1.6,
    },
    {
      hz: 932.33,
      at: 0.33,
      seconds: 0.1,
      wave: "triangle",
      gain: 0.2,
      decay: 2.4,
    },
    {
      hz: 1244.51,
      at: 0.41,
      seconds: 0.18,
      wave: "sine",
      gain: 0.18,
      decay: 1.8,
    },
  ],
  miss: [
    { hz: 392, at: 0, seconds: 0.12, wave: "triangle", gain: 0.24, decay: 2 },
    {
      hz: 311.13,
      at: 0.1,
      seconds: 0.22,
      wave: "triangle",
      gain: 0.24,
      decay: 1.6,
    },
    {
      hz: 155.56,
      at: 0.1,
      seconds: 0.24,
      wave: "square",
      gain: 0.12,
      decay: 1.8,
    },
  ],
  tick: [
    { hz: 1396.91, at: 0, seconds: 0.03, wave: "square", gain: 0.14, decay: 4 },
  ],
  timeup: [
    {
      hz: 659.25,
      at: 0,
      seconds: 0.16,
      wave: "square",
      gain: 0.24,
      decay: 1.4,
    },
    {
      hz: 523.25,
      at: 0.16,
      seconds: 0.16,
      wave: "square",
      gain: 0.24,
      decay: 1.4,
    },
    {
      hz: 415.3,
      at: 0.32,
      seconds: 0.18,
      wave: "square",
      gain: 0.24,
      decay: 1.3,
    },
    {
      hz: 349.23,
      at: 0.5,
      seconds: 0.42,
      wave: "triangle",
      gain: 0.28,
      decay: 1,
    },
    { hz: 174.61, at: 0.5, seconds: 0.44, wave: "saw", gain: 0.14, decay: 1 },
  ],
  draw: [
    {
      hz: 120,
      at: 0,
      seconds: 0.85,
      wave: "noise",
      gain: 0.16,
      decay: 0.5,
      attack: 0.55,
    },
    {
      hz: 98,
      at: 0,
      seconds: 0.85,
      wave: "saw",
      gain: 0.06,
      decay: 0.6,
      attack: 0.6,
    },
    { hz: 820, at: 0.85, seconds: 0.1, wave: "noise", gain: 0.24, decay: 2.4 },
    { hz: 392, at: 0.95, seconds: 0.12, wave: "triangle", gain: 0.24 },
    { hz: 523.25, at: 1.06, seconds: 0.12, wave: "triangle", gain: 0.24 },
    { hz: 659.25, at: 1.17, seconds: 0.12, wave: "triangle", gain: 0.26 },
    {
      hz: 783.99,
      at: 1.28,
      seconds: 0.4,
      wave: "triangle",
      gain: 0.3,
      decay: 1.4,
    },
    { hz: 1046.5, at: 1.32, seconds: 0.36, wave: "sine", gain: 0.16, decay: 1.6 },
    {
      hz: 1318.51,
      at: 1.36,
      seconds: 0.32,
      wave: "sine",
      gain: 0.1,
      decay: 1.8,
    },
  ],
  twist: [
    {
      hz: 311.13,
      to: 466.16,
      at: 0,
      seconds: 0.3,
      wave: "sine",
      gain: 0.22,
      decay: 1.2,
      attack: 0.05,
    },
    {
      hz: 466.16,
      at: 0.12,
      seconds: 0.28,
      wave: "triangle",
      gain: 0.14,
      decay: 1.6,
    },
    {
      hz: 659.25,
      to: 830.61,
      at: 0.26,
      seconds: 0.3,
      wave: "sine",
      gain: 0.18,
      decay: 1.4,
    },
    { hz: 1244.51, at: 0.4, seconds: 0.26, wave: "sine", gain: 0.12, decay: 2 },
  ],
  win: [
    { hz: 523.25, at: 0, seconds: 0.13, wave: "triangle", gain: 0.24 },
    { hz: 523.25, at: 0.12, seconds: 0.1, wave: "triangle", gain: 0.22 },
    { hz: 523.25, at: 0.22, seconds: 0.12, wave: "triangle", gain: 0.24 },
    { hz: 659.25, at: 0.34, seconds: 0.14, wave: "triangle", gain: 0.26 },
    { hz: 783.99, at: 0.48, seconds: 0.14, wave: "triangle", gain: 0.26 },
    {
      hz: 1046.5,
      at: 0.62,
      seconds: 0.3,
      wave: "triangle",
      gain: 0.3,
      decay: 1.5,
    },
    { hz: 783.99, at: 0.94, seconds: 0.12, wave: "triangle", gain: 0.22 },
    { hz: 880, at: 1.06, seconds: 0.12, wave: "triangle", gain: 0.22 },
    { hz: 987.77, at: 1.18, seconds: 0.12, wave: "triangle", gain: 0.24 },
    { hz: 261.63, at: 1.3, seconds: 0.6, wave: "triangle", gain: 0.14, decay: 1.2 },
    { hz: 900, at: 1.3, seconds: 0.18, wave: "noise", gain: 0.1, decay: 2.4 },
    {
      hz: 1046.5,
      at: 1.3,
      seconds: 0.6,
      wave: "triangle",
      gain: 0.3,
      decay: 1.2,
    },
    {
      hz: 1318.51,
      at: 1.34,
      seconds: 0.56,
      wave: "triangle",
      gain: 0.2,
      decay: 1.4,
    },
    {
      hz: 1567.98,
      at: 1.38,
      seconds: 0.52,
      wave: "sine",
      gain: 0.14,
      decay: 1.6,
    },
    { hz: 2093, at: 1.46, seconds: 0.44, wave: "sine", gain: 0.08, decay: 1.8 },
  ],
};

await mkdir(new URL("public/sounds/", root), { recursive: true });

for (const [name, notes] of Object.entries(sounds)) {
  const { buffer, seconds } = render(notes);

  await writeFile(new URL(`public/sounds/${name}.wav`, root), buffer);

  console.log(
    `public/sounds/${name}.wav — ${seconds.toFixed(2)}s — ${(buffer.length / 1024).toFixed(1)} kB`,
  );
}
