import { Component, OnInit } from '@angular/core';
import { Project, ProjectStatus } from '../../core/models/project.model';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { ProjectsService } from '../../core/services/projects.service';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html',
  styleUrl: './boards.component.scss',
})
export class BoardsComponent implements OnInit {
  activeFilter: 'all' | ProjectStatus = 'all';
  searchTerm = '';
  sortBy: 'name' | 'date' | 'tasks' = 'date';
  isLoading = false;
  errorMessage: string | null = null;

  projects: Project[] = [];
  
  // Paginação
  currentPage = 1;
  itemsPerPage = 12;
  totalProjects = 0;
  totalPages = 0;
  hasNextPage = false;
  hasPreviousPage = false;
  
  // Para usar Math no template
  Math = Math;
  
  isCreateBoardModalOpen = false;
  isEditMode = false;
  selectedProject: Project | null = null;

  isDeleteModalOpen = false;
  projectToDelete: Project | null = null;
  confirmBoardName = '';
  isDeleteConfirmed = false;

  constructor(
    private projectsService: ProjectsService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/boards' }
      });
      return;
    }
    this.loadProjects();
  }

  loadProjects(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.currentPage = page;
    
    this.projectsService.getAll(page, this.itemsPerPage).subscribe({
      next: (response) => {
        this.projects = response.data.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description || '',
          icon: p.icon,
          tasks: p.tasks || 0,
          progress: p.progress || 0,
          members: Array.isArray(p.members) ? p.members : [],
          color: p.color,
          status: p.status as ProjectStatus,
        }));
        
        // Atualizar metadados de paginação
        this.totalProjects = response.meta.total;
        this.totalPages = response.meta.totalPages;
        this.hasNextPage = response.meta.hasNextPage;
        this.hasPreviousPage = response.meta.hasPreviousPage;
        this.currentPage = response.meta.page;
        
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.loadProjects(this.currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.loadProjects(this.currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.loadProjects(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get filteredProjects() {
    let filtered = this.projects;

    // Filtrar por status
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === this.activeFilter);
    }

    // Filtrar por busca
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((p) => 
        p.title.toLowerCase().includes(search) || 
        p.description?.toLowerCase().includes(search)
      );
    }

    // Ordenar
    filtered = [...filtered].sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'tasks':
          return (b.tasks || 0) - (a.tasks || 0);
        case 'date':
        default:
          // Assumindo que projetos mais recentes vêm primeiro da API
          return 0;
      }
    });

    return filtered;
  }

  get projectsCount() {
    return {
      all: this.projects.length,
      active: this.projects.filter(p => p.status === 'active').length,
      completed: this.projects.filter(p => p.status === 'completed').length
    };
  }

  filterProjects(filter: 'all' | ProjectStatus) {
    this.activeFilter = filter;
  }

  setSortBy(sort: 'name' | 'date' | 'tasks') {
    this.sortBy = sort;
  }

  clearSearch() {
    this.searchTerm = '';
  }

  showDashboard(project: Project) {
    if (project.id) {
      this.router.navigate([`/kanban/${project.id}`]);
    }
  }

  openProjectModal(): void {
    this.isEditMode = false;
    this.selectedProject = null;
    this.isCreateBoardModalOpen = true;
  }

  openEditModal(project: Project): void {
    this.isEditMode = true;
    this.selectedProject = project;
    this.isCreateBoardModalOpen = true;
  }

  closeProjectModal(): void {
    this.isCreateBoardModalOpen = false;
    this.isEditMode = false;
    this.selectedProject = null;
    this.errorMessage = null;
  }

  confirmDelete(project: Project): void {
    this.projectToDelete = project;
    this.confirmBoardName = '';
    this.isDeleteConfirmed = false;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.projectToDelete = null;
    this.confirmBoardName = '';
    this.isDeleteConfirmed = false;
  }

  onConfirmNameChange(): void {
    this.isDeleteConfirmed = this.confirmBoardName === this.projectToDelete?.title;
  }

  onDeleteBoard(): void {
    if (!this.projectToDelete?.id) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Sua sessão expirou. Redirecionando para login...';
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/boards', sessionExpired: 'true' }
        });
      }, 2000);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.projectsService.delete(this.projectToDelete.id).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== this.projectToDelete?.id);
        this.isLoading = false;
        this.closeDeleteModal();
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Sua sessão expirou. Redirecionando para login...';
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: '/boards', sessionExpired: 'true' }
            });
          }, 2000);
        } else {
          this.errorMessage = err.message || 'Erro ao excluir board. Tente novamente.';
        }
        this.isLoading = false;
        this.closeDeleteModal();
      }
    });
  }

  onUpdateBoard(project: Project): void {
    if (!project.id || !project.title || !project.title.trim()) {
      this.errorMessage = 'Dados inválidos para atualização.';
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Sua sessão expirou. Redirecionando para login...';
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/boards', sessionExpired: 'true' }
        });
      }, 2000);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const projectData = {
      title: project.title.trim(),
      description: project.description || '',
      icon: project.icon || 'fa-briefcase',
      color: project.color || '#667eea',
      status: project.status || 'active',
    };

    this.projectsService.update(project.id, projectData).subscribe({
      next: (updatedProject: any) => {
        let membersArray: string[] = [];
        if (Array.isArray(updatedProject.members)) {
          membersArray = updatedProject.members.map((m: any) => {
            if (typeof m === 'string') {
              return m;
            }
            if (m && m.user && m.user.name) {
              const name = m.user.name;
              const parts = name.split(' ');
              if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
              }
              return name.substring(0, 2).toUpperCase();
            }
            return '';
          }).filter((m: string) => m !== '');
        }

        const mappedProject: Project = {
          id: updatedProject.id,
          title: updatedProject.title,
          description: updatedProject.description || '',
          icon: updatedProject.icon,
          tasks: updatedProject.tasks || 0,
          progress: updatedProject.progress || 0,
          members: membersArray,
          color: updatedProject.color,
          status: updatedProject.status as ProjectStatus,
        };

        const index = this.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
          this.projects[index] = mappedProject;
        }

        this.isLoading = false;
        this.closeProjectModal();
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Sua sessão expirou. Redirecionando para login...';
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: '/boards', sessionExpired: 'true' }
            });
          }, 2000);
        } else {
          this.errorMessage = err.message || 'Erro ao atualizar board. Tente novamente.';
        }
        this.isLoading = false;
      }
    });
  }

  onCreateBoard(project: Project): void {
    if (!project.title || !project.title.trim()) {
      this.errorMessage = 'O nome do board é obrigatório.';
      return;
    }

    // Verificar autenticação antes de criar
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Sua sessão expirou. Redirecionando para login...';
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/boards', sessionExpired: 'true' }
        });
      }, 2000);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    
    const projectData = {
      title: project.title.trim(),
      description: project.description || '',
      icon: project.icon || 'fa-briefcase',
      color: project.color || '#667eea',
      status: project.status || 'active',
    };

    this.projectsService.create(projectData).subscribe({
      next: (createdProject: any) => {
        // Mapear members corretamente
        let membersArray: string[] = [];
        if (Array.isArray(createdProject.members)) {
          membersArray = createdProject.members.map((m: any) => {
            if (typeof m === 'string') {
              return m;
            }
            if (m && m.user && m.user.name) {
              const name = m.user.name;
              const parts = name.split(' ');
              if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
              }
              return name.substring(0, 2).toUpperCase();
            }
            return '';
          }).filter((m: string) => m !== '');
        }
        
        const mappedProject: Project = {
          id: createdProject.id,
          title: createdProject.title,
          description: createdProject.description || '',
          icon: createdProject.icon,
          tasks: createdProject.tasks || 0,
          progress: createdProject.progress || 0,
          members: membersArray,
          color: createdProject.color,
          status: createdProject.status as ProjectStatus,
        };
        
        this.projects = [mappedProject, ...this.projects];
        this.isLoading = false;
        this.closeProjectModal();
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Sua sessão expirou. Redirecionando para login...';
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: '/boards', sessionExpired: 'true' }
            });
          }, 2000);
        } else {
          this.errorMessage = err.message || 'Erro ao criar board. Tente novamente.';
        }
        this.isLoading = false;
      }
    });
  }
}
