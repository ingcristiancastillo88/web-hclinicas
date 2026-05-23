import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor JWT funcional (Angular 19 standalone).
 * Agrega el token Bearer en cada petición y maneja errores 401/403.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const token = authService.getToken();

  // Clonar la petición con el header Authorization si hay token
  const authReq = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado o inválido → cerrar sesión
        authService.logout();
        router.navigate(['/auth/login']);
      }
      if (error.status === 403) {
        // Sin permisos → redirigir a página de acceso denegado
        router.navigate(['/acceso-denegado']);
      }
      return throwError(() => error);
    })
  );
};
