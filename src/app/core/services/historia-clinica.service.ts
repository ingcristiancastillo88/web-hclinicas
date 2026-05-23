import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActualizarConsultaRequest, ConsultaDetalle, ConsultaResumen, CrearConsultaRequest, CrearHistoriaClinicaRequest, HistoriaClinica } from '../models/historias.models';
import { ApiResponse, PageResponse } from '../models';


@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {

  private readonly apiUrl = `${environment.apiUrl}/historias`;

  constructor(private http: HttpClient) {}

  // ── Historia ──────────────────────────────────────────────────────────────
  crearOActualizar(
    request: CrearHistoriaClinicaRequest
  ): Observable<ApiResponse<HistoriaClinica>> {
    return this.http.post<ApiResponse<HistoriaClinica>>(this.apiUrl, request);
  }

  obtenerPorPaciente(
    pacienteId: number
  ): Observable<ApiResponse<HistoriaClinica>> {
    return this.http.get<ApiResponse<HistoriaClinica>>(
      `${this.apiUrl}/paciente/${pacienteId}`
    );
  }

  obtenerPorId(id: number): Observable<ApiResponse<HistoriaClinica>> {
    return this.http.get<ApiResponse<HistoriaClinica>>(
      `${this.apiUrl}/${id}`
    );
  }

  // ── Consultas ─────────────────────────────────────────────────────────────
  listarConsultas(
    historiaId: number, pagina = 0, tamano = 10
  ): Observable<ApiResponse<PageResponse<ConsultaResumen>>> {
    const params = new HttpParams()
      .set('pagina', pagina)
      .set('tamano', tamano);
    return this.http.get<ApiResponse<PageResponse<ConsultaResumen>>>(
      `${this.apiUrl}/${historiaId}/consultas`, { params }
    );
  }

  crearConsulta(
    request: CrearConsultaRequest
  ): Observable<ApiResponse<ConsultaDetalle>> {
    return this.http.post<ApiResponse<ConsultaDetalle>>(
      `${this.apiUrl}/consultas`, request
    );
  }

  obtenerConsulta(
    consultaId: number
  ): Observable<ApiResponse<ConsultaDetalle>> {
    return this.http.get<ApiResponse<ConsultaDetalle>>(
      `${this.apiUrl}/consultas/${consultaId}`
    );
  }

  actualizarConsulta(
    consultaId: number, request: ActualizarConsultaRequest
  ): Observable<ApiResponse<ConsultaDetalle>> {
    return this.http.put<ApiResponse<ConsultaDetalle>>(
      `${this.apiUrl}/consultas/${consultaId}`, request
    );
  }

  eliminarConsulta(consultaId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/consultas/${consultaId}`
    );
  }

  // ── Archivos ──────────────────────────────────────────────────────────────
  subirArchivo(
    consultaId: number,
    file: File,
    tipoArchivo: string,
    descripcion: string
  ): Observable<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipoArchivo', tipoArchivo);
    if (descripcion) formData.append('descripcion', descripcion);

    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/consultas/${consultaId}/archivos`, formData
    );
  }

  eliminarArchivo(archivoId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/archivos/${archivoId}`
    );
  }
}