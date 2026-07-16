import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { DocumentoService, PedidoPayload, RecetaPayload } from './documento.service';

describe('DocumentoService', () => {
  let service: DocumentoService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/documentos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DocumentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('descargarConsulta hace GET con responseType blob', () => {
    const blob = new Blob(['pdf']);

    service.descargarConsulta(1).subscribe(res => expect(res).toEqual(blob));

    const req = httpMock.expectOne(`${apiUrl}/consulta/1`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(blob);
  });

  it('descargarHistoria hace GET con responseType blob', () => {
    service.descargarHistoria(2).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/historia/2`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));
  });

  it('guardarReceta hace POST con el payload de la receta', () => {
    const payload: RecetaPayload = {
      medicamentos: [],
      prescripcion: 'Tomar cada 8 horas',
      proximaCita: '2026-08-01'
    };

    service.guardarReceta(3, payload).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/receta/3/guardar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('generarPdfReceta hace POST con responseType blob', () => {
    const payload: RecetaPayload = {
      medicamentos: [],
      prescripcion: '',
      proximaCita: ''
    };

    service.generarPdfReceta(3, payload).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/receta/3/pdf`);
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));
  });

  it('obtenerReceta hace GET a /documentos/receta/{id}', () => {
    service.obtenerReceta(3).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/receta/3`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('guardarPedido hace POST con el payload del pedido', () => {
    const payload: PedidoPayload = {
      tipo: 'LABORATORIO',
      examenesSeleccionados: { hematologia: ['Hemograma'] }
    };

    service.guardarPedido(4, payload).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/pedido/4/guardar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('generarPdfPedido hace POST con responseType blob', () => {
    const payload: PedidoPayload = { tipo: 'IMAGENOLOGIA', examenesSeleccionados: {} };

    service.generarPdfPedido(4, payload).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/pedido/4/pdf`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf']));
  });

  it('obtenerPedido hace GET con el tipo como query param', () => {
    service.obtenerPedido(4, 'LABORATORIO').subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/pedido/4` && r.params.get('tipo') === 'LABORATORIO'
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  describe('utilidades de PDF', () => {
    let createObjectURLSpy: jasmine.Spy;
    let revokeObjectURLSpy: jasmine.Spy;

    beforeEach(() => {
      createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-url');
      revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL');
    });

    it('previsualizarPdf abre el blob en una nueva pestaña', () => {
      const openSpy = spyOn(window, 'open');

      service.previsualizarPdf(new Blob(['pdf']));

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith('blob:mock-url', '_blank');
    });

    it('descargarPdf crea un link y dispara la descarga con el nombre indicado', () => {
      const link = document.createElement('a');
      spyOn(link, 'click');
      spyOn(document, 'createElement').and.returnValue(link);

      service.descargarPdf(new Blob(['pdf']), 'receta.pdf');

      expect(link.href).toContain('blob:mock-url');
      expect(link.download).toBe('receta.pdf');
      expect(link.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});