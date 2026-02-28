import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Project } from '../models/project.model';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private readonly API_URL = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 1, limit: number = 12): Observable<PaginatedResponse<Project>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<PaginatedResponse<Project>>(this.API_URL, { params })
      .pipe(catchError(this.handleError));
  }

  getById(id: string): Observable<Project> {
    return this.http
      .get<Project>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  create(project: Partial<Project>): Observable<Project> {
    return this.http
      .post<Project>(this.API_URL, project)
      .pipe(catchError(this.handleError));
  }

  update(id: string, project: Partial<Project>): Observable<Project> {
    return this.http
      .patch<Project>(`${this.API_URL}/${id}`, project)
      .pipe(catchError(this.handleError));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Erro inesperado';

    if (error.status === 0) {
      message = 'Erro de conexão com o servidor';
    } else if (error.status === 400) {
      message = error.error?.message || 'Dados inválidos';
    } else if (error.status === 401) {
      message = 'Não autorizado';
    } else if (error.status === 403) {
      message = 'Acesso não autorizado';
    } else if (error.status === 404) {
      message = 'Recurso não encontrado';
    }

    return throwError(() => new Error(message));
  }
}
