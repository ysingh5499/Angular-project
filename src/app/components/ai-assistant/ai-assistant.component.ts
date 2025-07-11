import { Component, OnInit } from '@angular/core';
import { AIService } from '../../services/ai.service';
import { TaskService } from '../../services/task.service';
import { CalendarService } from '../../services/calendar.service';
import { Task } from '../../models/task.model';
import { CalendarEvent } from '../../models/event.model';

@Component({
  selector: 'app-ai-assistant',
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.css']
})
export class AiAssistantComponent implements OnInit {
  tasks: Task[] = [];
  events: CalendarEvent[] = [];
  
  recommendations: {
    type: 'productivity' | 'organization' | 'planning',
    title: string,
    description: string,
    action?: string
  }[] = [];
  
  schedulingSuggestions: {
    task: Task,
    suggestedTime: Date,
    reason: string,
    confidence: number
  }[] = [];

  isVisible = false;

  constructor(
    private aiService: AIService,
    private taskService: TaskService,
    private calendarService: CalendarService
  ) { }

  ngOnInit(): void {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
      this.updateRecommendations();
    });

    this.calendarService.getEvents().subscribe(events => {
      this.events = events;
      this.updateSchedulingSuggestions();
    });
  }

  toggleVisibility(): void {
    this.isVisible = !this.isVisible;
  }

  private updateRecommendations(): void {
    this.recommendations = this.aiService.generateSmartTaskRecommendations(this.tasks);
  }

  private updateSchedulingSuggestions(): void {
    this.schedulingSuggestions = this.aiService.suggestOptimalScheduling(this.tasks, this.events);
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  scheduleTask(suggestion: { task: Task, suggestedTime: Date, reason: string, confidence: number }): void {
    // Create a calendar event for the suggested task
    this.calendarService.addEvent({
      title: `🤖 ${suggestion.task.title}`,
      description: suggestion.task.description,
      startDate: suggestion.suggestedTime,
      endDate: new Date(suggestion.suggestedTime.getTime() + (suggestion.task.estimatedTime || 60) * 60 * 1000),
      allDay: false,
      color: this.getTaskPriorityColor(suggestion.task.priority),
      category: 'work',
      reminders: [{ id: 'auto', minutes: 15, type: 'notification' }],
      aiGenerated: true,
      relatedTaskId: suggestion.task.id
    });

    // Update task status to in-progress
    this.taskService.updateTask(suggestion.task.id, { status: 'in-progress' });
    
    // Remove the suggestion
    this.schedulingSuggestions = this.schedulingSuggestions.filter(s => s.task.id !== suggestion.task.id);
  }

  autoScheduleAllTasks(): void {
    const todoTasks = this.tasks.filter(task => task.status === 'todo');
    let scheduledCount = 0;

    todoTasks.forEach(task => {
      const scheduledEvent = this.aiService.autoScheduleTask(task, this.events);
      if (scheduledEvent) {
        this.calendarService.addEvent(scheduledEvent);
        this.taskService.updateTask(task.id, { status: 'in-progress' });
        scheduledCount++;
      }
    });

    // Update suggestions after auto-scheduling
    this.updateSchedulingSuggestions();
    
    // You could add a notification here about how many tasks were scheduled
    console.log(`Auto-scheduled ${scheduledCount} tasks`);
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#10B981'; // High confidence - green
    if (confidence >= 0.6) return '#F59E0B'; // Medium confidence - yellow
    return '#EF4444'; // Low confidence - red
  }

  getConfidenceText(confidence: number): string {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  }

  private getTaskPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  }

  getRecommendationIcon(type: string): string {
    switch (type) {
      case 'productivity': return '⚡';
      case 'organization': return '📋';
      case 'planning': return '🎯';
      default: return '💡';
    }
  }

  getRecommendationColor(type: string): string {
    switch (type) {
      case 'productivity': return '#10B981';
      case 'organization': return '#3B82F6';
      case 'planning': return '#8B5CF6';
      default: return '#6B7280';
    }
  }
}
