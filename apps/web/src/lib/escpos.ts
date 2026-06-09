const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export function init(): Uint8Array {
  return new Uint8Array([ESC, 0x40]);
}

export function align(direction: 'left' | 'center' | 'right'): Uint8Array {
  const n = direction === 'left' ? 0 : direction === 'center' ? 1 : 2;
  return new Uint8Array([ESC, 0x61, n]);
}

export function bold(on: boolean): Uint8Array {
  return new Uint8Array([ESC, 0x45, on ? 1 : 0]);
}

export function text(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function lineFeed(n = 1): Uint8Array {
  return new Uint8Array(n).fill(LF);
}

export function feedLines(n: number): Uint8Array {
  return new Uint8Array([ESC, 0x64, n]);
}

export function cut(): Uint8Array {
  // Partial cut
  return new Uint8Array([GS, 0x56, 0x41, 0]);
}

export function printImage(imageBase64: string, maxWidth = 384): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);
      const wBytes = Math.ceil(w / 8);
      const wDots = wBytes * 8;

      const canvas = document.createElement('canvas');
      canvas.width = wDots;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(new Uint8Array(0)); return; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, wDots, h);
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, wDots, h);
      const pixels = imageData.data;
      const raster: number[] = [];

      for (let y = 0; y < h; y++) {
        for (let xb = 0; xb < wBytes; xb++) {
          let byte = 0;
          for (let bit = 0; bit < 8; bit++) {
            const x = xb * 8 + bit;
            const idx = (y * wDots + x) * 4;
            const r = pixels[idx] ?? 255;
            const g = pixels[idx + 1] ?? 255;
            const b = pixels[idx + 2] ?? 255;
            if ((r + g + b) / 3 < 128) byte |= 0x80 >> bit;
          }
          raster.push(byte);
        }
      }

      const xL = wBytes & 0xff;
      const xH = (wBytes >> 8) & 0xff;
      const yL = h & 0xff;
      const yH = (h >> 8) & 0xff;
      resolve(new Uint8Array([GS, 0x76, 0x30, 0, xL, xH, yL, yH, ...raster]));
    };
    img.onerror = () => resolve(new Uint8Array(0));
    img.src = imageBase64;
  });
}

export function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
