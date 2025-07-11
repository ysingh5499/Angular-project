import { Injectable } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';
import { CalendarEvent } from '../models/event.model';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

declare const gapi: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarApiService {

  constructor(private googleAuth: GoogleAuthService) {}

  /**
   * Fetch events from Google Calendar
   */
  getEvents(timeMin?: Date, timeMax?: Date): Observable<CalendarEvent[]> {
    if (!this.googleAuth.isSignedIn() || !this.googleAuth.isGoogleCalendarConfigured()) {
      return of([]); // Return empty array if not authenticated or not configured
    }

    const request = {
      calendarId: 'primary',
      timeMin: timeMin ? timeMin.toISOString() : new Date().toISOString(),
      timeMax: timeMax ? timeMax.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime'
    };

    return from(gapi.client.calendar.events.list(request)).pipe(
      map((response: any) => {
        const events = response.result.items || [];
        return events.map((event: any) => this.convertGoogleEventToCalendarEvent(event));
      }),
      catchError(error => {
        console.error('Error fetching Google Calendar events:', error);
        return of([]);
      })
    );
  }

  /**
   * Create a new event in Google Calendar
   */
  createEvent(event: CalendarEvent): Observable<CalendarEvent | null> {
    if (!this.googleAuth.isSignedIn() || !this.googleAuth.isGoogleCalendarConfigured()) {
      return of(null);
    }

    const googleEvent = this.convertCalendarEventToGoogleEvent(event);

    return from(gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: googleEvent
    })).pipe(
      map((response: any) => {
        return this.convertGoogleEventToCalendarEvent(response.result);
      }),
      catchError(error => {
        console.error('Error creating Google Calendar event:', error);
        return of(null);
      })
    );
  }

  /**
   * Update an existing event in Google Calendar
   */
  updateEvent(eventId: string, event: CalendarEvent): Observable<CalendarEvent | null> {
    if (!this.googleAuth.isSignedIn() || !this.googleAuth.isGoogleCalendarConfigured()) {
      return of(null);
    }

    const googleEvent = this.convertCalendarEventToGoogleEvent(event);

    return from(gapi.client.calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: googleEvent
    })).pipe(
      map((response: any) => {
        return this.convertGoogleEventToCalendarEvent(response.result);
      }),
      catchError(error => {
        console.error('Error updating Google Calendar event:', error);
        return of(null);
      })
    );
  }

  /**
   * Delete an event from Google Calendar
   */
  deleteEvent(eventId: string): Observable<boolean> {
    if (!this.googleAuth.isSignedIn() || !this.googleAuth.isGoogleCalendarConfigured()) {
      return of(false);
    }

    return from(gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    })).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error deleting Google Calendar event:', error);
        return of(false);
      })
    );
  }

  /**
   * Get available time slots (free/busy information)
   */
  getFreeBusy(timeMin: Date, timeMax: Date): Observable<any> {
    if (!this.googleAuth.isSignedIn() || !this.googleAuth.isGoogleCalendarConfigured()) {
      return of({ calendars: {} });
    }

    const request = {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: 'primary' }]
    };

    return from(gapi.client.calendar.freebusy.query(request)).pipe(
      map((response: any) => response.result),
      catchError(error => {
        console.error('Error fetching free/busy information:', error);
        return of({ calendars: {} });
      })
    );
  }

  /**
   * Convert Google Calendar event to our CalendarEvent model
   */
  private convertGoogleEventToCalendarEvent(googleEvent: any): CalendarEvent {
    const startDate = googleEvent.start?.dateTime 
      ? new Date(googleEvent.start.dateTime)
      : new Date(googleEvent.start?.date || new Date());
    
    const endDate = googleEvent.end?.dateTime 
      ? new Date(googleEvent.end.dateTime)
      : new Date(googleEvent.end?.date || new Date());

    const allDay = !googleEvent.start?.dateTime;

    return {
      id: googleEvent.id || this.generateId(),
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      startDate: startDate,
      endDate: endDate,
      allDay: allDay,
      color: this.getEventColor(googleEvent),
      category: this.determineCategory(googleEvent.summary || ''),
      location: googleEvent.location || '',
      attendees: this.extractAttendees(googleEvent.attendees || []),
      reminders: this.extractReminders(googleEvent.reminders || {}),
      aiGenerated: false,
      relatedTaskId: undefined
    };
  }

  /**
   * Convert our CalendarEvent model to Google Calendar event
   */
  private convertCalendarEventToGoogleEvent(event: CalendarEvent): any {
    const googleEvent: any = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.allDay 
        ? { date: this.formatDateOnly(event.startDate) }
        : { dateTime: event.startDate.toISOString() },
      end: event.allDay 
        ? { date: this.formatDateOnly(event.endDate) }
        : { dateTime: event.endDate.toISOString() }
    };

    // Add attendees if any
    if (event.attendees && event.attendees.length > 0) {
      googleEvent.attendees = event.attendees.map(email => ({ email }));
    }

    // Add reminders
    if (event.reminders && event.reminders.length > 0) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: event.reminders.map(reminder => ({
          method: reminder.type === 'email' ? 'email' : 'popup',
          minutes: reminder.minutes
        }))
      };
    }

    return googleEvent;
  }

  private getEventColor(googleEvent: any): string {
    // Google Calendar color mapping to our color scheme
    const colorMap: { [key: string]: string } = {
      '1': '#7986CB', // Lavender
      '2': '#33B679', // Sage
      '3': '#8E24AA', // Grape
      '4': '#E67C73', // Flamingo
      '5': '#F6BF26', // Banana
      '6': '#F4511E', // Tangerine
      '7': '#039BE5', // Peacock
      '8': '#616161', // Graphite
      '9': '#3F51B5', // Blueberry
      '10': '#0B8043', // Basil
      '11': '#D50000'  // Tomato
    };

    return colorMap[googleEvent.colorId] || '#3B82F6';
  }

  private determineCategory(title: string): 'work' | 'personal' | 'meeting' | 'deadline' | 'other' {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('meeting') || lowerTitle.includes('call') || lowerTitle.includes('sync')) {
      return 'meeting';
    }
    if (lowerTitle.includes('deadline') || lowerTitle.includes('due')) {
      return 'deadline';
    }
    if (lowerTitle.includes('work') || lowerTitle.includes('project') || lowerTitle.includes('business')) {
      return 'work';
    }
    if (lowerTitle.includes('personal') || lowerTitle.includes('family') || lowerTitle.includes('doctor')) {
      return 'personal';
    }
    
    return 'other';
  }

  private extractAttendees(googleAttendees: any[]): string[] {
    return googleAttendees
      .filter(attendee => attendee.email)
      .map(attendee => attendee.email);
  }

  private extractReminders(googleReminders: any): any[] {
    if (!googleReminders.overrides) return [];
    
    return googleReminders.overrides.map((reminder: any, index: number) => ({
      id: `reminder_${index}`,
      minutes: reminder.minutes,
      type: reminder.method === 'email' ? 'email' : 'notification'
    }));
  }

  private formatDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}