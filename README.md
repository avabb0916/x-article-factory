# xaf · X 长文质量工具

**简体中文** | [English](README.en.md)

给长文做**发布前体检**：结构、配图、写作质量、合规风险，一条命令全查。
外加一个**本地配图生成器**：零 API、中文精确、可批量。

> 配套工具：[x-md-publisher](https://github.com/avabb0916/x-md-publisher)（把 Markdown 发成 X 文章草稿）
>
> ```bash
> xaf check article.md && xpub article.md
> ```
> **两者互相独立**：xaf 只判断"能不能发"，没有它 xpub 照样能建草稿。

## 为什么需要它

写长文时人会只看内容、忽略结构。而结构问题最致命：

- 多写了一个 `#`，读者以为文章结束了
- 用了表格和代码块，发到 X 上被整段丢弃
- 「不是X，是Y」写了九遍，读起来像 AI
- 配图路径写错，草稿里少了两张

这些**肉眼检查很容易漏**，但脚本一遍就能查出来。本文档最后有一段实测对比。

## 安装

```bash
git clone https://github.com/avabb0916/x-article-factory.git
cd x-article-factory
npm install
```

要求：Node.js ≥ 20（只有生成配图时才需要 Chrome）。

## 三种用法

### 1. 检查

```bash
xaf check article.md
```

输出：

```
article.md
  标题: 绑定域名时最容易错的那一步
  字数: 2141   二级标题: 10   配图: 5
  ! [warn] no-not-x-is-y: 「不是X，是Y」4 次（AI 味强信号），建议 ≤3
  ! [warn] no-table: 含 7 行表格
  0 error / 2 warn / 0 info
  结果: 可以发（建议先处理 warn）
```

退出码：`0` 通过 / `1` 有 error / `2` 执行失败 —— 可以直接接 CI。

```bash
xaf check article.md --json           # 给程序消费
xaf check article.md --config my.json # 覆盖规则
```

### 2. 编号与标题规范

```bash
xaf numbering article.md          # 检查
xaf numbering article.md --fix    # 自动重排
```

检查三件事：

- 中文序号是否从「一」起、是否连续（不跳号）
- 是否有标题缺编号
- 是否有名词短语标题（建议改成判断句）

`xaf check` 也会带出这三类提示。

### 3. 生成配图

```bash
xaf figures figures.json --out ./images
```

`figures.json`：

```json
{
  "figures": [
    { "name": "cover", "type": "cover", "kicker": "栏目", "title": "主标题<em>强调</em>", "sub": "副标", "brand": "品牌" },
    { "name": "steps", "type": "steps", "title": "三步走", "brand": "品牌",
      "steps": [{ "name": "1 第一步", "desc": "做什么", "verify": "怎么验证" }] },
    { "name": "checklist", "type": "checklist", "title": "自检", "items": ["项一", "项二"] }
  ]
}
```

内置 5 类模板：

| type | 尺寸 | 用途 |
|---|---|---|
| `cover` | 1600×640（5:2） | 文章封面 |
| `steps` | 1600×700 | 流程 / 步骤 |
| `table` | 1600×900 | 对照表（做成图，绕开平台不支持表格） |
| `checklist` | 1200×1400 | 竖版清单，适合收藏 |
| `quote` | 1400×700 | 金句卡 |

原理：本地 HTML → Chrome 截图。**中文绝对准确**（不用图像模型），秒级出图，零成本。

### 4. 初始化

```bash
xaf init my-article
# → my-article/article.md, figures.json, images/
```

## Markdown 里怎么引图

两种写法都认，路径相对 md 文件：

```markdown
![[images/steps.png]]
![](images/steps.png)
```

## 全部规则

17 条，分五类：结构 / 平台限制 / 配图 / 写作质量 / 合规。
见 [docs/RULES.md](docs/RULES.md)，也支持用自己的配置覆盖。

## 实测：它抓到了人眼漏掉的问题

一篇已经"觉得没问题"的文章，跑一遍抓出 5 项：

| 问题 | 人眼 | xaf |
|---|---|---|
| 11 个三级标题（平台会降级） | 漏 | ✓ |
| 字数只有 1555（以为 2400） | 漏 | ✓ |
| 配图 3 张（建议 5–9） | 漏 | ✓ |
| 「不是X，是Y」4 次 | 漏 | ✓ |
| 7 行表格 + 3 个代码块 | 漏 | ✓ |

改完再过一遍：`0 error / 0 warn`。

## 开发

```bash
npm test            # node:test，7 个用例
npm run check       # 检查示例文章
npm run figures     # 生成示例配图
```

加规则的三步写在 [docs/RULES.md](docs/RULES.md) 末尾。

## 项目结构

```
bin/xaf.mjs         CLI（check / figures / init）
lib/check.mjs       规则引擎
lib/rules.mjs       规则表与默认阈值
lib/parse.mjs       Markdown 解析
lib/figures.mjs     HTML→PNG 渲染
lib/image.mjs       图片尺寸读取（读文件头）
lib/report.mjs      人类可读 / JSON 输出
tests/              node:test 用例与 fixtures
docs/RULES.md
examples/           合格示例 + 可直接生成的图配置
```

## 配套工具

- [x-md-publisher](https://github.com/avabb0916/x-md-publisher) — Markdown → X 文章草稿
- [md2wechat](https://github.com/avabb0916/md2wechat) — Markdown → 公众号草稿
- [agent-skill-content-factory](https://github.com/avabb0916/agent-skill-content-factory) — 写作流程 Skill
- [x-article-template](https://github.com/avabb0916/x-article-template) — 内容仓库模板

## License

MIT
