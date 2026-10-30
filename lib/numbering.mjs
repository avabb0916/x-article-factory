// 中文序号规范检查与重排（一、二、三…，不跳号、不从「零」起）
import fs from 'fs';

export const CN = ['一','二','三','四','五','六','七','八','九','十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '二十一','二十二','二十三','二十四','二十五'];

const HEADING_RE = /^##\s+([零一二三四五六七八九十百]+)?[、.．]?\s*(.+)$/;

export function parseHeadings(md) {
  return md.split('\n').map((line, i) => {
    const m = line.match(HEADING_RE);
    if (!m || !m[2] || m[2].startsWith('#')) return null;
    return { line: i, num: m[1] || '', title: m[2].trim() };
  }).filter(Boolean);
}

export function checkNumbering(md) {
  const heads = parseHeadings(md);
  const issues = [];
  heads.forEach((h, idx) => {
    const want = CN[idx] ?? String(idx + 1);
    if (!h.num) {
      issues.push({ level: 'warn', code: 'no-heading-number', msg: `第 ${idx + 1} 个二级标题没有编号：「${h.title}」` });
    } else if (h.num !== want) {
      issues.push({ level: 'warn', code: 'heading-number-order', msg: `第 ${idx + 1} 个标题编号「${h.num}」应为「${want}」` });
    }
  });
  if (heads.length && heads[0] && heads[0].num === '零') {
    issues.push({ level: 'warn', code: 'heading-starts-zero', msg: '首个标题从「零、」起，中文习惯从「一、」起' });
  }
  return { headings: heads.length, issues };
}

const WEAK = /^(关于|参考|说明|结语|结尾|写在最后|常见疑问|常见问题|小结|总结|收尾)$|^(几个|三个|四个|五个|六个|七个|八个)[^，。！？]{0,6}$/;

export function checkWeakHeadings(md) {
  const issues = [];
  for (const h of parseHeadings(md)) {
    if (WEAK.test(h.title)) {
      issues.push({ level: 'warn', code: 'weak-heading', msg: `标题像名词短语，建议改成判断句：「${h.title}」` });
    }
  }
  return issues;
}

export function renumber(md) {
  let i = 0;
  return md.replace(/^##\s+([零一二三四五六七八九十百]+)?[、.．]?\s*(.+)$/gm, (m, num, title) => {
    const t = (title || '').trim();
    if (!t) return m;
    return `## ${CN[i++] ?? i}、${t}`;
  });
}

export function normalizeFile(file, { fix = false } = {}) {
  const md = fs.readFileSync(file, 'utf8');
  const num = checkNumbering(md);
  const weak = checkWeakHeadings(md);
  let out = md;
  if (fix && num.issues.some(i => i.code.startsWith('heading-number'))) {
    out = renumber(md);
    fs.writeFileSync(file, out, 'utf8');
  }
  return { file, headings: num.headings, issues: [...num.issues, ...weak], fixed: out !== md };
}
