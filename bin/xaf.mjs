#!/usr/bin/env node
// xaf — X 长文质量工具：检查 / 出图 / 初始化
import fs from 'fs';
import path from 'path';
import { check } from '../lib/check.mjs';
import { renderAll } from '../lib/figures.mjs';
import { formatHuman, formatJson } from '../lib/report.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0];
const has = n => argv.includes(n);
const flag = (n, d = null) => { const i = argv.indexOf(n); return i < 0 ? d : (argv[i + 1] ?? d); };
const positional = argv.slice(1).filter(a => !a.startsWith('--') && a !== flag('--out') && a !== flag('--config'));

function usage() {
  console.log(`xaf — X 长文质量工具

用法:
  xaf check <article.md> [--json] [--config config.json]    内容检查（exit 1 = 有 error）
  xaf figures <figures.json> --out <目录>                    本地生成配图（HTML→PNG）
  xaf init [目录]                                            生成文章骨架与图配置示例

示例:
  xaf check post.md
  xaf check post.md --json | jq .counts
  xaf figures figures.json --out ./images
`);
}

if (!cmd || has('--help') || has('-h')) { usage(); process.exit(cmd ? 0 : 1); }

if (cmd === 'check') {
  const file = positional[0];
  if (!file) { usage(); process.exit(1); }
  let config = {};
  const cfgFile = flag('--config');
  if (cfgFile && fs.existsSync(cfgFile)) config = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  let res;
  try {
    res = check(file, { config });
  } catch (e) {
    console.error('检查失败:', e.message);
    process.exit(2);
  }
  console.log(has('--json') ? formatJson(res) : formatHuman(res, { color: process.stdout.isTTY }));
  process.exit(res.ok ? 0 : 1);
}

if (cmd === 'figures') {
  const specFile = positional[0];
  const out = flag('--out', 'out');
  if (!specFile) { usage(); process.exit(1); }
  if (!fs.existsSync(specFile)) { console.error('找不到图配置:', specFile); process.exit(1); }
  const specs = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const list = Array.isArray(specs) ? specs : specs.figures;
  if (!Array.isArray(list)) { console.error('图配置应为数组，或 { "figures": [...] }'); process.exit(1); }
  const results = renderAll(list, out);
  for (const r of results) console.log(`[OK] ${r.name} → ${r.file} (${r.width}x${r.height}, ${(r.bytes / 1024).toFixed(0)}KB)`);
  process.exit(0);
}

if (cmd === 'init') {
  const dir = positional[0] || '.';
  fs.mkdirSync(dir, { recursive: true });
  const article = `---
title: 文章标题
cover_image: images/cover.png
---

# 文章标题

开篇一段：一个具体场景或一次失误。

## 一、先记住一句话

核心判断写在这里。

## 二、三个方法

- 方法一
- 方法二
- 方法三

## 三、可执行清单

![[images/checklist.png]]

## 四、结尾

你最近在这件事上卡在哪一步？留言告诉我。
`;
  const figures = `{
  "figures": [
    { "name": "cover", "type": "cover", "kicker": "栏目 · 环节", "title": "文章<em>主标题</em>", "sub": "一句话副标", "brand": "你的品牌" },
    { "name": "steps", "type": "steps", "title": "三步流程", "brand": "你的品牌",
      "steps": [{ "name": "1 第一步", "desc": "做什么", "verify": "怎么验证" }, { "name": "2 第二步", "desc": "做什么", "verify": "怎么验证" }] },
    { "name": "checklist", "type": "checklist", "title": "自检清单", "brand": "你的品牌",
      "items": ["检查项一", "检查项二", "检查项三"], "note": "全部通过再发布" }
  ]
}`;
  fs.writeFileSync(path.join(dir, 'article.md'), article);
  fs.writeFileSync(path.join(dir, 'figures.json'), figures);
  fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
  console.log(`已生成: ${dir}/article.md, ${dir}/figures.json, ${dir}/images/`);
  process.exit(0);
}

usage();
process.exit(1);
