# 规则清单

每条规则有 `level`：`error` 必须改，`warn` 建议改，`info` 知情即可。
可以用 `--config config.json` 覆盖阈值或改级别。

```json
{
  "rules": { "h2-min": { "level": "info" } },
  "banned": ["内部黑话A", "内部黑话B"],
  "risk": ["成人", "赌博"],
  "absolute": ["全网第一"]
}
```

## 结构

| code | level | 含义 | 为什么 |
|---|---|---|---|
| `title-required` | error | 缺标题 | 没标题的文章不该存在 |
| `single-h1` | error | 一级标题 >1 | 多 H1 在多数平台会被并入正文 |
| `h2-min` | warn | 二级标题 <5 | 长文需要可扫读的骨架 |
| `no-h3` | warn | 含三级标题 | X / 部分平台不支持 header-three |
| `word-min` | warn | 字数 <2000 | 长文的经验下限 |

## 平台限制

| code | level | 含义 |
|---|---|---|
| `no-table` | warn | 含表格（X 文章不支持） |
| `no-fence` | warn | 含代码块（X 文章不支持） |

## 配图

| code | level | 含义 |
|---|---|---|
| `image-min` | warn | 配图 <5 张 |
| `image-max` | warn | 配图 >9 张 |
| `image-exists` | error | 引用的图片文件不存在 |
| `cover-exists` | error | frontmatter 的封面不存在 |
| `cover-ratio` | warn | 封面不是 5:2（X 文章封面比例） |

## 写作质量

| code | level | 含义 | 说明 |
|---|---|---|---|
| `no-not-x-is-y` | warn | 「不是X，是Y」>3 次 | AI 味最强信号，留 2–3 处当强调即可 |
| `cta-tail` | warn | 结尾无提问 | 长文需要一个互动钩子 |
| `long-paragraph` | warn | 单段 >220 字 | 手机上会成块 |

## 合规

| code | level | 含义 |
|---|---|---|
| `banned-words` | error | 出现内部黑话（默认 TODO/内部黑话/BIP，可配） |
| `risk-words` | warn | 敏感词面（成人/赌博/翻墙…即便在否定语境也可能被机器召回） |
| `absolute-claim` | error | 绝对化承诺（全网第一 / 100%有效…） |
| `claim-number` | warn | 效果数字缺来源/样本说明 |

## 怎么加自己的规则

1. 在 `lib/rules.mjs` 的 `DEFAULT_RULES` 里加一条（code + level + desc）
2. 在 `lib/check.mjs` 里调用 `add('你的code', '说明')`
3. 在 `tests/` 里加一个 fixture 与断言
