import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { TaskManagerComponent } from './components/task-manager/task-manager.component';
import { AiAssistantComponent } from './components/ai-assistant/ai-assistant.component';
import { GoogleCalendarAuthComponent } from './components/google-calendar-auth/google-calendar-auth.component';

@NgModule({
  declarations: [
    AppComponent,
    CalendarComponent,
    TaskManagerComponent,
    AiAssistantComponent,
    GoogleCalendarAuthComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
