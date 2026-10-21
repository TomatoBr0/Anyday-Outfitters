"""Original soundtrack for the Getup launch film (procedurally synthesized, no samples).
Warm pad progression + soft plucked arpeggio + two gentle accents (logo reveal, end card).
usage: python3 -I music.py <out.wav> [seconds]"""
import sys, wave
import numpy as np

SR = 44100
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 40.0
n = int(SR * dur)
t = np.arange(n) / SR

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

# Fmaj9 – Dm9 – Bbmaj9 – Csus2, 5 s per chord, twice through.
CHORDS = [[41, 53, 57, 60, 64, 67], [38, 50, 53, 57, 60, 64], [46, 50, 57, 60, 62, 65], [48, 52, 55, 60, 62, 67]]
CH_LEN = 5.0

def env_window(start, length, attack=1.2, release=1.6):
    e = np.zeros(n)
    a, b = int(start * SR), int(min(dur, start + length + release) * SR)
    seg = t[a:b] - start
    e[a:b] = np.clip(seg / attack, 0, 1) * np.clip((length + release - seg) / release, 0, 1)
    return e

pad = np.zeros(n)
for k in range(int(np.ceil(dur / CH_LEN))):
    chord = CHORDS[k % 4]
    e = env_window(k * CH_LEN, CH_LEN)
    for i, m in enumerate(chord):
        f = midi(m)
        for det in (-0.12, 0.0, 0.11):  # gentle chorus
            ff = f * 2 ** (det / 12)
            pad += e * (np.sin(2 * np.pi * ff * t) * 0.55 + np.sin(2 * np.pi * 2 * ff * t) * 0.12) / (1 + i * 0.35)
pad *= 0.05
# slow filter-like movement
pad *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t)

# Plucked arpeggio from the logo reveal onwards (eighths at 96 bpm).
arp = np.zeros(n)
step = 60 / 96 / 2
pattern = [0, 2, 3, 4, 3, 2, 4, 5]
start, end = 6.0, dur - 4.0
k = 0
x = start
while x < end:
    chord = CHORDS[int(x // CH_LEN) % 4]
    m = chord[1:][pattern[k % 8] % 5] + 12
    a = int(x * SR)
    L = int(1.2 * SR)
    seg = np.arange(min(L, n - a)) / SR
    tone = np.sin(2 * np.pi * midi(m) * seg) + 0.25 * np.sin(2 * np.pi * 2 * midi(m) * seg)
    vel = 0.5 + 0.5 * (k % 2 == 0)
    arp[a:a + len(seg)] += tone * np.exp(-seg * 5.5) * vel
    x += step
    k += 1
arp *= 0.06
# fade arp in after reveal and duck it under the end card
arp *= np.clip((t - 6.0) / 2.0, 0, 1) * np.clip((dur - 3.0 - t) / 1.5, 0, 1)

# Accents: soft low "bloom" at the reveal (6.0 s) and end card (35.4 s); rising swell into the reveal.
acc = np.zeros(n)
for at, base in ((6.0, 41), (38.4, 41)):
    a = int(at * SR); seg = np.arange(min(int(3 * SR), n - a)) / SR
    acc[a:a + len(seg)] += (np.sin(2 * np.pi * midi(base) * seg) + 0.5 * np.sin(2 * np.pi * midi(base + 12) * seg)) * np.exp(-seg * 1.4) * 0.22
swell = np.sin(2 * np.pi * midi(65) * t) * np.clip((t - 3.8) / 2.2, 0, 1) ** 2 * (t < 6.05) * 0.05
mix = pad + arp + acc + swell

# Simple stereo: slightly delayed copy on the right, plus a short echo.
d = int(0.017 * SR)
left = mix.copy()
right = np.concatenate([np.zeros(d), mix[:-d]])
echo = int(0.32 * SR)
left[echo:] += 0.18 * mix[:-echo]
right[echo:] += 0.18 * mix[:-echo]
st = np.stack([left, right], axis=1)
# master fade + normalize to -3 dBFS peak
fade = np.clip(t / 1.0, 0, 1) * np.clip((dur - t) / 2.0, 0, 1)
st *= fade[:, None]
st /= np.max(np.abs(st)) / 0.7
pcm = (st * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', sys.argv[1], f'{dur:.1f}s')
