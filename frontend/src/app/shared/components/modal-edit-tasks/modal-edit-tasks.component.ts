import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-edit-tasks',
  templateUrl: './modal-edit-tasks.component.html',
  styleUrl: './modal-edit-tasks.component.scss'
})
export class ModalEditTasksComponent {
  @Input() isOpen = false;
  @Input() task: any = {
    title: '',
    description: '',
    tag: '',
    color: '',
  };

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @Output() delete = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  saveTask() {
    this.save.emit(this.task);
  }

  deleteTask() {
    this.delete.emit();
  }

  confirmDelete() {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      this.deleteTask();
    }
  }

  selectColor(color: string) {
    this.task.color = color;
  }
}
