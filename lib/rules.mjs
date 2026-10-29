// 规则集：每条规则返回 {level, code, msg}
// level: error（必须改）| warn（建议改）| info（知情即可）
export const DEFAULT_RULES = {
  // 结构
  'title-required': { level: 'error', desc: '必须有标题（frontmatter title 或第一个 # 标题）' },
  'single-h1': { level: 'error', desc: '只允许一个一级标题' },
  'h2-min': { level: 'warn', desc: '二级标题建议 ≥5 个（长文可扫读）' },
  'no-h3': { level: 'warn', desc: '三级标题在 X / 多数平台不支持，会被降级' },
  'word-min': { level: 'warn', desc: '长文字数建议 ≥2000（中文计字 + 英文计词）' },

  // 平台限制
  'no-table': { level: 'warn', desc: '表格在 X 文章不支持，会被丢弃' },
  'no-fence': { level: 'warn', desc: '代码块在 X 文章不支持，会被丢弃' },

  // 配图
  'image-min': { level: 'warn', desc: '配图建议 ≥5 张' },
  'image-max': { level: 'warn', desc: '配图建议 ≤9 张（过多会打断阅读）' },
  'image-exists': { level: 'error', desc: '配图文件必须存在' },
  'cover-exists': { level: 'error', desc: 'frontmatter 指定的封面必须存在' },
  'cover-ratio': { level: 'warn', desc: 'X 文章封面建议 5:2' },

  // 写作质量
  'no-not-x-is-y': { level: 'warn', desc: '「不是X，是Y」密度 ≤3（AI 味最强信号）' },
  'cta-tail': { level: 'warn', desc: '结尾应有一句提问 / 互动引导' },
  'long-paragraph': { level: 'warn', desc: '单段建议 ≤220 字（手机阅读）' },

  // 合规
  'banned-words': { level: 'error', desc: '不出现内部黑话 / 未公开信息' },
  'risk-words': { level: 'warn', desc: '敏感词面（即使否定语境也可能被机器召回）' },
  'claim-number': { level: 'warn', desc: '效果数字需带来源/样本说明' },
  'absolute-claim': { level: 'error', desc: '绝对化承诺需有依据' },
};

export const DEFAULTS = {
  banned: ['TODO', '内部黑话', 'BIP'],
  risk: ['成人', '赌博', '博彩', '盗版', '翻墙', '代注册', '荐股'],
  absolute: ['全网第一', '100%有效', '永久有效', '保证赚钱'],
  headKeywords: [],
};
