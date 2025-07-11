import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { CalendarEvent, CalendarView } from '../models/event.model';
import { GoogleCalendarApiService } from './google-calendar-api.service';
import { GoogleAuthService } from './google-auth.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private localEventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  private googleEventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  private currentViewSubject = new BehaviorSubject<CalendarView>({
    type: 'month',
    date: new Date()
  });

  public events$: Observable<CalendarEvent[]>;
  public currentView$ = this.currentViewSubject.asObservable();

  constructor(
    private googleCalendarApi: GoogleCalendarApiService,
    private googleAuth: GoogleAuthService
  ) {
    this.loadInitialEvents();
    
    // Combine local and Google Calendar events
    this.events$ = combineLatest([
      this.localEventsSubject.asObservable(),
      this.googleEventsSubject.asObservable()
    ]).pipe(
      map(([localEvents, googleEvents]) => [...localEvents, ...googleEvents])
    );

    // Load Google Calendar events when user signs in
    this.googleAuth.isSignedIn$.subscribe(isSignedIn => {
      if (isSignedIn) {
        this.loadGoogleCalendarEvents();
      } else {
        this.googleEventsSubject.next([]);
      }
    });
  }

  private loadInitialEvents(): void {
    const sampleEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Team Meeting',
        description: 'Weekly team sync',
        startDate: new Date(2025, 6, 14, 10, 0),
        endDate: new Date(2025, 6, 14, 11, 0),
        allDay: false,
        color: '#3B82F6',
        category: 'meeting',
        location: 'Conference Room A',
        attendees: ['john@example.com', 'jane@example.com'],
        reminders: [{ id: '1', minutes: 15, type: 'notification' }]
      },
      {
        id: '2',
        title: 'Project Deadline',
        description: 'Calendar app deadline',
        startDate: new Date(2025, 6, 20, 0, 0),
        endDate: new Date(2025, 6, 20, 23, 59),
        allDay: true,
        color: '#EF4444',
        category: 'deadline',
        reminders: [
          { id: '2', minutes: 1440, type: 'notification' },
          { id: '3', minutes: 60, type: 'email' }
        ]
      }
    ];
    this.localEventsSubject.next(sampleEvents);
  }

  private loadGoogleCalendarEvents(): void {
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 3); // Load 3 months of events

    this.googleCalendarApi.getEvents(timeMin, timeMax).subscribe(
      events => {
        this.googleEventsSubject.next(events);
      },
      error => {
        console.error('Failed to load Google Calendar events:', error);
      }
    );
  }

  refreshGoogleCalendarEvents(): void {
    if (this.googleAuth.isSignedIn()) {
      this.loadGoogleCalendarEvents();
    }
  }

  getEvents(): Observable<CalendarEvent[]> {
    return this.events$;
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    // Combine both local and Google events
    const localEvents = this.localEventsSubject.value;
    const googleEvents = this.googleEventsSubject.value;
    const allEvents = [...localEvents, ...googleEvents];
    
    return allEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  getEventsForDateRange(startDate: Date, endDate: Date): CalendarEvent[] {
    // Combine both local and Google events
    const localEvents = this.localEventsSubject.value;
    const googleEvents = this.googleEventsSubject.value;
    const allEvents = [...localEvents, ...googleEvents];
    
    return allEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      return eventStart >= startDate && eventStart <= endDate;
    });
  }

  addEvent(event: Omit<CalendarEvent, 'id'>): void {
    const newEvent: CalendarEvent = {
      ...event,
      id: this.generateId()
    };

    // If user is signed in and the event is AI-generated, add to Google Calendar
    if (this.googleAuth.isSignedIn() && event.aiGenerated) {
      this.googleCalendarApi.createEvent(newEvent).subscribe(
        googleEvent => {
          if (googleEvent) {
            // Update the Google events list
            this.loadGoogleCalendarEvents();
          } else {
            // Fallback to local storage if Google Calendar fails
            const currentLocalEvents = this.localEventsSubject.value;
            this.localEventsSubject.next([...currentLocalEvents, newEvent]);
          }
        },
        error => {
          console.error('Failed to create Google Calendar event:', error);
          // Fallback to local storage
          const currentLocalEvents = this.localEventsSubject.value;
          this.localEventsSubject.next([...currentLocalEvents, newEvent]);
        }
      );
    } else {
      // Add to local events
      const currentLocalEvents = this.localEventsSubject.value;
      this.localEventsSubject.next([...currentLocalEvents, newEvent]);
    }
  }

  updateEvent(id: string, updates: Partial<CalendarEvent>): void {
    // Update local events
    const currentLocalEvents = this.localEventsSubject.value;
    const updatedLocalEvents = currentLocalEvents.map(event =>
      event.id === id ? { ...event, ...updates } : event
    );
    this.localEventsSubject.next(updatedLocalEvents);
    
    // Note: For Google Calendar events, you'd need to call the Google Calendar API
    // This is a simplified implementation focusing on local events
  }

  deleteEvent(id: string): void {
    // Delete from local events
    const currentLocalEvents = this.localEventsSubject.value;
    const filteredLocalEvents = currentLocalEvents.filter(event => event.id !== id);
    this.localEventsSubject.next(filteredLocalEvents);
    
    // Note: For Google Calendar events, you'd need to call the Google Calendar API
    // This is a simplified implementation focusing on local events
  }

  setView(view: CalendarView): void {
    this.currentViewSubject.next(view);
  }

  getCurrentView(): CalendarView {
    return this.currentViewSubject.value;
  }

  navigateView(direction: 'prev' | 'next'): void {
    const currentView = this.currentViewSubject.value;
    const newDate = new Date(currentView.date);

    switch (currentView.type) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }

    this.currentViewSubject.next({ ...currentView, date: newDate });
  }

  suggestOptimalMeetingTime(duration: number, participantAvailability: any[]): Date[] {
    const suggestions: Date[] = [];
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    for (let d = new Date(now); d <= nextWeek; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Weekdays only
        const morning = new Date(d);
        morning.setHours(9, 0, 0, 0);
        const afternoon = new Date(d);
        afternoon.setHours(14, 0, 0, 0);
        
        if (!this.hasConflict(morning, duration)) {
          suggestions.push(new Date(morning));
        }
        if (!this.hasConflict(afternoon, duration)) {
          suggestions.push(new Date(afternoon));
        }
      }
    }
    
    return suggestions.slice(0, 3);
  }

  private hasConflict(startTime: Date, duration: number): boolean {
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    const localEvents = this.localEventsSubject.value;
    const googleEvents = this.googleEventsSubject.value;
    const events = [...localEvents, ...googleEvents];
    
    return events.some((event: CalendarEvent) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (startTime < eventEnd && endTime > eventStart);
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}