import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { CalendarEvent } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class AIService {

  constructor() { }

  generateTaskSuggestions(task: Task): string[] {
    const suggestions: string[] = [];
    
    // Priority-based suggestions
    if (task.priority === 'high' && !task.dueDate) {
      suggestions.push('⏰ Add a due date - high priority tasks should have clear deadlines');
    }
    
    if (task.priority === 'low' && task.estimatedTime && task.estimatedTime > 120) {
      suggestions.push('🔄 Consider breaking this into smaller, more manageable tasks');
    }
    
    // Time-based suggestions
    if (task.estimatedTime && task.estimatedTime > 240) {
      suggestions.push('📋 Large task detected - consider creating subtasks for better tracking');
    }
    
    if (task.estimatedTime && task.estimatedTime < 15) {
      suggestions.push('⚡ Quick task - perfect for filling short time gaps');
    }
    
    // Tag suggestions
    if (task.tags.length === 0) {
      suggestions.push('🏷️ Add tags to improve organization and filtering');
    }
    
    // Due date suggestions
    if (task.dueDate) {
      const daysUntilDue = this.getDaysUntilDate(task.dueDate);
      if (daysUntilDue < 1 && task.status !== 'completed') {
        suggestions.push('🚨 Due today! Consider prioritizing this task');
      } else if (daysUntilDue < 3 && task.status === 'todo') {
        suggestions.push('⚠️ Due soon - consider moving to In Progress');
      }
    }
    
    // Status-based suggestions
    if (task.status === 'in-progress') {
      const daysSinceUpdate = this.getDaysSinceDate(task.updatedAt);
      if (daysSinceUpdate > 3) {
        suggestions.push('🔄 Task has been in progress for a while - need an update?');
      }
    }
    
    // Description suggestions
    if (!task.description && task.priority === 'high') {
      suggestions.push('📝 Add description for better context and clarity');
    }
    
    return suggestions;
  }

  suggestOptimalScheduling(tasks: Task[], events: CalendarEvent[]): {
    task: Task,
    suggestedTime: Date,
    reason: string,
    confidence: number
  }[] {
    const suggestions: {
      task: Task,
      suggestedTime: Date,
      reason: string,
      confidence: number
    }[] = [];
    
    const todoTasks = tasks.filter(task => task.status === 'todo');
    
    todoTasks.forEach(task => {
      const optimalSlots = this.findIntelligentTimeSlots(task, events);
      optimalSlots.forEach(slot => {
        suggestions.push({
          task,
          suggestedTime: slot.time,
          reason: slot.reason,
          confidence: slot.confidence
        });
      });
    });
    
    // Sort by confidence score and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
  }

  findIntelligentTimeSlots(task: Task, events: CalendarEvent[]): {
    time: Date,
    reason: string,
    confidence: number
  }[] {
    const slots: {
      time: Date,
      reason: string,
      confidence: number
    }[] = [];
    
    const taskDuration = task.estimatedTime || 60; // minutes
    const workingHours = this.getWorkingHours();
    const today = new Date();
    
    // Search for optimal slots over the next 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const searchDate = new Date(today);
      searchDate.setDate(today.getDate() + dayOffset);
      
      // Skip weekends for work tasks (unless specifically tagged otherwise)
      if (this.isWorkTask(task) && this.isWeekend(searchDate)) {
        continue;
      }
      
      const daySlots = this.findAvailableSlotsInDay(
        searchDate, 
        taskDuration, 
        events, 
        workingHours,
        task
      );
      
      slots.push(...daySlots);
    }
    
    return slots.slice(0, 5); // Return top 5 slots per task
  }

  private findAvailableSlotsInDay(
    date: Date,
    duration: number,
    events: CalendarEvent[],
    workingHours: { start: number, end: number },
    task: Task
  ): { time: Date, reason: string, confidence: number }[] {
    const slots: { time: Date, reason: string, confidence: number }[] = [];
    const dayEvents = this.getEventsForDay(date, events);
    
    // Create time blocks every 30 minutes
    const timeBlocks: { start: Date, end: Date, available: boolean }[] = [];
    
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const blockStart = new Date(date);
        blockStart.setHours(hour, minute, 0, 0);
        
        const blockEnd = new Date(blockStart);
        blockEnd.setMinutes(blockStart.getMinutes() + duration);
        
        // Check if this time block is available
        const isAvailable = !this.hasTimeConflict(blockStart, blockEnd, dayEvents);
        
        if (isAvailable && blockEnd.getHours() <= workingHours.end) {
          const confidence = this.calculateTimeSlotConfidence(blockStart, task, dayEvents);
          const reason = this.generateSchedulingReason(blockStart, task, dayEvents);
          
          slots.push({
            time: blockStart,
            reason,
            confidence
          });
        }
      }
    }
    
    return slots
      .filter(slot => slot.confidence > 0.3) // Only return slots with decent confidence
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 slots per day
  }

  private calculateTimeSlotConfidence(
    time: Date,
    task: Task,
    dayEvents: CalendarEvent[]
  ): number {
    let confidence = 0.5; // Base confidence
    
    const hour = time.getHours();
    const isToday = this.isToday(time);
    const dayOfWeek = time.getDay();
    
    // Time-of-day preferences
    if (task.priority === 'high') {
      // High priority tasks prefer morning (9-11 AM)
      if (hour >= 9 && hour <= 11) confidence += 0.3;
      else if (hour >= 14 && hour <= 16) confidence += 0.2; // Afternoon focus time
    } else if (task.priority === 'low') {
      // Low priority tasks can go in afternoon/evening
      if (hour >= 15 && hour <= 17) confidence += 0.2;
    }
    
    // Focus time blocks (fewer meetings nearby)
    const nearbyEvents = this.getEventsNearTime(time, dayEvents, 120); // 2 hours window
    if (nearbyEvents.length === 0) confidence += 0.25; // No nearby meetings
    else if (nearbyEvents.length === 1) confidence += 0.1; // Few meetings
    
    // Urgency based on due date
    if (task.dueDate) {
      const daysUntilDue = this.getDaysUntilDate(task.dueDate);
      if (daysUntilDue <= 1) confidence += 0.3; // Very urgent
      else if (daysUntilDue <= 3) confidence += 0.2; // Somewhat urgent
    }
    
    // Today gets priority for urgent tasks
    if (isToday && (task.priority === 'high' || this.isTaskUrgent(task))) {
      confidence += 0.2;
    }
    
    // Avoid Mondays for non-urgent tasks
    if (dayOfWeek === 1 && task.priority !== 'high') {
      confidence -= 0.1;
    }
    
    // Prefer Tuesday-Thursday for important work
    if ([2, 3, 4].includes(dayOfWeek) && task.priority === 'high') {
      confidence += 0.15;
    }
    
    // Task duration considerations
    const duration = task.estimatedTime || 60;
    if (duration > 120) {
      // Long tasks prefer morning or early afternoon
      if (hour >= 9 && hour <= 14) confidence += 0.2;
    } else if (duration <= 30) {
      // Quick tasks can fill gaps
      confidence += 0.1;
    }
    
    // Energy levels throughout the day
    if (hour >= 9 && hour <= 11) confidence += 0.1; // Morning energy
    if (hour >= 14 && hour <= 16) confidence += 0.1; // Post-lunch focus
    if (hour >= 17) confidence -= 0.2; // End of day fatigue
    
    return Math.min(Math.max(confidence, 0), 1); // Clamp between 0 and 1
  }

  private generateSchedulingReason(
    time: Date,
    task: Task,
    dayEvents: CalendarEvent[]
  ): string {
    const hour = time.getHours();
    const isToday = this.isToday(time);
    const nearbyEvents = this.getEventsNearTime(time, dayEvents, 90);
    
    if (task.priority === 'high' && hour >= 9 && hour <= 11) {
      return 'Morning focus time - optimal for high-priority work';
    }
    
    if (nearbyEvents.length === 0) {
      return 'Clear focus block with no nearby meetings';
    }
    
    if (isToday && this.isTaskUrgent(task)) {
      return 'Urgent task scheduled for today';
    }
    
    if (hour >= 14 && hour <= 16) {
      return 'Afternoon productivity window';
    }
    
    if (task.estimatedTime && task.estimatedTime <= 30) {
      return 'Perfect time slot for a quick task';
    }
    
    if (task.estimatedTime && task.estimatedTime > 120) {
      return 'Extended focus time for deep work';
    }
    
    return 'Available time slot that fits your schedule';
  }

  generateSmartTaskRecommendations(tasks: Task[]): {
    type: 'productivity' | 'organization' | 'planning',
    title: string,
    description: string,
    action?: string
  }[] {
    const recommendations: {
      type: 'productivity' | 'organization' | 'planning',
      title: string,
      description: string,
      action?: string
    }[] = [];
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    
    // Productivity recommendations
    if (inProgressTasks.length > 5) {
      recommendations.push({
        type: 'productivity',
        title: 'Too Many Active Tasks',
        description: `You have ${inProgressTasks.length} tasks in progress. Consider focusing on fewer tasks to improve completion rate.`,
        action: 'Move some tasks back to To Do'
      });
    }
    
    if (completedTasks.length > 0) {
      const avgCompletionTime = this.calculateAverageCompletionTime(completedTasks);
      if (avgCompletionTime > 0) {
        recommendations.push({
          type: 'productivity',
          title: 'Productivity Insight',
          description: `Your average task completion time is ${avgCompletionTime} days. Great work maintaining momentum!`
        });
      }
    }
    
    // Organization recommendations
    const untaggedTasks = tasks.filter(t => t.tags.length === 0);
    if (untaggedTasks.length > 3) {
      recommendations.push({
        type: 'organization',
        title: 'Improve Organization',
        description: `${untaggedTasks.length} tasks lack tags. Adding tags will help with filtering and organization.`,
        action: 'Add relevant tags to tasks'
      });
    }
    
    // Planning recommendations
    const tasksWithoutDueDate = highPriorityTasks.filter(t => !t.dueDate);
    if (tasksWithoutDueDate.length > 0) {
      recommendations.push({
        type: 'planning',
        title: 'Set Due Dates for High Priority Tasks',
        description: `${tasksWithoutDueDate.length} high priority tasks don't have due dates. This could affect deadline management.`,
        action: 'Add due dates to high priority tasks'
      });
    }
    
    if (todoTasks.length > 10) {
      recommendations.push({
        type: 'planning',
        title: 'Task Backlog Growing',
        description: `You have ${todoTasks.length} pending tasks. Consider reviewing priorities and breaking down large tasks.`,
        action: 'Review and prioritize task backlog'
      });
    }
    
    return recommendations;
  }

  private getDaysUntilDate(date: Date): number {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getDaysSinceDate(date: Date): number {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = today.getTime() - targetDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  private getWorkingHours(): { start: number, end: number } {
    return { start: 9, end: 17 }; // 9 AM to 5 PM
  }

  private findOptimalTimeSlot(
    task: Task,
    events: CalendarEvent[],
    workingHours: { start: number, end: number }
  ): { time: Date, reason: string } | null {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // For high priority tasks, suggest morning slots
    if (task.priority === 'high') {
      const morningSlot = new Date(tomorrow);
      morningSlot.setHours(workingHours.start, 0, 0, 0);
      
      if (!this.hasConflict(morningSlot, task.estimatedTime || 60, events)) {
        return {
          time: morningSlot,
          reason: 'Morning slot recommended for high priority task'
        };
      }
    }
    
    // For longer tasks, suggest afternoon slots
    if (task.estimatedTime && task.estimatedTime > 120) {
      const afternoonSlot = new Date(tomorrow);
      afternoonSlot.setHours(14, 0, 0, 0);
      
      if (!this.hasConflict(afternoonSlot, task.estimatedTime, events)) {
        return {
          time: afternoonSlot,
          reason: 'Afternoon block reserved for focused work'
        };
      }
    }
    
    // Default suggestion
    const defaultSlot = new Date(tomorrow);
    defaultSlot.setHours(10, 0, 0, 0);
    
    return {
      time: defaultSlot,
      reason: 'Optimal time based on your schedule'
    };
  }

  private hasConflict(startTime: Date, duration: number, events: CalendarEvent[]): boolean {
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    
    return events.some(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (startTime < eventEnd && endTime > eventStart);
    });
  }

  private calculateAverageCompletionTime(completedTasks: Task[]): number {
    if (completedTasks.length === 0) return 0;
    
    const totalDays = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt);
      const days = Math.floor((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / completedTasks.length);
  }

  // Additional helper methods for intelligent scheduling
  private isWorkTask(task: Task): boolean {
    const workTags = ['work', 'business', 'project', 'meeting', 'deadline'];
    return task.tags.some(tag => workTags.includes(tag.toLowerCase())) || 
           task.priority === 'high';
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isTaskUrgent(task: Task): boolean {
    if (task.dueDate) {
      const daysUntilDue = this.getDaysUntilDate(task.dueDate);
      return daysUntilDue <= 2;
    }
    return task.priority === 'high';
  }

  private getEventsForDay(date: Date, events: CalendarEvent[]): CalendarEvent[] {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  private hasTimeConflict(startTime: Date, endTime: Date, events: CalendarEvent[]): boolean {
    return events.some(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (startTime < eventEnd && endTime > eventStart);
    });
  }

  private getEventsNearTime(time: Date, events: CalendarEvent[], windowMinutes: number): CalendarEvent[] {
    const windowStart = new Date(time.getTime() - windowMinutes * 60 * 1000);
    const windowEnd = new Date(time.getTime() + windowMinutes * 60 * 1000);
    
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      return eventStart >= windowStart && eventStart <= windowEnd;
    });
  }

  // Auto-scheduling method for Motion-like functionality
  autoScheduleTask(task: Task, events: CalendarEvent[]): CalendarEvent | null {
    const optimalSlots = this.findIntelligentTimeSlots(task, events);
    
    if (optimalSlots.length === 0) {
      return null;
    }

    // Take the highest confidence slot
    const bestSlot = optimalSlots[0];
    const duration = task.estimatedTime || 60;
    
    return {
      id: this.generateId(),
      title: `🤖 ${task.title}`,
      description: task.description || '',
      startDate: bestSlot.time,
      endDate: new Date(bestSlot.time.getTime() + duration * 60 * 1000),
      allDay: false,
      color: this.getTaskPriorityColor(task.priority),
      category: 'work',
      reminders: [{ id: 'auto', minutes: 15, type: 'notification' }],
      aiGenerated: true,
      relatedTaskId: task.id
    };
  }

  private getTaskPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}