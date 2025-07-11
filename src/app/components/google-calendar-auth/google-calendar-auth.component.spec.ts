import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleCalendarAuthComponent } from './google-calendar-auth.component';

describe('GoogleCalendarAuthComponent', () => {
  let component: GoogleCalendarAuthComponent;
  let fixture: ComponentFixture<GoogleCalendarAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoogleCalendarAuthComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleCalendarAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
