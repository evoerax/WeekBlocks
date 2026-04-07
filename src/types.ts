import {
  DEFAULT_SLOT_NAMES,
  WEEKDAY_KEYS,
  WEEKDAY_TITLES,
} from "./constants";

export type DayKey = (typeof WEEKDAY_KEYS)[number];
export type DayTitle = (typeof WEEKDAY_TITLES)[number];
export type DefaultSlotName = (typeof DEFAULT_SLOT_NAMES)[number];

export interface LogEntry {
  time: string;
  tag: string;
  text: string;
}

export interface SlotLog {
  slotName: string;
  entries: LogEntry[];
}

export interface CustomTimeBlock {
  startTime: string;
  endTime: string;
  tag: string;
  text: string;
}

export interface DayLog {
  dayKey: DayKey;
  title: DayTitle;
  slotLogs: SlotLog[];
  customBlocks: CustomTimeBlock[];
}

export interface WeeklyLog {
  weekId: string;
  startDate: string;
  endDate: string;
  slotNames: string[];
  days: DayLog[];
}
