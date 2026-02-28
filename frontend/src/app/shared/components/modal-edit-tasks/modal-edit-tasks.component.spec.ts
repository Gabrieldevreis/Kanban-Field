import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEditTasksComponent } from './modal-edit-tasks.component';

describe('ModalEditTasksComponent', () => {
  let component: ModalEditTasksComponent;
  let fixture: ComponentFixture<ModalEditTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalEditTasksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalEditTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
