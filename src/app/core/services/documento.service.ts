import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';

export interface RecetaPayload {
  medicamentos: {
    nombre: string;
    dosis: string;
    cantidad: string;
    indicaciones: string;
  }[];
  prescripcion: string;
  proximaCita: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentoService {

  private readonly url = `${environment.apiUrl}/documentos`;

  constructor(private http: HttpClient) {}

  descargarConsulta(consultaId: number): Observable<Blob> {
    return this.http.get(`${this.url}/consulta/${consultaId}`, {
      responseType: 'blob'
    });
  }

  descargarHistoria(historiaId: number): Observable<Blob> {
    return this.http.get(`${this.url}/historia/${historiaId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Genera la receta médica en PDF enviando los medicamentos y prescripción.
   * POST /api/documentos/receta/{consultaId}
   */
  generarReceta(consultaId: number, payload: RecetaPayload): Observable<Blob> {
    return this.http.post(`${this.url}/receta/${consultaId}`, payload, {
      responseType: 'blob'
    });
  }

  abrirPdf(blob: Blob, filename: string): void {
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  previsualizarPdf(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 30000);
  }
}
