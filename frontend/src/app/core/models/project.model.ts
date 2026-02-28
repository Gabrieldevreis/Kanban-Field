export type ProjectStatus = 'active' | 'completed';

export interface Project {
  id?: string;
  title: string;
  description: string;
  icon: string;
  tasks: number;
  progress: number;
  members: string[];
  color: string;
  status: ProjectStatus;
}
