import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';
import {ApiResponse} from '../models';
import {CitaResumen} from '../models/cita.models';

export interface StatsAdmin {
  totalPacientes: number;
  pacientesActivos: number;
  citasHoy: number;
  citasMes: number;
  citasPendientes: number;
  citasAtendidas: number;
  citasCanceladas: number;
  consultasMes: number;
  totalUsuarios: number;
}

export interface StatsMedico {
  totalPacientes: number;
  citasHoy: number;
  citasPendientesHoy: number;
  citasAtendidasHoy: number;
  citasPendientesSemana: number;
  consultasMes: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private readonly url = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  statsAdmin(): Observable<ApiResponse<StatsAdmin>> {
    return this.http.get<ApiResponse<StatsAdmin>>(`${this.url}/stats`);
  }

  statsMedico(): Observable<ApiResponse<StatsMedico>> {
    return this.http.get<ApiResponse<StatsMedico>>(`${this.url}/medico`);
  }

  citasHoy(tamano = 20): Observable<ApiResponse<CitaResumen[]>> {
    const params = new HttpParams().set('tamano', tamano);
    return this.http.get<ApiResponse<CitaResumen[]>>(
      `${this.url}/citas-hoy`, { params }
    );
  }
}
