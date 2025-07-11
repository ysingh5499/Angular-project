import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { CalendarService } from '../../services/calendar.service';
import { AIService } from '../../services/ai.service';
import { Task, TaskFilter } from '../../models/task.model';

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.css']
})
export class TaskManagerComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  filter: TaskFilter = {};
  
  newTask: Partial<Task> = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    tags: [],
    estimatedTime: 60
  };

  showAddForm = false;
  editingTask: Task | null = null;

  constructor(
    private taskService: TaskService,
    private calendarService: CalendarService,
    private aiService: AIService
  ) {}

  ngOnInit(): void {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    this.filteredTasks = this.tasks.filter(task => {
      if (this.filter.status && task.status !== this.filter.status) return false;
      if (this.filter.priority && task.priority !== this.filter.priority) return false;
      if (this.filter.tag && !task.tags.includes(this.filter.tag)) return false;
      return true;
    });
  }

  addTask(): void {
    if (this.newTask.title?.trim()) {
      this.taskService.addTask({
        title: this.newTask.title,
        description: this.newTask.description || '',
        priority: this.newTask.priority || 'medium',
        status: 'todo',
        tags: this.newTask.tags || [],
        estimatedTime: this.newTask.estimatedTime,
        dueDate: this.newTask.dueDate
      });
      
      this.resetForm();
      this.showAddForm = false;
    }
  }

  updateTask(task: Task): void {
    this.taskService.updateTask(task.id, task);
  }

  deleteTask(id: string): void {
    this.taskService.deleteTask(id);
  }

  editTask(task: Task): void {
    this.editingTask = { ...task };
  }

  saveEdit(): void {
    if (this.editingTask) {
      this.taskService.updateTask(this.editingTask.id, this.editingTask);
      this.editingTask = null;
    }
  }

  cancelEdit(): void {
    this.editingTask = null;
  }

  resetForm(): void {
    this.newTask = {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      tags: [],
      estimatedTime: 60
    };
  }

  toggleTaskStatus(task: Task): void {
    let newStatus: 'todo' | 'in-progress' | 'completed';
    
    if (task.status === 'todo') {
      newStatus = 'in-progress';
    } else if (task.status === 'in-progress') {
      newStatus = 'completed';
    } else {
      newStatus = 'todo';
    }
    
    this.taskService.updateTask(task.id, { status: newStatus });
  }

  getTasksByStatus(status: 'todo' | 'in-progress' | 'completed'): Task[] {
    return this.filteredTasks.filter(task => task.status === status);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  }

  formatDueDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  addTag(task: Task, tagInput: HTMLInputElement): void {
    const tag = tagInput.value.trim();
    if (tag && !task.tags.includes(tag)) {
      const updatedTags = [...task.tags, tag];
      this.taskService.updateTask(task.id, { tags: updatedTags });
      tagInput.value = '';
    }
  }

  removeTag(task: Task, tagToRemove: string): void {
    const updatedTags = task.tags.filter(tag => tag !== tagToRemove);
    this.taskService.updateTask(task.id, { tags: updatedTags });
  }

  getAISuggestions(task: Task): string[] {
    return this.aiService.generateTaskSuggestions(task);
  }

  autoScheduleTask(task: Task): void {
    // Get current events from calendar service
    this.calendarService.getEvents().subscribe(events => {
      const scheduledEvent = this.aiService.autoScheduleTask(task, events);
      if (scheduledEvent) {
        this.calendarService.addEvent(scheduledEvent);
        this.taskService.updateTask(task.id, { status: 'in-progress' });
      }
    });
  }
}
