// 读取 PNG/JPEG 尺寸（只读文件头，不依赖第三方库）
import fs from 'fs';

export function imageSize(file) {
  try {
    const buf = fs.readFileSync(file);
    // PNG
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), type: 'png' };
    }
    // JPEG
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7), type: 'jpeg' };
        }
        i += 2 + len;
      }
    }
    // WebP
    if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      return { width: 0, height: 0, type: 'webp' }; // 尺寸解析略
    }
    return null;
  } catch { return null; }
}
