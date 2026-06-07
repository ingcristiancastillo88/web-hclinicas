// ── Tipos ──────────────────────────────────────────────────────────────────
export type EstadoCita =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'ATENDIDA'
  | 'CANCELADA'
  | 'NO_ASISTIO';

export type TipoCita =
  | 'PRIMERA_VEZ'
  | 'CONTROL'
  | 'URGENCIA'
  | 'POSTPARTO'
  | 'PRENATAL'
  | 'RESULTADO'
  | 'OTRO';

// ── Cita completa ──────────────────────────────────────────────────────────
export interface CitaMedica {
  id: number;
  pacienteId: number;
  pacienteCedula: string;
  pacienteNombreCompleto: string;
  pacienteCelular?: string;
  usuarioId: number;
  usuarioNombreCompleto: string;
  fechaCita: string;         // 'YYYY-MM-DD'
  horaInicio: string;        // 'HH:mm'
  horaFin: string;           // 'HH:mm'
  duracionMinutos: number;
  tipoCita: TipoCita;
  motivoCita?: string;
  notasAdicionales?: string;
  estado: EstadoCita;
  motivoCancelacion?: string;
  fechaCancelacion?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  creadoPor?: string;
  actualizadoPor?: string;
}

// ── Cita resumen (calendario y listados) ──────────────────────────────────
export interface CitaResumen {
  id: number;
  fechaCita: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  tipoCita: TipoCita;
  motivoCita?: string;
  pacienteId: number;
  pacienteNombreCompleto: string;
  pacienteCedula: string;
  pacienteCelular?: string;
  estado: EstadoCita;
}

// ── Requests ──────────────────────────────────────────────────────────────
export interface CrearCitaRequest {
  pacienteId: number;
  fechaCita: string;
  horaInicio: string;
  duracionMinutos: number;
  tipoCita: TipoCita;
  motivoCita?: string;
  notasAdicionales?: string;
}

export interface ActualizarCitaRequest {
  fechaCita: string;
  horaInicio: string;
  duracionMinutos: number;
  tipoCita?: TipoCita;
  motivoCita?: string;
  notasAdicionales?: string;
}

export interface CancelarCitaRequest {
  motivoCancelacion: string;
}

// ── Disponibilidad ────────────────────────────────────────────────────────
export interface SlotOcupado {
  horaInicio: string;
  horaFin: string;
  pacienteNombre: string;
  tipoCita: string;
  estado: string;
}

export interface Disponibilidad {
  fecha: string;
  disponible: boolean;
  mensaje: string;
  slotsOcupados: SlotOcupado[];
}