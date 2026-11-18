/**
 * Splitting one voice reading into line clips at its pauses (used by voice-gemini.mjs).
 *
 * Every pause of at least 0.2 s is a candidate cut. The cuts are chosen together (dynamic programming) so that
 * each falls near where it should, from the lines' word counts, preferring long pauses: a long pause between
 * lines beats a short one inside a sentence, unless it is in clearly the wrong place.
 */
/**
 * Cleans the ends of a clip. Gemini often ends a reading with ~0.2 s of loud static after a short silence; that
 * burst is cut off (speech in these clips stays well below its level), then short fades stop any click.
 */
export function cleanEnds({ pcm, rate }) {
  let s = new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.length));
  const win = Math.round(rate * 0.02);
  const rms = [];
  for (let i = 0; i < s.length; i += win) {
    let sum = 0;
    const end = Math.min(i + win, s.length);
    for (let j = i; j < end; j++) sum += s[j] * s[j];
    rms.push(Math.sqrt(sum / (end - i)));
  }
  // From the end: find the last silence of ≥ 0.1 s; if what follows it is short (≤ 0.6 s) and very loud, it is the
  // burst, not speech (the burst can have a silent instant inside it, so it is not required to be loud throughout).
  let runEnd = -1;
  let runStart = -1;
  for (let k = rms.length - 1, run = 0; k >= 0 && rms.length - 1 - k <= 40; k--) {
    run = rms[k] < 200 ? run + 1 : 0;
    if (run >= 5) {
      runEnd = k + run - 1;
      while (k > 0 && rms[k - 1] < 200) k--;
      runStart = k;
      break;
    }
  }
  const after = runEnd >= 0 ? rms.slice(runEnd + 1) : [];
  if (after.length > 0 && after.length <= 30 && Math.max(...after) >= 10000) s = s.slice(0, (runStart + 3) * win);
  // 15 ms fade in, 30 ms fade out.
  const fin = Math.min(s.length, Math.round(rate * 0.015));
  const fout = Math.min(s.length, Math.round(rate * 0.03));
  for (let i = 0; i < fin; i++) s[i] = Math.round((s[i] * i) / fin);
  for (let i = 0; i < fout; i++) s[s.length - 1 - i] = Math.round((s[s.length - 1 - i] * i) / fout);
  return { pcm: Buffer.from(s.buffer), rate };
}

export function splitAtPauses({ pcm, rate }, n, weights = Array(n).fill(1)) {
  const s = new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.length));
  const win = Math.round(rate * 0.02); // 20 ms windows
  const peaks = [];
  for (let i = 0; i < s.length; i += win) {
    let p = 0;
    for (let j = i; j < Math.min(i + win, s.length); j++) p = Math.max(p, Math.abs(s[j]));
    peaks.push(p);
  }
  const top = peaks.reduce((a, b) => Math.max(a, b), 0);
  const quiet = (v) => v < Math.max(250, top * 0.04);
  const first = peaks.findIndex((v) => !quiet(v));
  let last = peaks.length - 1;
  while (last > 0 && quiet(peaks[last])) last--;
  if (first < 0) return null;
  const gaps = [];
  for (let k = first, start = -1; k <= last; k++) {
    if (quiet(peaks[k])) start = start < 0 ? k : start;
    else if (start >= 0) {
      if (k - start >= 10) gaps.push({ start, end: k, len: k - start, mid: (start + k) / 2 });
      start = -1;
    }
  }
  if (gaps.length < n - 1) return null;
  if (n === 1) return [{ pcm: Buffer.from(s.slice(Math.max(0, first - 3) * win, Math.min(s.length, (last + 5) * win)).buffer), rate }];

  // Where each cut should be, from the word counts (pauses add a little, so this is only a guide).
  const span = last - first;
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const expected = weights.slice(0, -1).map((w) => first + span * ((acc += w) / total));
  const cost = (j, g) => (4 * Math.abs(gaps[g].mid - expected[j])) / span - Math.min(gaps[g].len, 60) / 50;

  // best[j][g]: lowest total cost with cut j at gap g (cuts in order).
  const best = expected.map(() => gaps.map(() => Infinity));
  const from = expected.map(() => gaps.map(() => -1));
  gaps.forEach((_, g) => (best[0][g] = cost(0, g)));
  for (let j = 1; j < expected.length; j++)
    for (let g = j; g < gaps.length; g++)
      for (let h = j - 1; h < g; h++)
        if (best[j - 1][h] + cost(j, g) < best[j][g]) {
          best[j][g] = best[j - 1][h] + cost(j, g);
          from[j][g] = h;
        }
  const lastRow = best[expected.length - 1];
  let g = lastRow.indexOf(Math.min(...lastRow));
  const cuts = [];
  for (let j = expected.length - 1; j >= 0; j--) {
    cuts.unshift(gaps[g]);
    g = from[j][g];
  }
  const bounds = [first, ...cuts.flatMap((c) => [c.start, c.end]), last + 1];
  return Array.from({ length: n }, (_, k) => {
    const a = Math.max(0, bounds[2 * k] - 3) * win;
    const b = Math.min(s.length, (bounds[2 * k + 1] + 4) * win);
    return { pcm: Buffer.from(s.slice(a, b).buffer), rate };
  });
}
