export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  estimatedTime?: number; // in minutes
  aiSuggestions?: string[];
}

export interface TaskFilter {
  status?: 'todo' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}