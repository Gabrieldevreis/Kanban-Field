import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDragStart } from '@angular/cdk/drag-drop';
import { ColumnsService, Column, Task } from '../../core/services/columns.service';
import { TasksService } from '../../core/services/tasks.service';
import { ProjectsService } from '../../core/services/projects.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss'
})
export class KanbanComponent implements OnInit {
  @ViewChild('kanbanBoard', { read: ElementRef }) kanbanBoard?: ElementRef;
  
  showTaskModal = false;
  showColumnModal = false;
  isModalOpen = false;
  isEditColumnModalOpen = false;
  selectedTask: Task | null = null;
  selectedColumnId: string | null = null;
  selectedColumn: Column | null = null;
  projectId: string = '';
  project: Project | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  
  isDeleteTaskModalOpen = false;
  taskToDelete: { task: Task; columnId: string } | null = null;
  
  isDeleteColumnModalOpen = false;
  columnToDelete: Column | null = null;
  
  // Variáveis para controle de scroll automático
  private isDragging = false;
  private dragScrollInterval: any;
  
  // Formulário de nova tarefa
  newTask: Partial<Task> = {
    title: '',
    description: '',
    priority: 'medium',
    tag: '',
    color: '',
  };

  columns: Column[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private columnsService: ColumnsService,
    private tasksService: TasksService,
    private projectsService: ProjectsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['projectId'];
      if (this.projectId) {
        this.loadProject();
        this.loadColumns();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  // Detectar movimento do mouse/touch durante o drag
  @HostListener('document:touchmove', ['$event'])
  @HostListener('document:mousemove', ['$event'])
  onDragMove(event: TouchEvent | MouseEvent): void {
    if (!this.isDragging || !this.kanbanBoard) return;

    const clientX = event instanceof TouchEvent 
      ? event.touches[0].clientX 
      : event.clientX;

    const boardElement = this.kanbanBoard.nativeElement;
    const boardRect = boardElement.getBoundingClientRect();
    const scrollLeft = boardElement.scrollLeft;
    const scrollWidth = boardElement.scrollWidth;
    const clientWidth = boardElement.clientWidth;

    // Definir zona de scroll maior no mobile (30% da largura visível em cada lado)
    const scrollZone = clientWidth * 0.3;
    const leftThreshold = boardRect.left + scrollZone;
    const rightThreshold = boardRect.right - scrollZone;

    // Scroll para a esquerda
    if (clientX < leftThreshold && scrollLeft > 0) {
      const speed = Math.max(10, (leftThreshold - clientX) / 1.5);
      boardElement.scrollLeft -= speed;
    }
    // Scroll para a direita
    else if (clientX > rightThreshold && scrollLeft < scrollWidth - clientWidth) {
      const speed = Math.max(10, (clientX - rightThreshold) / 1.5);
      boardElement.scrollLeft += speed;
    }
  }

  // Evento quando o drag começa
  onDragStarted(event: CdkDragStart): void {
    this.isDragging = true;
    // Adicionar classe ao board para desabilitar snap scroll
    if (this.kanbanBoard) {
      this.kanbanBoard.nativeElement.classList.add('is-dragging');
    }
  }

  // Limpar o flag quando o drag termina
  private stopAutoScroll(): void {
    this.isDragging = false;
    if (this.dragScrollInterval) {
      clearInterval(this.dragScrollInterval);
      this.dragScrollInterval = null;
    }
    // Remover classe do board
    if (this.kanbanBoard) {
      this.kanbanBoard.nativeElement.classList.remove('is-dragging');
    }
  }

  loadProject(): void {
    this.projectsService.getById(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }

  loadColumns(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.columnsService.getAll(this.projectId).subscribe({
      next: (columns) => {
        // Garantir que tasks sempre seja um array
        this.columns = columns.map(col => ({
          ...col,
          tasks: col.tasks || []
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  openTaskModal(columnId: string) {
    this.selectedColumnId = columnId;
    this.newTask = {
      title: '',
      description: '',
      priority: 'medium',
      tag: '',
      color: '',
    };
    this.showTaskModal = true;
  }

  closeTaskModal() {
    this.showTaskModal = false;
    this.selectedColumnId = null;
    this.newTask = {
      title: '',
      description: '',
      priority: 'medium',
      tag: '',
      color: '',
    };
  }

   openColumnModal() {
    this.showColumnModal = true;
  }

  closeColumnModal() {
    this.showColumnModal = false;
  }

  createColumn(name: string, emoji?: string) {
    const title = `${emoji ? emoji + ' ' : ''}${name}`;
    this.isLoading = true;
    this.columnsService.create(this.projectId, { title }).subscribe({
      next: (column) => {
        this.columns.push({ ...column, tasks: column.tasks || [] });
        this.isLoading = false;
        this.closeColumnModal();
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  openEditTaskModal(task: Task, columnId: string) {
    this.selectedTask = { ...task };
    this.selectedColumnId = columnId;
    this.isModalOpen = true;
  }

  closeEditTaskModal() {
    this.isModalOpen = false;
    this.selectedTask = null;
    this.selectedColumnId = null;
  }

  saveTask(updatedTask: Task) {
    if (!this.selectedTask?.id || !this.selectedColumnId) return;

    const taskUpdateData: Partial<Task> = {
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      tag: updatedTask.tag,
      color: updatedTask.color,
      completed: updatedTask.completed
    };

    this.isLoading = true;
    this.tasksService.update(this.selectedColumnId, this.selectedTask.id, taskUpdateData).subscribe({
      next: () => {
        this.loadColumns();
        this.closeEditTaskModal();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  deleteTask() {
    if (!this.selectedTask?.id || !this.selectedColumnId) return;

    this.isLoading = true;
    this.tasksService.delete(this.selectedColumnId, this.selectedTask.id).subscribe({
      next: () => {
        this.loadColumns();
        this.closeEditTaskModal();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  quickDeleteTask(taskId: string, columnId: string) {
    const column = this.columns.find(col => col.id === columnId);
    const task = column?.tasks?.find(t => t.id === taskId);
    
    if (task) {
      this.confirmDeleteTask(task, columnId);
    }
  }

  confirmDeleteTask(task: Task, columnId: string): void {
    this.taskToDelete = { task, columnId };
    this.isDeleteTaskModalOpen = true;
  }

  closeDeleteTaskModal(): void {
    this.isDeleteTaskModalOpen = false;
    this.taskToDelete = null;
  }

  onDeleteTask(): void {
    if (!this.taskToDelete?.task.id || !this.taskToDelete?.columnId) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.tasksService.delete(this.taskToDelete.columnId, this.taskToDelete.task.id).subscribe({
      next: () => {
        this.loadColumns();
        this.isLoading = false;
        this.closeDeleteTaskModal();
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
        this.closeDeleteTaskModal();
      }
    });
  }

  toggleTaskCompleted(task: Task, columnId: string) {
    if (!task.id) return;
    
    // Enviar apenas o campo completed
    const updateData = {
      completed: !task.completed
    };

    

    this.tasksService.update(columnId, task.id, updateData).subscribe({
      next: () => {
        // Atualizar localmente para feedback imediato
        task.completed = !task.completed;
      },
      error: (err) => {
        this.errorMessage = err.message;
        console.error('Erro ao atualizar task:', err);
      }
    });
  }

  createTask(task: Partial<Task>) {
    if (!this.selectedColumnId) return;

    this.isLoading = true;
    this.tasksService.create(this.selectedColumnId, task).subscribe({
      next: () => {
        this.loadColumns();
        this.closeTaskModal();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  getConnectedLists(): string[] {
    return this.columns.map((_, index) => `cdk-drop-list-${index}`);
  }

  drop(event: CdkDragDrop<Task[] | undefined>, targetColumn: Column) {
    this.stopAutoScroll(); // Para o auto-scroll quando soltar
    
    if (!event.previousContainer.data || !event.container.data) return;
    
    const sourceColumnIndex = this.columns.findIndex(
      col => col.tasks === event.previousContainer.data
    );
    const targetColumnIndex = this.columns.findIndex(
      col => col.tasks === event.container.data
    );

    if (event.previousContainer === event.container) {
      // Movendo dentro da mesma coluna
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Movendo para outra coluna
      const task = event.previousContainer.data[event.previousIndex];
      const sourceColumn = this.columns[sourceColumnIndex];
      
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // Atualizar a task no backend
      if (task.id && sourceColumn.id && targetColumn.id) {
        this.tasksService.move(sourceColumn.id, task.id, targetColumn.id, event.currentIndex).subscribe({
          next: () => {
            this.loadColumns();
          },
          error: (err) => {
            this.errorMessage = err.message;
            // Reverter a mudança visual em caso de erro
            transferArrayItem(
              event.container.data!,
              event.previousContainer.data!,
              event.currentIndex,
              event.previousIndex,
            );
          }
        });
      }
    }
  }

  openEditColumnModal(column: Column) {
    this.selectedColumn = { ...column };
    this.isEditColumnModalOpen = true;
  }

  closeEditColumnModal() {
    this.isEditColumnModalOpen = false;
    this.selectedColumn = null;
  }

  saveColumn(updatedColumn: Partial<Column>) {
    if (!this.selectedColumn?.id) return;

    this.isLoading = true;
    this.columnsService.update(this.projectId, this.selectedColumn.id, updatedColumn).subscribe({
      next: () => {
        this.loadColumns();
        this.closeEditColumnModal();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  deleteColumn() {
    if (!this.selectedColumn) return;
    this.confirmDeleteColumn(this.selectedColumn);
  }

  confirmDeleteColumn(column: Column): void {
    this.columnToDelete = column;
    this.isDeleteColumnModalOpen = true;
    this.closeEditColumnModal();
  }

  closeDeleteColumnModal(): void {
    this.isDeleteColumnModalOpen = false;
    this.columnToDelete = null;
  }

  onDeleteColumn(): void {
    if (!this.columnToDelete?.id) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.columnsService.delete(this.projectId, this.columnToDelete.id).subscribe({
      next: () => {
        this.loadColumns();
        this.isLoading = false;
        this.closeDeleteColumnModal();
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
        this.closeDeleteColumnModal();
      }
    });
  }
}
