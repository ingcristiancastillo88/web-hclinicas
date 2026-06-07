import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Servicio para descargar documentos PDF generados por el backend.
 * Sprint 6 — HU-022
 */
@Injectable({ providedIn: 'root' })
export class DocumentoService {

  private readonly url = `${environment.apiUrl}/documentos`;

  constructor(private http: HttpClient) {}

  /**
   * Descarga el PDF de una consulta médica.
   * Retorna los bytes del PDF como Blob.
   */
  descargarConsulta(consultaId: number): Observable<Blob> {
    return this.http.get(`${this.url}/consulta/${consultaId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Descarga el PDF de resumen de historia clínica.
   */
  descargarHistoria(historiaId: number): Observable<Blob> {
    return this.http.get(`${this.url}/historia/${historiaId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Abre el PDF en una nueva pestaña del navegador.
   * @param blob     Blob recibido del backend.
   * @param filename Nombre del archivo para guardar.
   */
  abrirPdf(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Previsualiza el PDF en una nueva pestaña sin descargarlo.
   */
  previsualizarPdf(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // La URL se revoca después de 30 seg para liberar memoria
    setTimeout(() => window.URL.revokeObjectURL(url), 30000);
  }
}