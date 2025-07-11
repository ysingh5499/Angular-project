export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color: string;
  category: 'work' | 'personal' | 'meeting' | 'deadline' | 'other';
  location?: string;
  attendees?: string[];
  reminders: Reminder[];
  aiGenerated?: boolean;
  relatedTaskId?: string;
}

export interface Reminder {
  id: string;
  minutes: number; // minutes before event
  type: 'notification' | 'email';
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  date: Date;
}