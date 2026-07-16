import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { LoginResponse } from '../models';

const TOKEN_KEY = 'hclinicas_token';
const USER_KEY = 'hclinicas_user';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const loginResponse: LoginResponse = {
    token: 'jwt-token-123',
    tipo: 'Bearer',
    expiracionMs: 3600000,
    usuarioId: 1,
    nombreCompleto: 'Ana Pérez',
    correo: 'ana@example.com',
    rol: 'MEDICO_ESPECIALISTA',
    passwordTemporal: false
  };

  beforeEach(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  });

  it('se crea sin sesión activa cuando no hay datos en localStorage', () => {
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.sesion()).toBeNull();
  });

  it('login exitoso guarda la sesión en localStorage y en el signal', () => {
    service.login({ correo: 'ana@example.com', contrasena: '123456' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ exitoso: true, mensaje: 'ok', data: loginResponse });

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.rolActual()).toBe('MEDICO_ESPECIALISTA');
    expect(service.nombreUsuario()).toBe('Ana Pérez');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-token-123');
    expect(JSON.parse(localStorage.getItem(USER_KEY)!).correo).toBe('ana@example.com');
  });

  it('login no exitoso no guarda sesión', () => {
    service.login({ correo: 'ana@example.com', contrasena: 'mala' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ exitoso: false, mensaje: 'Credenciales inválidas', data: null });

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('logout limpia localStorage, el signal de sesión y navega al login', () => {
    service.login({ correo: 'ana@example.com', contrasena: '123456' }).subscribe();
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ exitoso: true, mensaje: 'ok', data: loginResponse });

    service.logout();

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('getToken retorna el token almacenado', () => {
    localStorage.setItem(TOKEN_KEY, 'abc123');
    expect(service.getToken()).toBe('abc123');
  });

  it('getToken retorna null cuando no hay token', () => {
    expect(service.getToken()).toBeNull();
  });

  describe('verificación de roles', () => {
    beforeEach(() => {
      service.login({ correo: 'ana@example.com', contrasena: '123456' }).subscribe();
      httpMock
        .expectOne(`${environment.apiUrl}/auth/login`)
        .flush({ exitoso: true, mensaje: 'ok', data: loginResponse });
    });

    it('tieneRol retorna true si el rol actual está incluido', () => {
      expect(service.tieneRol('MEDICO_ESPECIALISTA', 'ADMINISTRADOR')).toBeTrue();
    });

    it('tieneRol retorna false si el rol actual no está incluido', () => {
      expect(service.tieneRol('SUPERADMINISTRADOR')).toBeFalse();
    });

    it('esMedico retorna true para MEDICO_ESPECIALISTA', () => {
      expect(service.esMedico()).toBeTrue();
    });

    it('esAdmin retorna false para un rol de médico', () => {
      expect(service.esAdmin()).toBeFalse();
    });

    it('esSuperAdmin retorna false para un rol de médico', () => {
      expect(service.esSuperAdmin()).toBeFalse();
    });
  });

  it('tieneRol retorna false cuando no hay sesión activa', () => {
    expect(service.tieneRol('ADMINISTRADOR')).toBeFalse();
  });

  it('restaura la sesión desde localStorage al construir el servicio', () => {
    const sesionGuardada = {
      usuarioId: 5,
      nombreCompleto: 'Carlos Ruiz',
      correo: 'carlos@example.com',
      rol: 'ADMINISTRADOR',
      token: 'token-guardado'
    };
    localStorage.setItem(USER_KEY, JSON.stringify(sesionGuardada));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });
    const nuevoServicio = TestBed.inject(AuthService);

    expect(nuevoServicio.isLoggedIn()).toBeTrue();
    expect(nuevoServicio.rolActual()).toBe('ADMINISTRADOR');
  });

  it('ignora datos corruptos en localStorage y arranca sin sesión', () => {
    localStorage.setItem(USER_KEY, '{json-invalido');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });
    const nuevoServicio = TestBed.inject(AuthService);

    expect(nuevoServicio.isLoggedIn()).toBeFalse();
  });
});