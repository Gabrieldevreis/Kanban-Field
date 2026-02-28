import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-confirm-delete',
  templateUrl: './modal-confirm-delete.component.html',
  styleUrl: './modal-confirm-delete.component.scss'
})
export class ModalConfirmDeleteComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar Exclusão';
  @Input() itemName = '';
  @Input() itemType = 'item';
  @Input() warningMessage = 'Esta ação não pode ser desfeita.';
  @Input() isLoading = false;
  @Input() requireNameConfirmation = true;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  confirmName = '';
  isConfirmed = false;

  closeModal() {
    this.confirmName = '';
    this.isConfirmed = false;
    this.close.emit();
  }

  onConfirmNameChange() {
    this.isConfirmed = this.confirmName === this.itemName;
  }

  onConfirm() {
    if (this.requireNameConfirmation) {
      if (this.isConfirmed) {
        this.confirm.emit();
      }
    } else {
      this.confirm.emit();
    }
  }

  canConfirm(): boolean {
    if (this.requireNameConfirmation) {
      return this.isConfirmed;
    }
    return true;
  }
}
