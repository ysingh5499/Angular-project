# Google Calendar Integration Setup Guide

This guide will help you connect your Google Calendar to the Motion AI-inspired Calendar & Task Organizer.

## 🔧 Setup Steps

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**
   - Create a new project or select an existing one
   - Note down your project ID

3. **Enable Google Calendar API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

### 2. Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"

2. **Configure OAuth Consent Screen** (if first time)
   - Choose "External" for user type
   - Fill in required fields:
     - App name: "Motion AI Calendar"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes: `https://www.googleapis.com/auth/calendar`

3. **Create OAuth Client ID**
   - Application type: "Web application"
   - Name: "Motion AI Calendar Client"
   - Authorized JavaScript origins:
     - `http://localhost:4200` (for development)
     - Your production domain (when deployed)
   - Authorized redirect URIs:
     - `http://localhost:4200` (for development)
     - Your production domain (when deployed)

4. **Get Your Credentials**
   - Copy the "Client ID" (looks like: `123456789-abc123.apps.googleusercontent.com`)

### 3. Create API Key (Optional - for additional features)

1. **Create API Key**
   - In "Credentials", click "Create Credentials" > "API key"
   - Copy the API key
   - Restrict the key to "Google Calendar API" for security

### 4. Update the Application Code

1. **Open the file**: `src/app/services/google-auth.service.ts`

2. **Replace the placeholder values**:
   ```typescript
   // Replace these lines:
   private readonly CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
   private readonly API_KEY = 'YOUR_GOOGLE_API_KEY';
   
   // With your actual values:
   private readonly CLIENT_ID = '123456789-abc123.apps.googleusercontent.com';
   private readonly API_KEY = 'AIzaSyB...'; // Optional
   ```

### 5. Test the Integration

1. **Restart your Angular app**:
   ```bash
   npm start
   ```

2. **Check the Google Calendar section**:
   - You should now see "Connect Google Calendar" instead of setup instructions
   - Click "Sign in with Google"
   - Grant permissions to access your calendar
   - Your Google Calendar events should now appear in the app!

## 🔒 Security Notes

- Never commit your API keys to version control
- Use environment variables for production deployments
- Restrict your API keys to specific APIs and domains
- Regularly rotate your credentials

## ✨ Features Enabled After Setup

Once connected, you'll have access to:

- **📅 Real Google Calendar Events**: View your actual calendar events
- **🤖 AI Scheduling to Google**: AI-scheduled tasks automatically create events in your Google Calendar
- **🔄 Two-way Sync**: Changes in Google Calendar appear in the app
- **📱 Cross-platform Access**: Events sync across all your devices

## 🐛 Troubleshooting

### "Sign in failed" Error
- Check that your Client ID is correct
- Verify that `localhost:4200` is in your authorized origins
- Make sure Google Calendar API is enabled

### Events Not Showing
- Check browser console for errors
- Verify API permissions are granted
- Try refreshing the calendar manually

### Demo Mode Still Active
- Ensure you've replaced both CLIENT_ID and API_KEY
- Restart the development server
- Clear browser cache if needed

## 🚀 Production Deployment

For production deployment:

1. **Update authorized domains** in Google Cloud Console
2. **Use environment variables** for credentials
3. **Enable HTTPS** for your domain
4. **Update redirect URIs** to match your production URL

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all setup steps were completed
3. Ensure your Google account has calendar access
4. Try testing with a fresh browser session

---

**Note**: The app works in demo mode without Google Calendar setup, but you'll get the full Motion AI experience with real calendar integration! 🎉