
export type IntervalUnit = 'days';
export type IntervalType = 'interval' | 'weekly' | 'once';

export interface Alarm {
  id: string;
  title: string;
  startDate: string; // ISO String
  intervalType: IntervalType;
  intervalValue: number; // for 'interval' type
  repeatDays: number[]; // for 'weekly' type (0-6, 0=Sun)
  intervalUnit: IntervalUnit;
  soundId: string;
  volume: number; // 0 to 100
  isActive: boolean;
  lastTriggeredAt?: string;
  nextTriggerAt: string;
}

export interface SoundOption {
  id: string;
  name: string;
  description: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CREATE = 'CREATE'
}
