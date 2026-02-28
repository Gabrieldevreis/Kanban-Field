import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Column } from '../../../core/services/columns.service';

@Component({
  selector: 'app-modal-edit-column',
  templateUrl: './modal-edit-column.component.html',
  styleUrl: './modal-edit-column.component.scss'
})
export class ModalEditColumnComponent {
  @Input() isOpen = false;
  @Input() column: Partial<Column> | null = {
    title: '',
  };

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Column>>();
  @Output() delete = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  saveColumn() {
    if (this.column) {
      this.save.emit(this.column);
    }
  }

  deleteColumn() {
    this.delete.emit();
  }
}
