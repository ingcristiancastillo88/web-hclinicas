import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../services/auth.service';

describe('jwtInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('agrega el header Authorization cuando hay token', () => {
    authServiceSpy.getToken.and.returnValue('mi-token');

    httpClient.get('/api/pacientes').subscribe();

    const req = httpMock.expectOne('/api/pacientes');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mi-token');
    req.flush({});
  });

  it('no agrega el header Authorization cuando no hay token', () => {
    authServiceSpy.getToken.and.returnValue(null);

    httpClient.get('/api/pacientes').subscribe();

    const req = httpMock.expectOne('/api/pacientes');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('cierra sesión y redirige al login ante un error 401', () => {
    authServiceSpy.getToken.and.returnValue('token-expirado');

    httpClient.get('/api/pacientes').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/pacientes');
    req.flush('No autorizado', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('redirige a acceso-denegado ante un error 403', () => {
    authServiceSpy.getToken.and.returnValue('token-sin-permisos');

    httpClient.get('/api/pacientes').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/pacientes');
    req.flush('Prohibido', { status: 403, statusText: 'Forbidden' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/acceso-denegado']);
  });

  it('propaga el error original al subscriptor', () => {
    authServiceSpy.getToken.and.returnValue('token');
    let errorRecibido: HttpErrorResponse | undefined;

    httpClient.get('/api/pacientes').subscribe({
      error: (err) => (errorRecibido = err)
    });

    const req = httpMock.expectOne('/api/pacientes');
    req.flush('Error de servidor', { status: 500, statusText: 'Server Error' });

    expect(errorRecibido?.status).toBe(500);
  });
});