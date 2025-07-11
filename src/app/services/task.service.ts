import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task, TaskFilter } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor() {
    this.loadInitialTasks();
  }

  private loadInitialTasks(): void {
    const sampleTasks: Task[] = [
      {
        id: '1',
        title: 'Design Calendar UI',
        description: 'Create a modern and intuitive calendar interface',
        priority: 'high',
        status: 'todo',
        dueDate: new Date(2025, 6, 15),
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['design', 'ui'],
        estimatedTime: 120,
        aiSuggestions: ['Consider using a grid layout', 'Add drag and drop functionality']
      },
      {
        id: '2',
        title: 'Implement Task Management',
        description: 'Build task CRUD operations',
        priority: 'medium',
        status: 'in-progress',
        dueDate: new Date(2025, 6, 20),
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['development', 'backend'],
        estimatedTime: 180
      }
    ];
    this.tasksSubject.next(sampleTasks);
  }

  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): void {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const currentTasks = this.tasksSubject.value;
    this.tasksSubject.next([...currentTasks, newTask]);
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const currentTasks = this.tasksSubject.value;
    const updatedTasks = currentTasks.map(task =>
      task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
    );
    this.tasksSubject.next(updatedTasks);
  }

  deleteTask(id: string): void {
    const currentTasks = this.tasksSubject.value;
    const filteredTasks = currentTasks.filter(task => task.id !== id);
    this.tasksSubject.next(filteredTasks);
  }

  filterTasks(filter: TaskFilter): Observable<Task[]> {
    return new BehaviorSubject(this.applyFilter(this.tasksSubject.value, filter));
  }

  private applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    return tasks.filter(task => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.tag && !task.tags.includes(filter.tag)) return false;
      if (filter.dateRange && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate < filter.dateRange.start || dueDate > filter.dateRange.end) return false;
      }
      return true;
    });
  }

  generateAISuggestions(task: Task): string[] {
    const suggestions: string[] = [];
    
    if (task.priority === 'high' && !task.dueDate) {
      suggestions.push('Consider adding a due date for this high-priority task');
    }
    
    if (task.estimatedTime && task.estimatedTime > 240) {
      suggestions.push('This task seems large. Consider breaking it down into smaller tasks');
    }
    
    if (task.tags.length === 0) {
      suggestions.push('Add tags to better organize this task');
    }
    
    return suggestions;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}