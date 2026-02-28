import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-modal-boards',
  templateUrl: './modal-boards.component.html',
  styleUrl: './modal-boards.component.scss',
})
export class ModalBoardsComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() project: Project | null = null;
  @Input() isEditMode = false;
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<Project>();
  @Output() update = new EventEmitter<Project>();

  form: FormGroup;

  icons = [
  'fa-briefcase',
  'fa-chart-column',
  'fa-bullseye',
  'fa-rocket',
  'fa-code',
  'fa-mobile-screen',
  'fa-paintbrush',
  'fa-chart-line',
  'fa-gear',
  'fa-trophy',
  'fa-file-lines',
  'fa-screwdriver-wrench',
];



  colors = [
    '#667eea',
    '#f093fb',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#feca57',
    '#ff6b6b',
    '#a29bfe',
  ];

  members: string[] = [];

  selectedIcon = 'fa-briefcase';
  selectedColor = '#667eea';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      tasks: [0, [Validators.min(0)]],
      progress: [0, [Validators.min(0), Validators.max(100)]],
      type: ['scrum'],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && this.project && this.isEditMode) {
      this.populateForm();
    } else if (changes['isOpen'] && !this.isOpen) {
      this.resetForm();
    }
  }

  populateForm(): void {
    if (this.project) {
      this.form.patchValue({
        name: this.project.title,
        description: this.project.description,
        tasks: this.project.tasks || 0,
        progress: this.project.progress || 0,
      });
      this.selectedIcon = this.project.icon || 'fa-briefcase';
      this.selectedColor = this.project.color || '#667eea';
      this.members = this.project.members || [];
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  selectIcon(icon: string): void {
    this.selectedIcon = icon;
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  addMember(input: HTMLInputElement): void {
    if (input.value.trim()) {
      this.members.push(input.value.toUpperCase());
      input.value = '';
    }
  }

  removeMember(index: number): void {
    this.members.splice(index, 1);
  }

  createBoard(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.get('name')?.hasError('required')) {
        alert('O nome do board é obrigatório.');
      }
      return;
    }

    if (!this.form.value.name || !this.form.value.name.trim()) {
      alert('O nome do board é obrigatório.');
      return;
    }

    const project: Project = {
      id: this.isEditMode ? this.project?.id : undefined,
      title: this.form.value.name.trim(),
      description: this.form.value.description || '',
      icon: this.selectedIcon,
      tasks: this.form.value.tasks || 0,
      progress: this.form.value.progress || 0,
      members: this.members,
      color: this.selectedColor,
      status: this.form.value.progress === 100 ? 'completed' : 'active'
    };

    if (this.isEditMode) {
      this.update.emit(project);
    } else {
      this.create.emit(project);
    }
    this.resetForm();
  }

  resetForm(): void {
    this.form.reset({
      name: '',
      description: '',
      tasks: 0,
      progress: 0,
      type: 'scrum'
    });
    this.members = [];
    this.selectedIcon = 'fa-briefcase';
    this.selectedColor = '#667eea';
  }
}
