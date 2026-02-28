import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Task } from './columns.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly API_URL = `${environment.apiUrl}/columns`;

  constructor(private http: HttpClient) {}

  getAll(columnId: string): Observable<Task[]> {
    return this.http
      .get<Task[]>(`${this.API_URL}/${columnId}/tasks`)
      .pipe(catchError(this.handleError));
  }

  getById(columnId: string, id: string): Observable<Task> {
    return this.http
      .get<Task>(`${this.API_URL}/${columnId}/tasks/${id}`)
      .pipe(catchError(this.handleError));
  }

  create(columnId: string, task: Partial<Task>): Observable<Task> {
    return this.http
      .post<Task>(`${this.API_URL}/${columnId}/tasks`, task)
      .pipe(catchError(this.handleError));
  }

  update(columnId: string, id: string, task: Partial<Task>): Observable<Task> {
    return this.http
      .patch<Task>(`${this.API_URL}/${columnId}/tasks/${id}`, task)
      .pipe(catchError(this.handleError));
  }

  move(columnId: string, id: string, newColumnId: string, order?: number): Observable<Task> {
    return this.http
      .patch<Task>(`${this.API_URL}/${columnId}/tasks/${id}/move`, {
        columnId: newColumnId,
        order
      })
      .pipe(catchError(this.handleError));
  }

  delete(columnId: string, id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/${columnId}/tasks/${id}`)
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
