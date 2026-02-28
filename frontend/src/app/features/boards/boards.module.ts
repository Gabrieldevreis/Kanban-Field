import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardsComponent } from './boards.component';
import { ModalBoardsComponent } from '../../shared/components/modal-boards/modal-boards.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BoardsRoutingModule } from './boards-routing.module';

@NgModule({
  declarations: [
    BoardsComponent,
    ModalBoardsComponent
  ],
  imports: [
    CommonModule,
    BoardsRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [
    BoardsComponent
  ]
})
export class BoardsModule { }
