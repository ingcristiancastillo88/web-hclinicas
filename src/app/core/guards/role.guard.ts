import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional de roles (Angular 19).
 * Uso en rutas: canActivate: [roleGuard], data: { roles: ['SUPERADMINISTRADOR'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const rolesRequeridos: string[] = route.data['roles'] ?? [];

  if (rolesRequeridos.length === 0) return true;

  if (authService.tieneRol(...rolesRequeridos)) {
    return true;
  }

  router.navigate(['/acceso-denegado']);
  return false;
};
