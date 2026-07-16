import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AuditoriaService } from './auditoria.service';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/auditoria`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuditoriaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar hace GET con paginación por defecto y sin filtros', () => {
    service.listar({}).subscribe();

    const req = httpMock.expectOne(
      r => r.url === apiUrl && r.method === 'GET'
    );
    expect(req.request.params.get('pagina')).toBe('0');
    expect(req.request.params.get('tamano')).toBe('20');
    expect(req.request.params.has('modulo')).toBeFalse();
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('listar agrega filtros opcionales solo cuando están presentes', () => {
    service.listar({ modulo: 'PACIENTES', accion: 'CREAR', correo: 'a@b.com' }, 2, 50)
      .subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.params.get('modulo')).toBe('PACIENTES');
    expect(req.request.params.get('accion')).toBe('CREAR');
    expect(req.request.params.get('correo')).toBe('a@b.com');
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('tamano')).toBe('50');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('porUsuario codifica el correo en la URL', () => {
    service.porUsuario('user+test@example.com').subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/usuario/${encodeURIComponent('user+test@example.com')}`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('porModulo hace GET al endpoint del módulo con paginación', () => {
    service.porModulo('CITAS', 1, 15).subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/modulo/CITAS`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('pagina')).toBe('1');
    expect(req.request.params.get('tamano')).toBe('15');
    expect(req.request.params.get('pagina')).toBe('1');
    expect(req.request.params.get('tamano')).toBe('15');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });
});