import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'AI Calendar & Task Organizer';
  activeTab = 'calendar';

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
