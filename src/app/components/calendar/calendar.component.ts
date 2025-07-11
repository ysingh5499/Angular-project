import { Component, OnInit } from '@angular/core';
import { CalendarService } from '../../services/calendar.service';
import { CalendarEvent, CalendarView } from '../../models/event.model';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  events: CalendarEvent[] = [];
  currentView: CalendarView = { type: 'month', date: new Date() };
  calendarDays: Date[] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(private calendarService: CalendarService) {}

  ngOnInit(): void {
    this.calendarService.events$.subscribe(events => {
      this.events = events;
    });

    this.calendarService.currentView$.subscribe(view => {
      this.currentView = view;
      this.generateCalendarDays();
    });

    this.generateCalendarDays();
  }

  generateCalendarDays(): void {
    if (this.currentView.type === 'month') {
      const year = this.currentView.date.getFullYear();
      const month = this.currentView.date.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      this.calendarDays = [];
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        this.calendarDays.push(date);
      }
    } else if (this.currentView.type === 'week') {
      const startOfWeek = new Date(this.currentView.date);
      startOfWeek.setDate(this.currentView.date.getDate() - this.currentView.date.getDay());
      
      this.calendarDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        this.calendarDays.push(date);
      }
    } else {
      // Day view
      this.calendarDays = [new Date(this.currentView.date)];
    }
  }

  setView(type: 'month' | 'week' | 'day'): void {
    this.calendarService.setView({ type, date: this.currentView.date });
  }

  navigate(direction: 'prev' | 'next'): void {
    this.calendarService.navigateView(direction);
  }

  goToToday(): void {
    this.calendarService.setView({ type: this.currentView.type, date: new Date() });
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    return this.calendarService.getEventsForDate(date);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentView.date.getMonth();
  }

  onDateClick(date: Date): void {
    this.calendarService.setView({ type: 'day', date });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getCurrentMonthYear(): string {
    return `${this.months[this.currentView.date.getMonth()]} ${this.currentView.date.getFullYear()}`;
  }

  getWeekRange(): string {
    const startOfWeek = new Date(this.currentView.date);
    startOfWeek.setDate(this.currentView.date.getDate() - this.currentView.date.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startMonth = this.months[startOfWeek.getMonth()];
    const endMonth = this.months[endOfWeek.getMonth()];
    
    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startMonth} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
    } else {
      return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
    }
  }

  getDayDate(): string {
    return this.currentView.date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
