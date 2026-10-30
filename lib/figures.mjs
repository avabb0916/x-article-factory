// 本地配图生成：HTML 模板 → Chrome 截图。零 API、中文精确、可批量。
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CHROME_DEFAULT = process.env.XAF_CHROME || (
  process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : '/usr/bin/google-chrome'
);

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;overflow:hidden;
  background:#fbfaf7;color:#14161a;
  --ink:#14161a;--ink2:#5b6067;--label:#9aa0a8;--line:#e8e6e0;--card:#ffffff;
  --accent:#2a78d6;--accent-soft:#eef4fc;--warn:#eb6834;
  padding:56px 64px;display:flex;flex-direction:column;height:100%}
.dark{background:#101821;color:#f6f7f3}
.wrap{padding:56px 64px 96px;height:100%;display:flex;flex-direction:column;position:relative}
.kicker{font-size:22px;letter-spacing:.16em;font-weight:700;color:#8f9aa3;margin-bottom:12px}
h1{font-size:46px;line-height:1.16;font-weight:800;letter-spacing:-.02em}
h1 em{font-style:normal;color:#f2b544}
h2{font-size:34px;font-weight:800;line-height:1.28;letter-spacing:-.01em}
.sub{font-size:19px;line-height:1.5;color:#5b6067;margin-top:10px}
.brand{position:absolute;right:64px;bottom:36px;font-size:22px;letter-spacing:.08em;color:#8f9aa3;text-align:right}
.dark .brand{position:absolute;right:64px;bottom:36px;font-size:22px;letter-spacing:.08em;color:#8f9aa3;text-align:right}
.dark .sub{color:#c9d2cc}
.dark .kicker{color:#f2b544}
/* 表格：去网格，改卡片行 */
table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0 10px;font-size:19px;margin-top:8px}
th{font-size:13px;letter-spacing:.14em;color:var(--label);font-weight:700;text-align:left;padding:0 18px 6px}
th:first-child{width:23%}
td{background:var(--card);border-top:1px solid var(--line);border-bottom:1px solid var(--line);
  padding:18px;line-height:1.45;vertical-align:top}
td:first-child{border-left:1px solid var(--line);border-radius:12px 0 0 12px;
  font-size:14px;letter-spacing:.1em;color:var(--accent);font-weight:700;white-space:nowrap}
td:last-child{border-right:1px solid var(--line);border-radius:0 12px 12px 0}
tr:nth-child(2) td{box-shadow:0 -1px 0 rgba(16,24,33,.02)}
.note{margin-top:22px;font-size:16px;color:var(--ink2);display:flex;gap:10px;align-items:flex-start}
.note:before{content:"";width:3px;height:20px;background:var(--accent);border-radius:2px;flex:none;margin-top:1px}
/* 步骤：等宽卡片 */
.flow{display:flex;gap:16px;margin-top:28px;flex:none;align-items:stretch}
.step{flex:1;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px 18px;display:flex;flex-direction:column;gap:10px}
.step b{font-size:15px;color:var(--accent);letter-spacing:.06em;font-weight:800}
.step .st{font-size:21px;font-weight:800;line-height:1.35}
.step span{font-size:16px;color:var(--ink2);line-height:1.5}
.step i{font-style:normal;font-size:15px;color:var(--warn);font-weight:700;margin-top:auto}
/* 清单 */
.check{display:flex;gap:16px;margin-top:16px;font-size:21px;line-height:1.5;align-items:flex-start}
.check b{flex:none;width:30px;height:30px;border-radius:50%;background:var(--accent-soft);color:var(--accent);
  font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:2px}
/* 金句 */
.quote{font-size:42px;line-height:1.42;font-weight:800;letter-spacing:-.01em;border-left:4px solid var(--accent);padding-left:28px}
`;


const TPL = {
  cover: (d) => {
    const plain = (x) => String(x || '').replace(/<[^>]+>/g, '');
    const widthOf = (t) => [...t].reduce((a, c) => a + (/[\x00-\x7F]/.test(c) ? 0.56 : 1), 0);
    const raw = String(d.title || '').trim();
    const segs = raw.split(/<br\s*\/?>/i).map(plain).filter(Boolean);
    const PALETTE = ['#f2b544', '#f2b544', '#f2b544'];

    // 1) 决定断行：优先「：」，否则按视觉宽度均衡二分（两行宽度比 ≥ 0.72）
    let lines = [];
    if (segs.length > 1) {
      lines = segs;
    } else {
      const t = segs[0] || '';
      const colon = t.search(/[：:]/);
      const wTotal = widthOf(t);
      if (colon > 3 && widthOf(t.slice(0, colon + 1)) / wTotal > 0.32) {
        lines = [t.slice(0, colon + 1), t.slice(colon + 1)];
      } else if (wTotal > 11) {
        // 贪心：填到接近一半宽度处断开
        let acc = 0, cut = 1;
        for (let i = 0; i < t.length; i++) {
          acc += widthOf(t[i]);
          if (acc >= wTotal * 0.5) { cut = i + 1; break; }
        }
        lines = [t.slice(0, cut), t.slice(cut)];
      } else {
        lines = [t];
      }
    }
    // 2) 字号：按最长行拟合（可用宽 1472）
    const AVAIL = 1472;
    const maxW = Math.max(...lines.map(widthOf), 1);
    let fontSize = Math.max(54, Math.min(120, Math.floor(AVAIL / maxW * 0.97)));
    while (widthOf(lines.reduce((a, b) => (widthOf(a) >= widthOf(b) ? a : b))) * fontSize > AVAIL * 1.01 && fontSize > 46) fontSize -= 3;

    const titleHtml = lines.map((l, i) => i === 0 ? l : `<em style="font-style:normal;color:${PALETTE[0]}">${l}</em>`).join('<br>');
    return `<div class="wrap dark" style="padding:60px 64px 130px;justify-content:center">
    ${d.kicker ? `<div class="kicker">${d.kicker}</div>` : ''}
    <h1 style="font-size:${fontSize}px;line-height:1.22">${titleHtml}</h1>
    <div style="position:absolute;left:64px;right:64px;bottom:36px;display:flex;justify-content:space-between;align-items:flex-end;gap:40px">
      <div class="sub" style="font-size:30px;line-height:1.35;color:#aab6bd;margin:0">${d.sub || ''}</div>
      <div class="brand" style="position:static;font-size:26px;color:#95a4ae;white-space:nowrap">${d.brand || ''}</div>
    </div></div>`;
  },
  steps: (d) => `<div class="wrap"><div class="kicker">${d.kicker || ''}</div><h2>${d.title || ''}</h2>
    ${d.sub ? `<div class="sub">${d.sub}</div>` : ''}
    <div class="flow">${(d.steps || []).map((s, i) => `<div class="step"><b>0${i + 1}</b><div class="st">${s.name}</div><span>${s.desc || ''}</span>${s.verify && s.verify !== '—' ? `<i>${s.verify}</i>` : ''}</div>`).join('')}</div>
    ${d.note ? `<div class="note">${d.note}</div>` : ''}
    <div class="brand">${d.brand || ''}</div></div>`,
  table: (d) => `<div class="wrap"><div class="kicker">${d.kicker || ''}</div><h2>${d.title || ''}</h2>
    ${d.sub ? `<div class="sub">${d.sub}</div>` : ''}
    <table><tr>${(d.columns || []).map((c, i) => `<th>${i === 0 ? '' : c}</th>`).join('')}</tr>
    ${(d.rows || []).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
    </table>${d.note ? `<div class="note">${d.note}</div>` : ''}
    <div class="brand">${d.brand || ''}</div></div>`,
  checklist: (d) => `<div class="wrap"><div class="kicker">${d.kicker || ''}</div><h2>${d.title || ''}</h2>
    ${d.sub ? `<div class="sub">${d.sub}</div>` : ''}
    <div style="margin-top:14px">${(d.items || []).map((t, i) => `<div class="check"><b>${i + 1}</b><span>${t}</span></div>`).join('')}</div>
    ${d.note ? `<div class="note" style="margin-top:34px;font-size:18px;color:var(--warn);font-weight:700">${d.note}</div>` : ''}
    <div class="brand">${d.brand || ''}</div></div>`,
  quote: (d) => `<div class="wrap" style="justify-content:center">
    ${d.kicker ? `<div class="kicker">${d.kicker}</div>` : ''}
    <div class="quote">${d.text || ''}</div>
    ${d.author ? `<div style="margin-top:26px;font-size:19px;color:#7b847e">${d.author}</div>` : ''}
    <div class="brand">${d.brand || ''}</div></div>`,
};

const SIZE = {
  cover: { width: 1600, height: 640 },   // X 文章封面 5:2
  steps: { width: 1600, height: 720 },
  table: { width: 1600, height: 820 },
  checklist: { width: 1200, height: 1000 },
  quote: { width: 1400, height: 700 },
};

export function renderFigure(spec, outFile, { chrome = CHROME_DEFAULT } = {}) {
  const tpl = TPL[spec.type];
  if (!tpl) throw new Error('未知图类型: ' + spec.type + '（可用: ' + Object.keys(TPL).join(', ') + '）');
  let { width, height } = SIZE[spec.type];
  // 表格/清单按行数自适应高度，避免大片空白
  if (spec.type === 'table') {
    const rows = (spec.rows || []).length;
    height = Math.max(480, 252 + rows * 104 + (spec.note ? 96 : 0));
  }
  if (spec.type === 'steps') {
    height = Math.max(420, 250 + 190 + (spec.note ? 80 : 0));
  }
  if (spec.type === 'checklist') {
    const items = (spec.items || []).length;
    height = Math.max(400, 230 + items * 82 + (spec.note ? 86 : 0));
  }
  const bodyBg = spec.type === 'cover' ? 'background:#101821;' : '';
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
    body{width:${width}px;height:${height}px;${bodyBg}}</style></head><body>${tpl(spec)}</body></html>`;
  const tmp = path.join(os.tmpdir(), `xaf-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  execFileSync(chrome, [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    '--force-device-scale-factor=1', '--hide-scrollbars',
    `--window-size=${width},${height}`, `--screenshot=${outFile}`, `file://${tmp}`,
  ], { stdio: 'ignore' });
  fs.unlinkSync(tmp);
  return { file: outFile, width, height, bytes: fs.statSync(outFile).size };
}

export function renderAll(specs, outDir, opts = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const results = [];
  for (const spec of specs) {
    const name = spec.name || `${spec.type}-${results.length + 1}`;
    const out = path.join(outDir, `${name}.png`);
    results.push({ name, ...renderFigure(spec, out, opts) });
  }
  return results;
}
