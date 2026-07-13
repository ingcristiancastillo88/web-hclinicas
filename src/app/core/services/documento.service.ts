import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import {environment} from '../../../environments/environment';

export interface MedicamentoDto {
  nombreGenerico:  string;
  nombreComercial: string;
  presentacion:    string;
  indicaciones:    string;
}

export interface RecetaPayload {
  medicamentos: MedicamentoDto[];
  prescripcion: string;
  proximaCita:  string;
}

export interface PedidoPayload {
  tipo:                  string;           // LABORATORIO | IMAGENOLOGIA
  examenesSeleccionados: Record<string, string[]>;
  tipoEstudio?:          string;
  descripcion?:          string;
  motivoSolicitud?:      string;
  resumenClinico?:       string;
  diagnostico?:          string;
  codigoCie10?:          string;
  observaciones?:        string;
  monitoreoFetal?:       boolean;
  fum?:                  string;
  eg?:                   string;
  embarazo?:             boolean;
  semGestacion?:         string;
}

@Injectable({ providedIn: 'root' })
export class DocumentoService {

  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/documentos`;

  // ── Consulta / Historia ───────────────────────────────────────────────

  descargarConsulta(consultaId: number): Observable<Blob> {
    return this.http.get(`${this.url}/consulta/${consultaId}`,
      { responseType: 'blob' });
  }

  descargarHistoria(historiaId: number): Observable<Blob> {
    return this.http.get(`${this.url}/historia/${historiaId}`,
      { responseType: 'blob' });
  }

  // ── Receta ────────────────────────────────────────────────────────────

  guardarReceta(consultaId: number, payload: RecetaPayload): Observable<any> {
    return this.http.post(`${this.url}/receta/${consultaId}/guardar`, payload);
  }

  generarPdfReceta(consultaId: number, payload: RecetaPayload): Observable<Blob> {
    return this.http.post(`${this.url}/receta/${consultaId}/pdf`, payload,
      { responseType: 'blob' });
  }

  obtenerReceta(consultaId: number): Observable<any> {
    return this.http.get(`${this.url}/receta/${consultaId}`);
  }

  // ── Pedido Laboratorio / Imagenología ─────────────────────────────────

  guardarPedido(consultaId: number, payload: PedidoPayload): Observable<any> {
    return this.http.post(`${this.url}/pedido/${consultaId}/guardar`, payload);
  }

  generarPdfPedido(consultaId: number, payload: PedidoPayload): Observable<Blob> {
    return this.http.post(`${this.url}/pedido/${consultaId}/pdf`, payload,
      { responseType: 'blob' });
  }

  obtenerPedido(consultaId: number, tipo: string): Observable<any> {
    return this.http.get(`${this.url}/pedido/${consultaId}`,
      { params: { tipo } });
  }

  // ── Utilidades PDF ────────────────────────────────────────────────────

  /** Abre el PDF en una nueva pestaña (previsualización) */
  previsualizarPdf(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
  }

  /** Descarga el PDF con nombre de archivo */
  descargarPdf(blob: Blob, filename: string): void {
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
