// 解析 Markdown 为检查所需的中间结构（不依赖第三方库）
import fs from 'fs';
import path from 'path';

export function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return { fm: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end < 0) return { fm: {}, body: raw };
  const fmText = raw.slice(3, end);
  const body = raw.slice(end + 4);
  const fm = {};
  for (const line of fmText.split('\n')) {
    const m = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return { fm, body };
}

export function parseDoc(raw) {
  const { fm, body } = splitFrontmatter(raw);
  const lines = body.split('\n');
  const headings = { h1: [], h2: [], h3: [] };
  const images = [];
  let inFence = false;
  let tableRows = 0;
  let fences = 0;
  const paragraphs = [];
  let buf = [];

  const flush = () => {
    if (buf.length) { paragraphs.push(buf.join(' ')); buf = []; }
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) { fences++; inFence = !inFence; flush(); continue; }
    if (inFence) continue;
    const t = line.trim();
    let m;
    if ((m = t.match(/^#\s+(.+)$/))) { headings.h1.push(m[1]); flush(); continue; }
    if ((m = t.match(/^##\s+(.+)$/))) { headings.h2.push(m[1]); flush(); continue; }
    if ((m = t.match(/^###\s+(.+)$/))) { headings.h3.push(m[1]); flush(); continue; }
    if ((m = t.match(/!\[\[([^\]]+)\]\]/)) || (m = t.match(/!\[[^\]]*\]\(([^)]+)\)/))) {
      images.push(m[1].trim()); flush(); continue;
    }
    if (/^\|.*\|$/.test(t)) { tableRows++; flush(); continue; }
    if (!t) { flush(); continue; }
    if (/^[-*]\s+/.test(t) || /^>\s*/.test(t)) { flush(); continue; }
    buf.push(t);
  }
  flush();

  const plain = body
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/```[\s\S]*?```/g, '');
  const chars = (plain.match(/[\u4e00-\u9fa5]/g) || []).length;
  const cjkChars = chars;
  const latinWords = (plain.match(/\b[A-Za-z]{2,}\b/g) || []).length;
  const words = cjkChars + latinWords;

  return {
    fm, body, headings, images, tableRows, fences: Math.floor(fences / 2),
    paragraphs, plain, chars: cjkChars, words,
  };
}

export function resolveImage(p, baseDir) {
  if (path.isAbsolute(p)) return p;
  const a = path.resolve(baseDir, p);
  if (fs.existsSync(a)) return a;
  const b = path.resolve(process.cwd(), p);
  return fs.existsSync(b) ? b : a;
}

export function readDoc(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) throw new Error('找不到文件: ' + file);
  return { ...parseDoc(fs.readFileSync(abs, 'utf8')), abs, baseDir: path.dirname(abs) };
}
