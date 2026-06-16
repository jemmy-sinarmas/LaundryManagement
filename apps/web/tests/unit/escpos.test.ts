import { describe, it, expect } from 'vitest';
import { init, align, bold, text, lineFeed, feedLines, cut, concat } from '@/lib/escpos';

describe('escpos byte builders', () => {
  it('init emits ESC @', () => {
    expect(Array.from(init())).toEqual([0x1b, 0x40]);
  });

  it('align maps left/center/right to 0/1/2', () => {
    expect(Array.from(align('left'))).toEqual([0x1b, 0x61, 0]);
    expect(Array.from(align('center'))).toEqual([0x1b, 0x61, 1]);
    expect(Array.from(align('right'))).toEqual([0x1b, 0x61, 2]);
  });

  it('bold toggles the emphasis byte', () => {
    expect(Array.from(bold(true))).toEqual([0x1b, 0x45, 1]);
    expect(Array.from(bold(false))).toEqual([0x1b, 0x45, 0]);
  });

  it('text encodes UTF-8 bytes', () => {
    expect(Array.from(text('AB'))).toEqual([0x41, 0x42]);
  });

  it('lineFeed emits n LF bytes', () => {
    expect(Array.from(lineFeed(3))).toEqual([0x0a, 0x0a, 0x0a]);
    expect(Array.from(lineFeed())).toEqual([0x0a]);
  });

  it('feedLines emits ESC d n', () => {
    expect(Array.from(feedLines(4))).toEqual([0x1b, 0x64, 4]);
  });

  it('cut emits a partial-cut sequence', () => {
    expect(Array.from(cut())).toEqual([0x1d, 0x56, 0x41, 0]);
  });

  it('concat joins arrays preserving order and length', () => {
    const out = concat(init(), text('A'), cut());
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out.length).toBe(2 + 1 + 4);
    expect(Array.from(out)).toEqual([0x1b, 0x40, 0x41, 0x1d, 0x56, 0x41, 0]);
  });
});
