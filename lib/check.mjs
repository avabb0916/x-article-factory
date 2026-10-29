// 内容检查主逻辑
import fs from 'fs';
import { readDoc, resolveImage } from './parse.mjs';
import { DEFAULT_RULES, DEFAULTS } from './rules.mjs';
import { imageSize } from './image.mjs';

export function check(file, opts = {}) {
  const rules = { ...DEFAULT_RULES, ...(opts.rules || {}) };
  const cfg = { ...DEFAULTS, ...(opts.config || {}) };
  const doc = readDoc(file);
  const out = [];

  const add = (code, msg, override) => {
    const rule = rules[code] || { level: 'warn' };
    out.push({ level: override || rule.level, code, msg, desc: rule.desc });
  };

  // ---- 标题 ----
  const title = doc.fm.title || doc.headings.h1[0] || '';
  if (!title) add('title-required', '没有标题');
  if (doc.headings.h1.length > 1) add('single-h1', `一级标题 ${doc.headings.h1.length} 个，只允许 1 个`);

  // ---- 结构 ----
  if (doc.headings.h2.length < 5) add('h2-min', `二级标题 ${doc.headings.h2.length} 个，建议 ≥5`);
  if (doc.headings.h3.length) add('no-h3', `三级标题 ${doc.headings.h3.length} 个（X 不支持，会被降级）`);
  if (doc.words < 2000) add('word-min', `正文 ${doc.words} 字/词，长文建议 ≥2000`);

  // ---- 平台限制 ----
  if (doc.tableRows) add('no-table', `含 ${doc.tableRows} 行表格`);
  if (doc.fences) add('no-fence', `含 ${doc.fences} 个代码块`);

  // ---- 配图 ----
  const n = doc.images.length;
  if (n < 5) add('image-min', `配图 ${n} 张，建议 ≥5`);
  if (n > 9) add('image-max', `配图 ${n} 张，建议 ≤9`);
  const missing = doc.images.filter(p => !fs.existsSync(resolveImage(p, doc.baseDir)));
  for (const m of missing) add('image-exists', `配图不存在: ${m}`);

  // ---- 封面 ----
  if (doc.fm.cover_image) {
    const cover = resolveImage(doc.fm.cover_image, doc.baseDir);
    if (!fs.existsSync(cover)) {
      add('cover-exists', `封面不存在: ${doc.fm.cover_image}`);
    } else {
      const size = imageSize(cover);
      if (size) {
        const ratio = size.width / size.height;
        if (Math.abs(ratio - 2.5) > 0.05) {
          add('cover-ratio', `封面 ${size.width}×${size.height}（比例 ${ratio.toFixed(2)}），X 文章建议 5:2`);
        }
      }
    }
  }

  // ---- 写作质量 ----
  const notXY = (doc.plain.match(/不是[^。，\n]{1,18}[，。]?\s*是/g) || []).length;
  if (notXY > 3) add('no-not-x-is-y', `「不是X，是Y」${notXY} 次（AI 味强信号），建议 ≤3`);
  const tail = doc.plain.slice(-320);
  if (!/留言|评论|告诉我|你怎么|你们的/.test(tail)) add('cta-tail', '结尾没有提问/互动引导');
  const longParas = doc.paragraphs.filter(p => (p.match(/[\u4e00-\u9fa5]/g) || []).length > 220);
  if (longParas.length) add('long-paragraph', `${longParas.length} 段超过 220 字`);

  // ---- 合规 ----
  for (const w of cfg.banned) if (doc.plain.includes(w)) add('banned-words', `出现内部词: ${w}`);
  const hitRisk = cfg.risk.filter(w => doc.plain.includes(w));
  if (hitRisk.length) add('risk-words', `敏感词面: ${hitRisk.join('、')}（换上位词更稳）`);
  for (const w of cfg.absolute) if (doc.plain.includes(w)) add('absolute-claim', `绝对化表述: ${w}`);

  const claimRe = /(\d+(?:[kK万])|\d+\s*(?:级别|量级))[^。]{0,12}(流量|收入|收益|转化)/g;
  for (const m of doc.plain.matchAll(claimRe)) {
    const ctx = doc.plain.slice(Math.max(0, m.index - 40), m.index + 60);
    if (!/未验证|样本|参考|大约|据说|有人报/.test(ctx)) {
      add('claim-number', `效果数字「${m[0].slice(0, 20)}」缺来源/样本说明`);
    }
  }

  const errors = out.filter(i => i.level === 'error');
  return {
    ok: errors.length === 0,
    file: file.split('/').pop(),
    title, words: doc.words, h2: doc.headings.h2.length, images: n,
    issues: out,
    counts: {
      error: errors.length,
      warn: out.filter(i => i.level === 'warn').length,
      info: out.filter(i => i.level === 'info').length,
    },
  };
}
