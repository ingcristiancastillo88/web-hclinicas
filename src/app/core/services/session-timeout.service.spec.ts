import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SessionTimeoutService } from './session-timeout.service';
import { AuthService } from './auth.service';

describe('SessionTimeoutService', () => {
  let service: SessionTimeoutService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const NUEVE_MIN = 9 * 60 * 1000;
  const DIEZ_MIN = 10 * 60 * 1000;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(SessionTimeoutService);
  });

  afterEach(() => {
    service.detener();
  });

  it('no cierra sesión antes de que transcurra el tiempo de inactividad', fakeAsync(() => {
    service.iniciar();
    tick(DIEZ_MIN - 1000);

    expect(authServiceSpy.logout).not.toHaveBeenCalled();

    tick(1000);
  }));

  it('cierra la sesión automáticamente tras 10 minutos de inactividad', fakeAsync(() => {
    service.iniciar();
    tick(DIEZ_MIN);

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { motivo: 'inactividad' } }
    );
  }));

  it('muestra el aviso de inactividad a los 9 minutos', fakeAsync(() => {
    const aviso = document.createElement('div');
    aviso.id = 'session-timeout-warning';
    aviso.style.display = 'none';
    document.body.appendChild(aviso);

    service.iniciar();
    tick(NUEVE_MIN);

    expect(aviso.style.display).toBe('flex');

    tick(60_000);
    document.body.removeChild(aviso);
  }));

  it('la actividad del usuario reinicia el contador antes del cierre', fakeAsync(() => {
    service.iniciar();
    tick(DIEZ_MIN - 1000);

    window.dispatchEvent(new Event('mousemove'));
    tick(1000);

    // el reinicio del contador evita el cierre en el tiempo original
    expect(authServiceSpy.logout).not.toHaveBeenCalled();

    tick(DIEZ_MIN - 1000);
    expect(authServiceSpy.logout).toHaveBeenCalled();
  }));

  it('extenderSesion reinicia el contador de inactividad', fakeAsync(() => {
    service.iniciar();
    tick(DIEZ_MIN - 1000);

    service.extenderSesion();
    tick(1000);

    expect(authServiceSpy.logout).not.toHaveBeenCalled();

    tick(DIEZ_MIN - 1000);
    expect(authServiceSpy.logout).toHaveBeenCalled();
  }));

  it('detener cancela los temporizadores y no cierra sesión', fakeAsync(() => {
    service.iniciar();
    tick(1000);
    service.detener();
    tick(DIEZ_MIN);

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  }));

  it('iniciar llamado dos veces no duplica los temporizadores', fakeAsync(() => {
    service.iniciar();
    service.iniciar();
    tick(DIEZ_MIN);

    expect(authServiceSpy.logout).toHaveBeenCalledTimes(1);
  }));
});