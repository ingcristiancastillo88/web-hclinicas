import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActualizarConsultaRequest, ConsultaDetalle, ConsultaResumen, CrearConsultaRequest, CrearHistoriaClinicaRequest, HistoriaClinica } from '../models/historia.models';
import { ApiResponse, PageResponse } from '../models';


@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {

  private readonly url = `${environment.apiUrl}/historias`;

  constructor(private http: HttpClient) {}

  // ── Historia ──────────────────────────────────────────────────────────────
  crearOActualizar(
    req: CrearHistoriaClinicaRequest
  ): Observable<ApiResponse<HistoriaClinica>> {
    return this.http.post<ApiResponse<HistoriaClinica>>(this.url, req);
  }

  obtenerPorId(id: number): Observable<ApiResponse<HistoriaClinica>> {
    return this.http.get<ApiResponse<HistoriaClinica>>(`${this.url}/${id}`);
  }

  obtenerPorPaciente(pacienteId: number): Observable<ApiResponse<HistoriaClinica>> {
    return this.http.get<ApiResponse<HistoriaClinica>>(
      `${this.url}/paciente/${pacienteId}`
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
      `${this.url}/${historiaId}/consultas`, { params }
    );
  }

  crearConsulta(
    req: CrearConsultaRequest
  ): Observable<ApiResponse<ConsultaDetalle>> {
    return this.http.post<ApiResponse<ConsultaDetalle>>(
      `${this.url}/consultas`, req
    );
  }

  obtenerConsulta(id: number): Observable<ApiResponse<ConsultaDetalle>> {
    return this.http.get<ApiResponse<ConsultaDetalle>>(
      `${this.url}/consultas/${id}`
    );
  }

  actualizarConsulta(
    id: number, req: ActualizarConsultaRequest
  ): Observable<ApiResponse<ConsultaDetalle>> {
    return this.http.put<ApiResponse<ConsultaDetalle>>(
      `${this.url}/consultas/${id}`, req
    );
  }

  eliminarConsulta(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/consultas/${id}`);
  }

  // ── Archivos ──────────────────────────────────────────────────────────────
  subirArchivo(
    consultaId: number,
    file: File,
    tipoArchivo: string,
    descripcion: string
  ): Observable<ApiResponse<void>> {
    const form = new FormData();
    form.append('archivo',      file);
    form.append('tipoArchivo',  tipoArchivo);
    if (descripcion) form.append('descripcion', descripcion);
    return this.http.post<ApiResponse<void>>(
      `${this.url}/consultas/${consultaId}/archivos`, form
    );
  }

  eliminarArchivo(archivoId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.url}/archivos/${archivoId}`
    );
  }
}
