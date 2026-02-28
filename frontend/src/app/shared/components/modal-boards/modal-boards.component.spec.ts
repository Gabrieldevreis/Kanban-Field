import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalBoardsComponent } from './modal-boards.component';

describe('ModalBoardsComponent', () => {
  let component: ModalBoardsComponent;
  let fixture: ComponentFixture<ModalBoardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalBoardsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalBoardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
