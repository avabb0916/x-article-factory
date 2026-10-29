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
body{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;overflow:hidden}
.dark{background:#101821;color:#f6f7f3}
.light{background:#f6f7f3;color:#1b2430}
.wrap{padding:56px 64px;height:100%;display:flex;flex-direction:column;position:relative}
.kicker{font-size:20px;letter-spacing:.18em;font-weight:700;color:#9fd3c7;margin-bottom:18px}
h1{font-size:64px;line-height:1.2;font-weight:800;letter-spacing:-1px}
h1 em{font-style:normal;color:#f2b544}
h2{font-size:42px;font-weight:800;line-height:1.25;margin-bottom:8px}
.sub{font-size:24px;line-height:1.6;color:#c9d2cc;margin-top:20px}
.brand{position:absolute;left:64px;bottom:36px;font-size:18px;letter-spacing:.1em;color:#8d9791}
.light .brand{color:#7b847e}
.flow{display:flex;gap:14px;margin-top:32px;align-items:stretch}
.step{flex:1;background:#fff;border:2px solid #1b2430;border-radius:12px;padding:20px 16px}
.step b{display:block;font-size:24px;margin-bottom:8px}
.step span{font-size:18px;color:#5b655f;line-height:1.45}
.step i{display:block;font-size:18px;color:#c0392b;font-style:normal;margin-top:8px}
table{width:100%;border-collapse:collapse;font-size:23px;margin-top:20px}
th,td{border:1px solid #dfe3d8;padding:14px 15px;text-align:left;vertical-align:top;line-height:1.45}
th{background:#edf1ea;font-weight:700}
td.bad{color:#c0392b}td.ok{color:#2f6f4f}
.check{display:flex;gap:14px;margin-top:10px;font-size:26px;line-height:1.5}
.check b{color:#2f6f4f}
.quote{font-size:44px;line-height:1.45;font-weight:800}
`;

const TPL = {
  cover: (d) => `<div class="wrap ${d.dark === false ? 'light' : 'dark'}" style="padding:80px 64px">
    ${d.kicker ? `<div class="kicker">${d.kicker}</div>` : ''}
    <h1>${d.title || ''}</h1>
    ${d.sub ? `<div class="sub">${d.sub}</div>` : ''}
    <div class="brand">${d.brand || ''}</div></div>`,
  steps: (d) => `<div class="wrap light"><h2>${d.title || ''}</h2>
    <div class="flow">${(d.steps || []).map(s => `<div class="step"><b>${s.name}</b><span>${s.desc || ''}</span>${s.verify ? `<i>${s.verify}</i>` : ''}</div>`).join('')}</div>
    ${d.note ? `<div style="margin-top:28px;font-size:26px;color:#c0392b;font-weight:700">${d.note}</div>` : ''}
    <div class="brand">${d.brand || ''}</div></div>`,
  table: (d) => `<div class="wrap light"><h2>${d.title || ''}</h2>
    <table><tr>${(d.columns || []).map(c => `<th>${c}</th>`).join('')}</tr>
    ${(d.rows || []).map(r => `<tr>${r.map((c, i) => `<td class="${i === 0 ? 'bad' : ''}">${c}</td>`).join('')}</tr>`).join('')}
    </table>${d.note ? `<div style="margin-top:26px;font-size:25px;color:#5b655f">${d.note}</div>` : ''}
    <div class="brand">${d.brand || ''}</div></div>`,
  checklist: (d) => `<div class="wrap light"><h2>${d.title || ''}</h2>
    ${d.sub ? `<div style="font-size:21px;color:#5b655f;margin-top:6px">${d.sub}</div>` : ''}
    <div style="margin-top:30px">${(d.items || []).map((t, i) => `<div class="check"><b>${String.fromCharCode(0x2460 + i)}</b><span>${t}</span></div>`).join('')}</div>
    ${d.note ? `<div style="margin-top:38px;font-size:27px;color:#c0392b;line-height:1.5">${d.note}</div>` : ''}
    <div class="brand">${d.brand || ''}</div></div>`,
  quote: (d) => `<div class="wrap light" style="justify-content:center">
    <div class="quote">${d.text || ''}</div>
    ${d.author ? `<div style="margin-top:26px;font-size:22px;color:#7b847e">${d.author}</div>` : ''}
    <div class="brand">${d.brand || ''}</div></div>`,
};

const SIZE = {
  cover: { width: 1600, height: 640 },   // X 文章封面 5:2
  steps: { width: 1600, height: 700 },
  table: { width: 1600, height: 900 },
  checklist: { width: 1200, height: 1400 },
  quote: { width: 1400, height: 700 },
};

export function renderFigure(spec, outFile, { chrome = CHROME_DEFAULT } = {}) {
  const tpl = TPL[spec.type];
  if (!tpl) throw new Error('未知图类型: ' + spec.type + '（可用: ' + Object.keys(TPL).join(', ') + '）');
  const { width, height } = SIZE[spec.type];
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
    body{width:${width}px;height:${height}px}</style></head><body>${tpl(spec)}</body></html>`;
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
