import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';
import { check } from '../lib/check.mjs';
import { parseDoc, splitFrontmatter } from '../lib/parse.mjs';
import { imageSize } from '../lib/image.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const fx = f => path.join(dir, 'fixtures', f);

test('frontmatter 解析', () => {
  const { fm, body } = splitFrontmatter('---\ntitle: A\ncover_image: c.png\n---\n正文');
  assert.equal(fm.title, 'A');
  assert.equal(fm.cover_image, 'c.png');
  assert.ok(body.includes('正文'));
});

test('统计标题/配图/字数', () => {
  const doc = parseDoc('# T\n\n## a\n\n## b\n\n![](x.png)\n\n中文正文');
  assert.equal(doc.headings.h1.length, 1);
  assert.equal(doc.headings.h2.length, 2);
  assert.equal(doc.images.length, 1);
  assert.ok(doc.chars > 0);
});

test('图片尺寸读取（PNG）', () => {
  const s = imageSize(fx('cover.png'));
  assert.equal(s.width, 1600);
  assert.equal(s.height, 640);
});

test('合格文章应通过', () => {
  const res = check(fx('good.md'));
  const codes = res.issues.map(i => i.code);
  assert.ok(!codes.includes('title-required'), '不应缺标题');
  assert.ok(!codes.includes('cover-exists'), '封面应存在');
  assert.ok(!codes.includes('image-exists'), '配图应存在');
  assert.ok(!codes.includes('banned-words'), '不应有内部词');
});

test('坏文章应被拦下（error 级）', () => {
  const res = check(fx('bad.md'));
  assert.equal(res.ok, false);
  const codes = res.issues.map(i => i.code);
  assert.ok(codes.includes('banned-words'), '应识别内部黑话');
});

test('坏文章的多项告警', () => {
  const res = check(fx('bad.md'));
  const codes = res.issues.map(i => i.code);
  assert.ok(codes.includes('single-h1') || codes.includes('title-required'));
  assert.ok(codes.includes('no-table'));
  assert.ok(codes.includes('no-fence'));
  assert.ok(codes.includes('no-h3'));
  assert.ok(codes.includes('no-not-x-is-y'));
});

test('封面比例告警', () => {
  const res = check(fx('good.md'));
  const coverIssue = res.issues.find(i => i.code === 'cover-ratio');
  assert.equal(coverIssue, undefined, '1600x640 是 5:2，不应告警');
});
