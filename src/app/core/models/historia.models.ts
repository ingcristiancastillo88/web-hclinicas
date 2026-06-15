// ── Tipos auxiliares ──────────────────────────────────────────────────────
export type TipoArchivo =
  | 'IMAGEN'
  | 'DOCUMENTO'
  | 'RECETA'
  | 'RESULTADO_LABORATORIO'
  | 'ECOGRAFIA'
  | 'OTRO';

// ── Historia Clínica ──────────────────────────────────────────────────────
export interface HistoriaClinica {
  id: number;
  pacienteId: number;
  pacienteCedula: string;
  pacienteNombreCompleto: string;
  pacienteEdad?: number;
  menarquia?: string;
  cicloMenstrual?: string;
  fechaUltimaMenstruacion?: string;
  gestas?: number;
  partos?: number;
  cesareas?: number;
  abortos?: number;
  hijosVivos?: number;
  metodoAnticonceptivo?: string;
  ultimoPapanicolau?: string;
  ultimaMamografia?: string;
  observacionesGenerales?: string;
  totalConsultas: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  creadoPor?: string;
}

export interface CrearHistoriaClinicaRequest {
  pacienteId: number;
  menarquia?: string;
  cicloMenstrual?: string;
  fechaUltimaMenstruacion?: string;
  gestas?: number;
  partos?: number;
  cesareas?: number;
  abortos?: number;
  hijosVivos?: number;
  metodoAnticonceptivo?: string;
  ultimoPapanicolau?: string;
  ultimaMamografia?: string;
  observacionesGenerales?: string;
}

// ── Consulta ──────────────────────────────────────────────────────────────
export interface ConsultaResumen {
  id: number;
  fechaConsulta: string;
  motivoConsulta: string;
  diagnosticoPrincipal: string;
  codigoCie10?: string;
  peso?: number;
  presionArterial?: string;
  semanasGestacion?: number;
  totalArchivos: number;
  fechaCreacion?: string;
  creadoPor?: string;
}

export interface ArchivoAdjunto {
  id: number;
  nombreOriginal: string;
  tipoMime: string;
  tamanoBytes: number;
  tipoArchivo: TipoArchivo;
  descripcion?: string;
  urlDescarga: string;
  fechaCreacion?: string;
  creadoPor?: string;
}

export interface ConsultaDetalle {
  id: number;
  historiaClinicaId: number;
  fechaConsulta: string;
  motivoConsulta: string;
  peso?: number;
  talla?: number;
  imc?: number;
  presionArterial?: string;
  frecuenciaCardiaca?: number;
  temperatura?: number;
  saturacionOxigeno?: number;
  semanasGestacion?: number;
  examenFisico?: string;
  diagnosticoPrincipal: string;
  diagnosticoSecundario?: string;
  codigoCie10?: string;
  tratamiento?: string;
  medicacion?: string;
  indicaciones?: string;
  proximaCita?: string;
  observaciones?: string;
  archivos: ArchivoAdjunto[];
  totalArchivos: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  creadoPor?: string;
  actualizadoPor?: string;
}

export interface CrearConsultaRequest {
  historiaClinicaId: number;
  fechaConsulta: string;
  motivoConsulta: string;
  peso?: number;
  talla?: number;
  presionArterial?: string;
  frecuenciaCardiaca?: number;
  temperatura?: number;
  saturacionOxigeno?: number;
  semanasGestacion?: number;
  examenFisico?: string;
  diagnosticoPrincipal: string;
  diagnosticoSecundario?: string;
  codigoCie10?: string;
  tratamiento?: string;
  medicacion?: string;
  indicaciones?: string;
  proximaCita?: string;
  observaciones?: string;
}

export type ActualizarConsultaRequest =
  Omit<CrearConsultaRequest, 'historiaClinicaId'>;
