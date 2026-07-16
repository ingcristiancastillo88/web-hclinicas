import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { HistoriaClinicaService } from './historia-clinica.service';
import {
  ActualizarConsultaRequest,
  CrearConsultaRequest,
  CrearHistoriaClinicaRequest
} from '../models/historia.models';

describe('HistoriaClinicaService', () => {
  let service: HistoriaClinicaService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/historias`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(HistoriaClinicaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('crearOActualizar hace POST con el request de la historia', () => {
    const request: CrearHistoriaClinicaRequest = { pacienteId: 1, gestas: 2 };

    service.crearOActualizar(request).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('obtenerPorId hace GET a /historias/{id}', () => {
    service.obtenerPorId(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('obtenerPorPaciente hace GET a /historias/paciente/{id}', () => {
    service.obtenerPorPaciente(9).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/paciente/9`);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('listarConsultas hace GET con paginación', () => {
    service.listarConsultas(1, 2, 5).subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/1/consultas`
        && r.params.get('pagina') === '2'
        && r.params.get('tamano') === '5'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('crearConsulta hace POST a /historias/consultas', () => {
    const request: CrearConsultaRequest = {
      historiaClinicaId: 1,
      fechaConsulta: '2026-07-15',
      motivoConsulta: 'Control prenatal',
      diagnosticoPrincipal: 'Embarazo normal'
    };

    service.crearConsulta(request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/consultas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('obtenerConsulta hace GET a /historias/consultas/{id}', () => {
    service.obtenerConsulta(4).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/consultas/4`);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('actualizarConsulta hace PUT a /historias/consultas/{id}', () => {
    const request: ActualizarConsultaRequest = {
      fechaConsulta: '2026-07-16',
      motivoConsulta: 'Seguimiento',
      diagnosticoPrincipal: 'Sin novedad'
    };

    service.actualizarConsulta(4, request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/consultas/4`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('eliminarConsulta hace DELETE a /historias/consultas/{id}', () => {
    service.eliminarConsulta(4).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/consultas/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });

  it('subirArchivo hace POST con un FormData que incluye archivo, tipo y descripción', () => {
    const file = new File(['contenido'], 'examen.pdf', { type: 'application/pdf' });

    service.subirArchivo(4, file, 'RESULTADO_LABORATORIO', 'Hemograma').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/consultas/4/archivos`);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('archivo')).toBe(file);
    expect(body.get('tipoArchivo')).toBe('RESULTADO_LABORATORIO');
    expect(body.get('descripcion')).toBe('Hemograma');
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });

  it('subirArchivo omite la descripción cuando está vacía', () => {
    const file = new File(['contenido'], 'examen.pdf');

    service.subirArchivo(4, file, 'IMAGEN', '').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/consultas/4/archivos`);
    const body = req.request.body as FormData;
    expect(body.has('descripcion')).toBeFalse();
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });

  it('eliminarArchivo hace DELETE a /historias/archivos/{id}', () => {
    service.eliminarArchivo(8).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/archivos/8`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });
});