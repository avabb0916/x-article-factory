# Changelog

## 0.1.0 — 2026-10-29

首个版本：

- `xaf check`：17 条内容规则（结构 / 平台限制 / 配图 / 写作质量 / 合规），支持 `--json` 与自定义配置
- `xaf figures`：本地渲染 5 类配图（cover / steps / table / checklist / quote），零 API、中文精确
- `xaf init`：生成文章骨架 + 图配置示例
- `node:test` 单元测试 7 个，覆盖解析、规则判定、图片尺寸
- 退出码语义：`0` 通过 / `1` 有 error / `2` 执行失败，方便接 CI
