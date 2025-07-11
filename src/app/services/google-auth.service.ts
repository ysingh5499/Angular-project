import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

declare const gapi: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private isSignedInSubject = new BehaviorSubject<boolean>(false);
  private userProfileSubject = new BehaviorSubject<any>(null);
  
  public isSignedIn$ = this.isSignedInSubject.asObservable();
  public userProfile$ = this.userProfileSubject.asObservable();

  // Using a placeholder client ID - replace with your own for production
  private readonly CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  private readonly API_KEY = '';
  private readonly DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  private readonly SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

  private gapi: any;
  private authInstance: any;

  constructor() {
    this.initializeGapi();
  }

  private async initializeGapi(): Promise<void> {
    try {
      // Load the Google Identity Services script
      await this.loadGoogleIdentityScript();
      
      // Initialize Google Identity Services for one-click sign-in
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: this.CLIENT_ID,
          callback: this.handleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: false
        });
      }

      // Load GAPI for Calendar API
      await this.loadGapiScript();
      
      if (this.gapi) {
        await new Promise((resolve) => {
          this.gapi.load('client:auth2', resolve);
        });

        await this.gapi.client.init({
          apiKey: this.API_KEY,
          clientId: this.CLIENT_ID,
          discoveryDocs: [this.DISCOVERY_DOC],
          scope: this.SCOPES
        });

        this.authInstance = this.gapi.auth2.getAuthInstance();
        
        // Check if user is already signed in
        if (this.authInstance && this.authInstance.isSignedIn.get()) {
          this.handleSignInSuccess();
        }
        
        // Listen for sign-in state changes
        if (this.authInstance) {
          this.authInstance.isSignedIn.listen(this.handleSignInStateChange.bind(this));
        }
      }

    } catch (error) {
      console.log('🔧 Using demo mode - Google Calendar not configured');
      this.initializeDemoMode();
    }
  }

  private loadGoogleIdentityScript(): Promise<void> {
    return new Promise((resolve) => {
      // Check if Google Identity Services is already loaded
      if ((window as any).google?.accounts) {
        resolve();
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => {
        console.log('Google Identity Services not available, using demo mode');
        resolve(); // Continue with demo mode
      };
      document.head.appendChild(script);
    });
  }

  private loadGapiScript(): Promise<void> {
    return new Promise((resolve) => {
      // Check if gapi is already loaded
      if (typeof gapi !== 'undefined') {
        this.gapi = gapi;
        resolve();
        return;
      }

      // Load gapi script dynamically
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.gapi = (window as any).gapi;
        resolve();
      };
      script.onerror = () => {
        console.log('Google API script not available, using demo mode');
        resolve(); // Continue with demo mode
      };
      document.head.appendChild(script);
    });
  }

  private handleCredentialResponse(response: any): void {
    try {
      // Decode the JWT token to get user info
      const userInfo = this.parseJwt(response.credential);
      
      this.userProfileSubject.next({
        id: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture,
        demo: false
      });
      
      this.isSignedInSubject.next(true);
      
      // Now sign in to get calendar access
      this.signInForCalendarAccess();
      
    } catch (error) {
      console.error('Error handling credential response:', error);
    }
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return {};
    }
  }

  private async signInForCalendarAccess(): Promise<void> {
    try {
      if (this.authInstance) {
        await this.authInstance.signIn({
          scope: this.SCOPES
        });
      }
    } catch (error) {
      console.log('Calendar access not granted, using basic profile only');
    }
  }

  private initializeDemoMode(): void {
    console.log('🔧 Demo Mode: Google Calendar not configured');
    console.log('To enable Google Calendar integration:');
    console.log('1. Go to Google Cloud Console');
    console.log('2. Create a project and enable Calendar API');
    console.log('3. Create credentials (OAuth 2.0 client ID)');
    console.log('4. Update CLIENT_ID and API_KEY in google-auth.service.ts');
    
    // Set demo user for development
    this.userProfileSubject.next({
      name: 'Demo User',
      email: 'demo@example.com',
      picture: '',
      demo: true
    });
  }

  private handleSignInStateChange(isSignedIn: boolean): void {
    this.isSignedInSubject.next(isSignedIn);
    
    if (isSignedIn) {
      this.handleSignInSuccess();
    } else {
      this.userProfileSubject.next(null);
    }
  }

  private handleSignInSuccess(): void {
    if (!this.authInstance) return;
    
    const user = this.authInstance.currentUser.get();
    const profile = user.getBasicProfile();
    
    this.userProfileSubject.next({
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      picture: profile.getImageUrl(),
      demo: false
    });
    
    this.isSignedInSubject.next(true);
  }

  async signIn(): Promise<void> {
    try {
      if (!this.authInstance) {
        throw new Error('Google Auth not initialized');
      }
      
      await this.authInstance.signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (!this.authInstance) {
        throw new Error('Google Auth not initialized');
      }
      
      await this.authInstance.signOut();
      this.isSignedInSubject.next(false);
      this.userProfileSubject.next(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  isSignedIn(): boolean {
    return this.isSignedInSubject.value;
  }

  getUserProfile(): any {
    return this.userProfileSubject.value;
  }

  getAuthToken(): string | null {
    if (!this.authInstance || !this.authInstance.isSignedIn.get()) {
      return null;
    }
    
    const user = this.authInstance.currentUser.get();
    return user.getAuthResponse().access_token;
  }

  // Method to check if Google Calendar is properly configured
  isGoogleCalendarConfigured(): boolean {
    return this.CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  }
}