# WeekBlocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Obsidian plugin that opens a dedicated weekly logging tab backed by one Markdown file per week, with fixed daily sections and custom time-block entries.

**Architecture:** The plugin uses Markdown as the source of truth. A dedicated `ItemView` renders a 7-column weekly log workspace, while parser and serializer modules convert between the weekly Markdown schema and structured in-memory data. A service layer handles vault I/O, week file creation, and refresh behavior.

**Tech Stack:** TypeScript, Obsidian Plugin API, esbuild, Vitest, official Obsidian sample-plugin structure

---

## File Structure

### Planned files

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `esbuild.config.mjs`
- Create: `manifest.json`
- Create: `versions.json`
- Create: `main.ts`
- Create: `styles.css`
- Create: `src/types.ts`
- Create: `src/constants.ts`
- Create: `src/date/week.ts`
- Create: `src/markdown/template.ts`
- Create: `src/markdown/parser.ts`
- Create: `src/markdown/serializer.ts`
- Create: `src/service/weekly-log-service.ts`
- Create: `src/view/weekly-log-view.ts`
- Create: `src/plugin.ts`
- Create: `tests/parser.test.ts`
- Create: `tests/serializer.test.ts`
- Create: `tests/roundtrip.test.ts`
- Create: `README.md`

### Responsibilities

- `main.ts`: Obsidian entrypoint that exports the plugin class
- `src/plugin.ts`: plugin bootstrap, command registration, view registration
- `src/view/weekly-log-view.ts`: dedicated tab UI and interaction logic
- `src/service/weekly-log-service.ts`: resolve, create, read, write week files
- `src/markdown/parser.ts`: parse weekly Markdown into structured data
- `src/markdown/serializer.ts`: convert structured data back into deterministic Markdown
- `src/markdown/template.ts`: generate new weekly file content
- `src/date/week.ts`: week id, start date, end date utilities
- `src/types.ts`: shared domain types
- `src/constants.ts`: schema labels, default slots, folder defaults, view type id
- `tests/*.test.ts`: parser, serializer, and round-trip coverage

### Constraints

- Keep V1 to a single weekly log schema
- Rewrite the full week file on save
- Prefer deterministic serialization over preserving arbitrary formatting
- Defer analytics, reminders, summaries, and third-party integrations

## Task 1: Initialize Plugin Scaffold

Already completed. Keep the current scaffold and reuse it as the base for the renamed plugin.

## Task 2: Rename The Scaffold To WeekBlocks

**Files:**
- Modify: `package.json`
- Modify: `manifest.json`
- Modify: `src/plugin.ts`

- [ ] **Step 1: Update package and manifest naming**

Set:

- package name: `obsidian-weekblocks`
- plugin id: `week-blocks`
- plugin name: `WeekBlocks`
- description: `Weekly Markdown work log with fixed day sections and custom time blocks.`

- [ ] **Step 2: Rename plugin class**

Use:

```ts
export default class WeekBlocksPlugin extends Plugin {
```

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit rename**

```bash
git add package.json manifest.json src/plugin.ts
git commit -m "chore: rename plugin to weekblocks"
```

## Task 3: Define Domain Types and Constants

**Files:**
- Create: `src/types.ts`
- Create: `src/constants.ts`

- [ ] **Step 1: Define weekly log types**

Include:

```ts
export interface WeeklyLog {
  weekId: string;
  startDate: string;
  endDate: string;
  slotNames: string[];
  days: DayLog[];
}
```

- [ ] **Step 2: Define day, slot, entry, and custom block types**

Include:

```ts
export interface LogEntry {
  time: string;
  tag: string;
  text: string;
}
```

and:

```ts
export interface CustomTimeBlock {
  startTime: string;
  endTime: string;
  tag: string;
  text: string;
}
```

- [ ] **Step 3: Implement constants**

Include:

```ts
export const VIEW_TYPE_WEEKLY_LOG = "week-blocks-view";
export const DEFAULT_WEEKLY_FOLDER = "Weekly";
export const DEFAULT_SLOT_NAMES = ["早上", "中午", "下午", "晚上"];
export const CUSTOM_BLOCKS_HEADING = "自定义时间块";
```

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit domain model**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: define weekblocks domain types"
```

## Task 4: Add Week Date Utilities

**Files:**
- Create: `src/date/week.ts`
- Test: `tests/serializer.test.ts`

- [ ] **Step 1: Write the failing test for current-week calculations**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `getWeekInfoFromDate()`**

Requirements:

- week starts on Monday
- dates are serialized as `YYYY-MM-DD`
- week id uses `YYYY-Www`

- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit date utility**

## Task 5: Generate New Weekly Log Template

**Files:**
- Create: `src/markdown/template.ts`
- Test: `tests/serializer.test.ts`

- [ ] **Step 1: Write the failing test for template generation**

Expected output should contain:

- `type: weekly-log`
- `# 2026-W15 周记录`
- `## 周一`
- `### 早上`
- `### 自定义时间块`

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `buildWeeklyLogTemplate()`**

Template rules:

- one section per day from Monday to Sunday
- each day contains `早上`, `中午`, `下午`, `晚上`
- each day ends with `自定义时间块`
- fixed sections start empty

- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit template generator**

## Task 6: Parse Weekly Markdown

**Files:**
- Create: `src/markdown/parser.ts`
- Create: `tests/parser.test.ts`

- [ ] **Step 1: Write the failing parser tests**

Cover:

- valid fixed-slot entries like `- 10:30 [开发] 写了插件设计文档`
- valid custom blocks like `- 09:30-11:00 [开发] 深度工作：插件结构设计`
- malformed fixed-slot entry rejection
- malformed custom block rejection
- missing day section rejection

- [ ] **Step 2: Run parser tests to verify they fail**
- [ ] **Step 3: Implement `parseWeeklyLog()`**

Requirements:

- read frontmatter fields `type`, `week`, `start`, `end`, `slots`
- enforce seven day sections in Monday-to-Sunday order
- parse fixed-slot entries as `- HH:MM [标签] 文本`
- parse custom blocks as `- HH:MM-HH:MM [标签] 文本`
- throw descriptive errors on invalid schema

- [ ] **Step 4: Run parser tests to verify they pass**
- [ ] **Step 5: Commit parser**

## Task 7: Serialize Weekly Logs Back To Markdown

**Files:**
- Create: `src/markdown/serializer.ts`
- Test: `tests/serializer.test.ts`
- Test: `tests/roundtrip.test.ts`

- [ ] **Step 1: Write the failing serializer tests**
- [ ] **Step 2: Run serializer tests to verify they fail**
- [ ] **Step 3: Implement `serializeWeeklyLog()`**

Requirements:

- deterministic frontmatter key ordering
- fixed day heading ordering
- fixed slot sections before custom blocks
- entry format preserved as `- HH:MM [标签] 文本`
- custom block format preserved as `- HH:MM-HH:MM [标签] 文本`

- [ ] **Step 4: Run serializer and round-trip tests**
- [ ] **Step 5: Commit serializer**

## Task 8: Implement Weekly Log Service

**Files:**
- Create: `src/service/weekly-log-service.ts`

- [ ] **Step 1: Define service API**

Include:

```ts
getCurrentWeekPath(): string;
ensureCurrentWeekFile(): Promise<TFile>;
readLog(file: TFile): Promise<WeeklyLog>;
saveLog(file: TFile, log: WeeklyLog): Promise<void>;
```

- [ ] **Step 2: Implement file resolution and creation**

Rules:

- folder defaults to `Weekly`
- filename format is `<weekId>.md`
- create missing folder if needed
- create file from template if absent

- [ ] **Step 3: Implement read and save methods**
- [ ] **Step 4: Run full test suite**
- [ ] **Step 5: Commit service layer**

## Task 9: Build Dedicated Weekly Log Tab View

**Files:**
- Create: `src/view/weekly-log-view.ts`
- Modify: `styles.css`

- [ ] **Step 1: Render a 7-column weekly layout**

Render:

- week header
- seven day columns
- fixed sections per day
- custom time block section per day

- [ ] **Step 2: Implement fixed-slot entry CRUD**

Behavior:

- append entry with `time`, `tag`, `text`
- edit existing entries
- delete entries

- [ ] **Step 3: Implement custom block CRUD**

Behavior:

- append block with `startTime`, `endTime`, `tag`, `text`
- validate time format before save
- delete row and re-save

- [ ] **Step 4: Implement error display**
- [ ] **Step 5: Build clean card-based CSS**

Style goals:

- full-width tab layout
- seven clear day columns
- light card treatment
- readable entry rows
- theme-compatible colors via Obsidian CSS variables

- [ ] **Step 6: Run build**
- [ ] **Step 7: Commit tab view**

## Task 10: Register View And Commands In The Plugin

**Files:**
- Modify: `main.ts`
- Modify: `src/plugin.ts`
- Modify: `src/view/weekly-log-view.ts`

- [ ] **Step 1: Register the view and commands**

Implement:

- register view type
- add command `Open Weekly Log`
- activate and reveal the dedicated view

- [ ] **Step 2: Add unload cleanup**
- [ ] **Step 3: Add file-change refresh logic**
- [ ] **Step 4: Run build**
- [ ] **Step 5: Commit plugin wiring**

## Task 11: Verify In Obsidian And Document Usage

**Files:**
- Create: `README.md`
- Modify: `manifest.json`
- Modify: `versions.json`

- [ ] **Step 1: Write README usage notes**

Include:

- plugin purpose
- expected weekly file schema
- how to open the weekly log tab
- where files are stored
- V1 limitations

- [ ] **Step 2: Build production bundle**
- [ ] **Step 3: Install plugin into a test vault manually**
- [ ] **Step 4: Perform manual verification**

Checklist:

- opening command creates current week file
- dedicated tab opens
- fixed-slot entries persist to Markdown
- custom blocks persist to Markdown
- direct file edits refresh the tab
- malformed entry lines show an error instead of corrupting the file

- [ ] **Step 5: Commit docs and release metadata**

## Risks To Watch During Implementation

- frontmatter parsing without pulling in unnecessary dependencies
- local timezone affecting week boundary calculations
- avoiding duplicate save loops when file modification events fire after plugin writes
- keeping the UI responsive while using full-file rewrites

## Execution Notes

- Follow TDD for parser, serializer, and date utilities first
- Keep commits frequent and scoped to one task
- Do not expand the schema until V1 is stable
- Prefer explicit validation and user-visible errors over silent recovery
