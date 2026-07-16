import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const runGuard = (roles: string[]) => {
    const route = { data: { roles } } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['tieneRol']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('permite el acceso si la ruta no define roles requeridos', () => {
    const result = runGuard([]);

    expect(result).toBeTrue();
    expect(authServiceSpy.tieneRol).not.toHaveBeenCalled();
  });

  it('permite el acceso si el usuario tiene uno de los roles requeridos', () => {
    authServiceSpy.tieneRol.and.returnValue(true);

    const result = runGuard(['SUPERADMINISTRADOR']);

    expect(result).toBeTrue();
    expect(authServiceSpy.tieneRol).toHaveBeenCalledWith('SUPERADMINISTRADOR');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirige a /acceso-denegado si el usuario no tiene el rol requerido', () => {
    authServiceSpy.tieneRol.and.returnValue(false);

    const result = runGuard(['ADMINISTRADOR']);

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/acceso-denegado']);
  });
});