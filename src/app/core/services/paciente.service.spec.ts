import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { PacienteService } from './paciente.service';
import { ActualizarPacienteRequest, CrearPacienteRequest } from '../models';

describe('PacienteService', () => {
  let service: PacienteService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/pacientes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PacienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar hace GET con parámetros por defecto', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('busqueda')).toBe('');
    expect(req.request.params.get('pagina')).toBe('0');
    expect(req.request.params.get('tamano')).toBe('10');
    expect(req.request.params.get('soloActivos')).toBe('true');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('listar propaga parámetros personalizados', () => {
    service.listar('perez', 2, 25, false).subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.params.get('busqueda')).toBe('perez');
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('tamano')).toBe('25');
    expect(req.request.params.get('soloActivos')).toBe('false');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('obtener hace GET a /pacientes/{id}', () => {
    service.obtener(3).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('obtenerPorCedula hace GET a /pacientes/cedula/{cedula}', () => {
    service.obtenerPorCedula('0102030405').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/cedula/0102030405`);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('crear hace POST con el request', () => {
    const request: CrearPacienteRequest = {
      cedula: '0102030405',
      nombres: 'María',
      apellidos: 'López'
    };

    service.crear(request).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('actualizar hace PUT a /pacientes/{id} con el request', () => {
    const request: ActualizarPacienteRequest = {
      nombres: 'María',
      apellidos: 'López'
    };

    service.actualizar(3, request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('desactivar hace PATCH a /pacientes/{id}/desactivar', () => {
    service.desactivar(3).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/3/desactivar`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });

  it('activar hace PATCH a /pacientes/{id}/activar', () => {
    service.activar(3).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/3/activar`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });
});