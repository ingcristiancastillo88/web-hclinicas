import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { noAuthGuard } from './no-auth.guard';
import { AuthService } from '../services/auth.service';

describe('noAuthGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const runGuard = () =>
    TestBed.runInInjectionContext(() => noAuthGuard({} as any, {} as any));

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('permite el acceso al login cuando no hay sesión activa', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);

    const result = runGuard();

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirige a /dashboard y bloquea el acceso cuando ya hay sesión', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);

    const result = runGuard();

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});