// Generates the game's small feedback sounds as WAV files, so they carry no licence to track.
// Run once with `node scripts/generate-sfx.js`; the output is committed under assets/audio/.
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'audio');

const NOTE = { C4: 261.63, E4: 329.63, G4: 392.0, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5 };

const renderNotes = (notes, noteSeconds, volume) => {
  const samplesPerNote = Math.floor(SAMPLE_RATE * noteSeconds);
  const samples = new Int16Array(samplesPerNote * notes.length);
  notes.forEach((frequency, noteIndex) => {
    for (let i = 0; i < samplesPerNote; i++) {
      const t = i / SAMPLE_RATE;
      const fadeIn = Math.min(1, i / (SAMPLE_RATE * 0.008));
      const fadeOut = Math.pow(1 - i / samplesPerNote, 1.6);
      const wave = Math.sin(2 * Math.PI * frequency * t) + 0.25 * Math.sin(4 * Math.PI * frequency * t);
      samples[noteIndex * samplesPerNote + i] = Math.round((wave / 1.25) * fadeIn * fadeOut * volume * 32767);
    }
  });
  return samples;
};

const toWav = (samples) => {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  samples.forEach((sample, i) => buffer.writeInt16LE(sample, 44 + i * 2));
  return buffer;
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const sounds = {
  'correct.wav': renderNotes([NOTE.C5, NOTE.E5, NOTE.G5], 0.11, 0.55),
  'try-again.wav': renderNotes([NOTE.G4, NOTE.E4], 0.14, 0.3),
  'complete.wav': renderNotes([NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6], 0.16, 0.55),
};

Object.entries(sounds).forEach(([name, samples]) => {
  fs.writeFileSync(path.join(OUTPUT_DIR, name), toWav(samples));
});
