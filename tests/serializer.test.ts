import { describe, expect, it } from "vitest";
import { getWeekInfoFromDate } from "../src/date/week";

describe("getWeekInfoFromDate", () => {
  it("returns week id and monday-sunday bounds", () => {
    const result = getWeekInfoFromDate(new Date("2026-04-08T12:00:00Z"));
    expect(result.weekId).toBe("2026-W15");
    expect(result.startDate).toBe("2026-04-06");
    expect(result.endDate).toBe("2026-04-12");
  });
});
