// 输出格式化：人类可读 + JSON
const ICON = { error: '✗', warn: '!', info: 'i' };
const COLOR = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[90m', reset: '\x1b[0m' };

export function formatHuman(res, { color = true } = {}) {
  const c = (k, s) => color ? `${COLOR[k]}${s}${COLOR.reset}` : s;
  const lines = [];
  lines.push(`\n${res.file}`);
  lines.push(`  标题: ${res.title || '(无)'}`);
  lines.push(`  字数: ${res.words}   二级标题: ${res.h2}   配图: ${res.images}`);
  if (!res.issues.length) {
    lines.push(c('info', '  ✓ 没有发现问题'));
    return lines.join('\n');
  }
  const order = { error: 0, warn: 1, info: 2 };
  for (const i of [...res.issues].sort((a, b) => order[a.level] - order[b.level])) {
    const tag = c(i.level, `[${i.level}]`);
    lines.push(`  ${ICON[i.level]} ${tag} ${i.code}: ${i.msg}`);
  }
  lines.push(`\n  ${res.counts.error} error / ${res.counts.warn} warn / ${res.counts.info} info`);
  lines.push(res.ok ? c('warn', '  结果: 可以发（建议先处理 warn）') : c('error', '  结果: 不能发（先修 error）'));
  return lines.join('\n');
}

export function formatJson(res) {
  return JSON.stringify(res, null, 2);
}
