import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { CitaMedicaService } from './cita-medica.service';
import {
  ActualizarCitaRequest,
  CancelarCitaRequest,
  CrearCitaRequest
} from '../models/cita.models';

describe('CitaMedicaService', () => {
  let service: CitaMedicaService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/citas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CitaMedicaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('crear hace POST con el request de la cita', () => {
    const request: CrearCitaRequest = {
      pacienteId: 1,
      fechaCita: '2026-07-20',
      horaInicio: '09:00',
      duracionMinutos: 30,
      tipoCita: 'CONTROL'
    };

    service.crear(request).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('listar hace GET con parámetros por defecto y sin filtros opcionales', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('busqueda')).toBe('');
    expect(req.request.params.get('pagina')).toBe('0');
    expect(req.request.params.get('tamano')).toBe('10');
    expect(req.request.params.has('estado')).toBeFalse();
    expect(req.request.params.has('fecha')).toBeFalse();
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('listar agrega estado y fecha cuando se especifican', () => {
    service.listar('CONFIRMADA', '2026-07-20', 'ana', 1, 5).subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.params.get('estado')).toBe('CONFIRMADA');
    expect(req.request.params.get('fecha')).toBe('2026-07-20');
    expect(req.request.params.get('busqueda')).toBe('ana');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('obtener hace GET a /citas/{id}', () => {
    service.obtener(10).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/10`);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('actualizar hace PUT a /citas/{id} con el request', () => {
    const request: ActualizarCitaRequest = {
      fechaCita: '2026-07-21',
      horaInicio: '10:00',
      duracionMinutos: 45
    };

    service.actualizar(10, request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('cancelar hace PATCH a /citas/{id}/cancelar con el motivo', () => {
    const request: CancelarCitaRequest = { motivoCancelacion: 'Paciente enfermo' };

    service.cancelar(10, request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/10/cancelar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });

  it('marcarAtendida hace PATCH a /citas/{id}/atendida', () => {
    service.marcarAtendida(10).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/10/atendida`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });

  it('marcarNoAsistio hace PATCH a /citas/{id}/no-asistio', () => {
    service.marcarNoAsistio(10).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/10/no-asistio`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });

  it('calendario hace GET con rango de fechas', () => {
    service.calendario('2026-07-01', '2026-07-31').subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/calendario`
        && r.params.get('inicio') === '2026-07-01'
        && r.params.get('fin') === '2026-07-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: [] });
  });

  it('porDia hace GET con la fecha solicitada', () => {
    service.porDia('2026-07-15').subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/dia` && r.params.get('fecha') === '2026-07-15'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: [] });
  });

  it('verificarDisponibilidad hace GET con fecha, hora y duración', () => {
    service.verificarDisponibilidad('2026-07-15', '09:00', 60).subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/disponibilidad`
        && r.params.get('fecha') === '2026-07-15'
        && r.params.get('hora') === '09:00'
        && r.params.get('duracion') === '60'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('verificarDisponibilidad usa 30 minutos por defecto', () => {
    service.verificarDisponibilidad('2026-07-15', '09:00').subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/disponibilidad`);
    expect(req.request.params.get('duracion')).toBe('30');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('porPaciente hace GET a /citas/paciente/{id} con paginación', () => {
    service.porPaciente(5, 1, 20).subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/paciente/5`
        && r.params.get('pagina') === '1'
        && r.params.get('tamano') === '20'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });
});