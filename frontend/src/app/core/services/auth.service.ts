import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { LoginDto } from '../models/login.dto';
import { RegisterDto } from '../models/register.dto';
import { AuthResponse } from '../models/auth-response.dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(data: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, data)
      .pipe(catchError(this.handleError));
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, data)
      .pipe(catchError(this.handleError));
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return false;
    }

    // Verifica se o token não expirou (opcional - você pode implementar validação JWT mais robusta)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Se o token expirou, remove e retorna false
      if (payload.exp && payload.exp < currentTime) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      // Se houver erro ao decodificar, remove o token
      this.logout();
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Erro inesperado';

    if (error.status === 0) {
      message = 'Erro de conexão com o servidor';
    }

    if (error.status === 400) {
      message = error.error?.message || 'Dados inválidos';
    }

    if (error.status === 401) {
      message = 'Email ou senha inválidos';
    }

    if (error.status === 403) {
      message = 'Acesso não autorizado';
    }

    return throwError(() => new Error(message));
  }
}
