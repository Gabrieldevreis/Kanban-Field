import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Column {
  id?: string;
  title: string;
  order?: number;
  tasks?: Task[];
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
  color?: string;
  completed?: boolean;
  columnId?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ColumnsService {
  private readonly API_URL = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getAll(projectId: string): Observable<Column[]> {
    return this.http
      .get<Column[]>(`${this.API_URL}/${projectId}/columns`)
      .pipe(catchError(this.handleError));
  }

  getById(projectId: string, id: string): Observable<Column> {
    return this.http
      .get<Column>(`${this.API_URL}/${projectId}/columns/${id}`)
      .pipe(catchError(this.handleError));
  }

  create(projectId: string, column: Partial<Column>): Observable<Column> {
    return this.http
      .post<Column>(`${this.API_URL}/${projectId}/columns`, column)
      .pipe(catchError(this.handleError));
  }

  update(projectId: string, id: string, column: Partial<Column>): Observable<Column> {
    return this.http
      .patch<Column>(`${this.API_URL}/${projectId}/columns/${id}`, column)
      .pipe(catchError(this.handleError));
  }

  delete(projectId: string, id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/${projectId}/columns/${id}`)
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
