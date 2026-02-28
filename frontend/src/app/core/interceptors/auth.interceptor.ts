import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private publicRoutes = ['/auth/login', '/auth/register'];

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Se for rota pública, não tenta token
    if (this.publicRoutes.some(route => request.url.includes(route))) {
      return next.handle(request);
    }

    const token = localStorage.getItem('access_token');
    let authRequest = request;
    
    if (token) {
      // Verificar se o token não está expirado (apenas validação, não remove ainda)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < currentTime) {
          // Não remove aqui, deixa o backend responder com 401 primeiro
        }
      } catch (error) {
        // Não remove aqui, pode ser um problema temporário
      }
      
      authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Só remove o token e redireciona se não for uma rota pública
          if (!this.publicRoutes.some(route => request.url.includes(route))) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');

            if (!this.router.url.includes('/login')) {
              this.router.navigate(['/login'], {
                queryParams: { sessionExpired: 'true' },
              });
            }
          }
        }

        return throwError(() => error);
      })
    );
  }
}
