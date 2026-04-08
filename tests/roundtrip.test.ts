import { describe, expect, it } from "vitest";
import { parseWeeklyLog } from "../src/markdown/parser";
import { serializeWeeklyLog } from "../src/markdown/serializer";

describe("weekly log markdown round-trip", () => {
  it("round-trips through parse and serialize", () => {
    const markdown = `---
type: weekly-log
week: 2026-W15
start: 2026-04-06
end: 2026-04-12
owner: leon
slots:
  - 早上
  - 中午
  - 下午
---

# 2026-W15 周记录

## 周一

### 早上

- 08:00 [计划] 安排本周任务

### 中午

### 下午

- 15:00 [开发] 实现序列化器

### 自定义时间块

- 09:30-11:00 [沟通] 评审接口设计

## 周二

### 早上

### 中午

### 下午

### 自定义时间块

## 周三

### 早上

### 中午

### 下午

### 自定义时间块

## 周四

### 早上

### 中午

### 下午

### 自定义时间块

## 周五

### 早上

### 中午

### 下午

### 自定义时间块

## 周六

### 早上

### 中午

### 下午

### 自定义时间块

## 周日

### 早上

### 中午

### 下午

### 自定义时间块
`;

    const parsed = parseWeeklyLog(markdown);
    const serialized = serializeWeeklyLog(parsed);
    const reparsed = parseWeeklyLog(serialized);

    expect(reparsed).toEqual(parsed);
  });
});
