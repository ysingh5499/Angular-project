import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { GoogleAuthService } from '../../services/google-auth.service';
import { CalendarService } from '../../services/calendar.service';

@Component({
  selector: 'app-google-calendar-auth',
  templateUrl: './google-calendar-auth.component.html',
  styleUrls: ['./google-calendar-auth.component.css']
})
export class GoogleCalendarAuthComponent implements OnInit, AfterViewInit {
  @ViewChild('googleSignInButton', { static: false }) googleSignInButton!: ElementRef;
  
  isSignedIn = false;
  userProfile: any = null;
  isLoading = false;
  isConfigured = false;

  constructor(
    private googleAuth: GoogleAuthService,
    private calendarService: CalendarService
  ) { }

  ngOnInit(): void {
    this.isConfigured = this.googleAuth.isGoogleCalendarConfigured();
    
    this.googleAuth.isSignedIn$.subscribe(signedIn => {
      this.isSignedIn = signedIn;
    });

    this.googleAuth.userProfile$.subscribe(profile => {
      this.userProfile = profile;
    });
  }

  ngAfterViewInit(): void {
    // Initialize Google One Tap sign-in button after view is ready
    if (this.isConfigured && !this.isSignedIn) {
      this.initializeGoogleSignInButton();
    }
  }

  private initializeGoogleSignInButton(): void {
    // Wait for Google Identity Services to be available
    const checkGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        this.renderGoogleSignInButton();
      } else {
        setTimeout(checkGoogle, 100);
      }
    };
    checkGoogle();
  }

  private renderGoogleSignInButton(): void {
    if (!this.googleSignInButton?.nativeElement) return;

    // Render the Google One Tap sign-in button
    (window as any).google.accounts.id.renderButton(
      this.googleSignInButton.nativeElement,
      {
        theme: 'filled_blue',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
        width: 300
      }
    );

    // Also show the One Tap prompt for account picker
    (window as any).google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('One Tap prompt not shown');
      }
    });
  }

  async signIn(): Promise<void> {
    this.isLoading = true;
    try {
      await this.googleAuth.signIn();
      // Refresh calendar events after sign in
      this.calendarService.refreshGoogleCalendarEvents();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async signOut(): Promise<void> {
    this.isLoading = true;
    try {
      await this.googleAuth.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      this.isLoading = false;
    }
  }

  refreshCalendar(): void {
    this.calendarService.refreshGoogleCalendarEvents();
  }
}
