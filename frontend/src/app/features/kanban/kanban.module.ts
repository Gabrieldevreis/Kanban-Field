import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KanbanComponent } from './kanban.component';
import { ModalEditTasksComponent } from '../../shared/components/modal-edit-tasks/modal-edit-tasks.component';
import { ModalEditColumnComponent } from '../../shared/components/modal-edit-column/modal-edit-column.component';
import { KanbanRoutingModule } from './kanban-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    KanbanComponent,
    ModalEditTasksComponent,
    ModalEditColumnComponent
  ],
  imports: [
    CommonModule,
    KanbanRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    DragDropModule,
    SharedModule
  ],
  exports: [
    KanbanComponent
  ]
})
export class KanbanModule { }
