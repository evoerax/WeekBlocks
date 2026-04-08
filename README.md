# WeekBlocks

WeekBlocks is an Obsidian plugin for weekly work logging.

It keeps one Markdown file per week and gives you a dedicated tab to view and edit the whole week in one place.

## What It Does

- Opens a dedicated weekly log view inside Obsidian
- Stores one Markdown file per week in `Weekly/<weekId>.md`
- Splits each day into fixed sections:
  - `早上`
  - `中午`
  - `下午`
  - `晚上`
- Supports custom time blocks per day
- Uses Markdown as the source of truth

## Entry Format

Fixed-slot entry:

```md
- 10:30 [开发] 写了插件设计文档
```

Custom time block:

```md
- 09:30-11:00 [开发] 深度工作：插件结构设计
```

## Weekly File Format

Example:

```md
---
type: weekly-log
week: 2026-W15
start: 2026-04-06
end: 2026-04-12
slots:
  - 早上
  - 中午
  - 下午
  - 晚上
---

# 2026-W15 周记录

## 周一

### 早上
- 09:10 [沟通] 回复消息
- 10:30 [开发] 写了插件设计文档

### 中午

### 下午
- 14:00 [会议] 讨论需求

### 晚上
- 21:10 [复盘] 整理今天进展

### 自定义时间块
- 09:30-11:00 [开发] 深度工作：插件结构设计
```

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build the plugin:

```bash
npm run build
```

## Install In Obsidian

1. Build the plugin with `npm run build`
2. Copy these files into your vault at `.obsidian/plugins/week-blocks/`
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Reload Obsidian
4. Enable `WeekBlocks` in Community Plugins
5. Run the command `Open Weekly Log`

## Current V1 Limits

- No drag and drop
- No reminders
- No analytics
- No automatic summaries
- Strict weekly log schema

## License

MIT
