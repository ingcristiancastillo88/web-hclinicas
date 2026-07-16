import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { UsuarioService } from './usuario.service';
import { ActualizarUsuarioRequest, CrearUsuarioRequest } from '../models';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/usuarios`;
  const rolesUrl = `${environment.apiUrl}/roles`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getRoles hace GET a /roles', () => {
    service.getRoles().subscribe();

    const req = httpMock.expectOne(rolesUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: [] });
  });

  it('listar hace GET con búsqueda y paginación por defecto', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne(r => r.url === apiUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('busqueda')).toBe('');
    expect(req.request.params.get('pagina')).toBe('0');
    expect(req.request.params.get('tamano')).toBe('10');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('obtener hace GET a /usuarios/{id}', () => {
    service.obtener(7).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('crear hace POST con el request', () => {
    const request: CrearUsuarioRequest = {
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'juan@example.com',
      contrasena: 'clave123',
      rolId: 2
    };

    service.crear(request).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('actualizar hace PUT a /usuarios/{id} con el request', () => {
    const request: ActualizarUsuarioRequest = {
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'juan@example.com',
      rolId: 2
    };

    service.actualizar(7, request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('desactivar hace PATCH a /usuarios/{id}/desactivar', () => {
    service.desactivar(7).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/7/desactivar`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });

  it('activar hace PATCH a /usuarios/{id}/activar', () => {
    service.activar(7).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/7/activar`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ exitoso: true, mensaje: '', data: undefined });
  });
});