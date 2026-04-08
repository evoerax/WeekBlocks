# WeekBlocks Plugin Design

## Overview

WeekBlocks is an Obsidian plugin for weekly work logging. The primary interaction model is:

- one Markdown file per week
- one dedicated tab view for browsing and editing that week's log
- each day split into fixed sections: `早上`, `中午`, `下午`, `晚上`
- free-form log entries inside each section
- optional custom time blocks for more precise activity logging
- Markdown as the source of truth

The plugin is intended for recording what was actually done, with support for both real-time capture and end-of-day backfilling.

## Goals

- Review a full week in one place
- Log actual activity by day and time section
- Support two recording modes:
  - quick append while work is happening
  - backfill later in the day
- Keep data readable and editable in Markdown
- Provide a clean dedicated tab view rather than forcing users to edit structure manually

## Non-Goals For V1

- Task planning or scheduling
- Drag-and-drop interactions
- Conflict detection
- Notifications or reminders
- Automatic summaries
- Deep integration with third-party calendar or tasks plugins

## User Experience

### Primary Workflow

1. User runs a command such as `Open Weekly Log`
2. Plugin resolves the current week file
3. If the file does not exist, plugin creates it from a template
4. Plugin opens a dedicated tab view
5. The view renders Monday through Sunday in a 7-column weekly layout
6. Each day shows fixed sections first, then optional custom time blocks
7. User appends, edits, or removes log entries
8. Any edit in the view is written back to the week Markdown file
9. If the Markdown file is edited directly, the view can re-parse and refresh

### View Choice

V1 uses a dedicated tab view rather than a sidebar. A weekly log benefits from full-width layout and should feel like a weekly workspace, not a narrow utility panel.

## Markdown Storage Model

### File Location

Example path:

`Weekly/2026-W15.md`

### Frontmatter

```yaml
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
```

### Body Format

```md
# 2026-W15 周记录

## 周一

### 早上
- 09:10 [沟通] 回复消息
- 10:30 [开发] 写了插件设计文档

### 中午
- 12:20 [生活] 吃饭

### 下午
- 14:00 [会议] 讨论需求
- 16:30 [开发] 整理实现计划

### 晚上
- 21:10 [复盘] 整理今天进展

### 自定义时间块
- 09:30-11:00 [开发] 深度工作：插件结构设计

## 周二

### 早上

### 中午

### 下午

### 晚上

### 自定义时间块
```

### Entry Formats

Fixed-slot entry format:

```md
- 10:30 [开发] 写了插件设计文档
```

Custom block entry format:

```md
- 09:30-11:00 [开发] 深度工作：插件结构设计
```

### Why This Format

- human-readable without the plugin
- stable enough for structured parsing
- compatible with Obsidian search and plain-text workflows
- time and tag stay visible in the note itself
- no artificial summary field in V1

## Data Model

### WeeklyLog

- `weekId`: ISO-like week id such as `2026-W15`
- `startDate`: start of the week
- `endDate`: end of the week
- `slotNames`: fixed slot list, defaulting to `早上`, `中午`, `下午`, `晚上`
- `days`: seven day entries from Monday to Sunday

### DayLog

- `dayKey`: one of Monday through Sunday
- `title`: localized display title such as `周一`
- `slotLogs`: ordered list of fixed-slot sections
- `customBlocks`: ordered list of custom time block entries

### SlotLog

- `slotName`: one of the configured fixed slot names
- `entries`: ordered list of log entries

### LogEntry

- `time`: string in `HH:MM`
- `tag`: string taken from `[标签]`
- `text`: free-form description

### CustomTimeBlock

- `startTime`: string in `HH:MM`
- `endTime`: string in `HH:MM`
- `tag`: string taken from `[标签]`
- `text`: free-form description

## Plugin Architecture

V1 should be split into the following modules.

### `WeeklyLogView`

Responsible for the dedicated tab UI:

- render current week
- render 7-column day layout
- append, edit, and delete slot entries
- append, edit, and delete custom time blocks
- trigger saves
- surface parse and save errors

### `WeeklyLogParser`

Responsible for converting Markdown into structured data:

- validate frontmatter marker usage
- locate daily sections
- parse fixed slot sections and list items
- parse custom block lines
- fail clearly when structure is invalid

### `WeeklyLogSerializer`

Responsible for converting structured data back into Markdown:

- generate deterministic frontmatter
- generate consistent heading structure
- preserve plugin-supported schema

### `WeeklyLogService`

Responsible for Obsidian integration:

- resolve current week file path
- create file from template
- read and write vault files
- reload data when files change
- expose command handlers

## Data Flow

### Open Flow

1. User opens weekly log command
2. Service resolves current week path
3. Service creates missing file if needed
4. Service reads file contents
5. Parser converts Markdown to `WeeklyLog`
6. View renders the result

### Edit Flow

1. User appends or edits an entry in the view
2. View updates in-memory state
3. Serializer converts state to Markdown
4. Service writes entire file back to the vault
5. View reflects saved state

### External Edit Flow

1. User edits the same week file directly in Markdown
2. Plugin receives file change event
3. Service re-reads contents
4. Parser re-parses the file
5. View refreshes if parsing succeeds

## Error Handling

V1 should prefer explicit failure over silent corruption.

### Parse Errors

If the week file does not follow the expected structure:

- show a clear notice in the view
- avoid overwriting the file
- allow user to open the underlying Markdown and fix it manually

### Save Errors

If vault write fails:

- show a notice
- keep in-memory edits visible if possible
- allow retry

### Invalid Fixed-Slot Entries

If a slot entry does not match `- HH:MM [标签] 文本`:

- reject the edit in the UI
- show inline feedback or a notice

### Invalid Custom Time Blocks

If a custom block does not match `- HH:MM-HH:MM [标签] 文本`:

- reject the edit in the UI
- show inline feedback or a notice

## Command Surface

V1 should include at least:

- `Open Weekly Log`
- `Open Current Week Log`
- optional: `Create Current Week Log`

The first two may resolve to the same behavior in V1.

## Testing Strategy

### Unit Tests

- parse a valid week file into the expected structure
- serialize structure back into the expected Markdown
- round-trip parse -> serialize -> parse remains stable
- reject malformed day sections
- reject malformed fixed-slot entry lines
- reject malformed custom time block lines

### Integration Tests

- create a missing week file from template
- open the dedicated tab on the current week
- append and edit fixed-slot entries and confirm Markdown writeback
- add and delete custom time blocks and confirm Markdown writeback
- refresh view after direct file edits

## Risks

### Schema Fragility

Markdown is user-editable. If users freely change headings or section names, parsing becomes unreliable. V1 mitigates this by supporting one explicit schema and warning on invalid files.

### Full-File Rewrite

V1 rewrites the entire weekly file on save. This is acceptable because the file format is tightly controlled and limited in scope. Partial text patching is unnecessary complexity for the first release.

### Future Extensibility

The schema should leave room for later additions such as:

- optional summaries
- activity counts by tag
- daily highlights
- filters by tag
- lightweight analytics

## Recommendation

Build V1 as a structured Markdown-backed weekly log with a dedicated tab view. This fits Obsidian's text-first model while still giving a much better capture and review experience than raw notes.
