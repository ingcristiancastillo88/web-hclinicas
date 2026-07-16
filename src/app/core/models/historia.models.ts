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
  pacienteEdad?: number;
  pacienteNombre?: string;

  // ── Parámetros de la visita ─────────────────────────────────────────────
  fechaConsulta: string;
  tipoConsulta?: string;
  estaEmbarazada?: boolean;

  // ── Anamnesis ───────────────────────────────────────────────────────────
  motivoConsulta: string;
  enfermedadActual?: string;
  reporteExamenesPrevios?: string;

  // ── Signos vitales ──────────────────────────────────────────────────────
  peso?: number;
  talla?: number;
  imc?: number;
  presionArterial?: string;
  frecuenciaCardiaca?: number;
  frecuenciaCardiacaTexto?: string;
  temperatura?: number;
  temperaturaTexto?: string;
  saturacionOxigeno?: number;
  saturacionTexto?: string;
  frecuenciaRespiratoriaTexto?: string;
  semanasGestacion?: number;

  // ── Módulo Materno-Fetal ────────────────────────────────────────────────
  fumConsulta?: string;
  alturaUterina?: string;
  fcFetal?: string;
  presentacionFetal?: string;
  tonoUterino?: string;
  movimientosFetales?: string;
  pesoFetalEstimado?: string;
  scoreMama?: string;

  // ── Examen físico por sistemas ──────────────────────────────────────────
  examenFisico?: string;
  examenCabeza?: string;
  examenTorax?: string;
  examenAbdomen?: string;
  examenGenital?: string;
  examenExtremidades?: string;

  // ── Módulo Ginecológico ─────────────────────────────────────────────────
  inspeccionVulva?: string;
  especuloscopia?: string;
  tactoVaginal?: string;
  examenMamas?: string;

  // ── Diagnóstico ─────────────────────────────────────────────────────────
  diagnosticoPrincipal: string;
  diagnosticoSecundario?: string;
  codigoCie10?: string;
  codigoCie10Descripcion?: string;
  codigosCie10Secundarios?: string[];

  // ── Tratamiento ─────────────────────────────────────────────────────────
  tratamiento?: string;
  medicacion?: string;
  indicaciones?: string;
  proximaCita?: string;
  observaciones?: string;

  // ── FUM ─────────────────────────────────────────────────────────────────
  fechaUltimaMenustracion?: string;

  // ── Archivos y auditoría ────────────────────────────────────────────────
  archivos: ArchivoAdjunto[];
  totalArchivos: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  creadoPor?: string;
  actualizadoPor?: string;
}

export interface CrearConsultaRequest {
  historiaClinicaId: number;

  // ── Parámetros de la visita ─────────────────────────────────────────────
  fechaConsulta: string;
  tipoConsulta?: string;
  estaEmbarazada?: boolean;

  // ── Anamnesis ───────────────────────────────────────────────────────────
  motivoConsulta: string;
  enfermedadActual?: string;
  reporteExamenesPrevios?: string;

  // ── Signos vitales ──────────────────────────────────────────────────────
  peso?: number;
  talla?: number;
  presionArterial?: string;
  frecuenciaCardiaca?: number;
  frecuenciaCardiacaTexto?: string;
  temperatura?: number;
  temperaturaTexto?: string;
  saturacionOxigeno?: number;
  saturacionTexto?: string;
  frecuenciaRespiratoriaTexto?: string;
  semanasGestacion?: number;

  // ── Módulo Materno-Fetal ────────────────────────────────────────────────
  fumConsulta?: string;
  alturaUterina?: string;
  fcFetal?: string;
  presentacionFetal?: string;
  tonoUterino?: string;
  movimientosFetales?: string;
  pesoFetalEstimado?: string;
  scoreMama?: string;

  // ── Examen físico por sistemas ──────────────────────────────────────────
  examenFisico?: string;
  examenCabeza?: string;
  examenTorax?: string;
  examenAbdomen?: string;
  examenGenital?: string;
  examenExtremidades?: string;

  // ── Módulo Ginecológico ─────────────────────────────────────────────────
  inspeccionVulva?: string;
  especuloscopia?: string;
  tactoVaginal?: string;
  examenMamas?: string;

  // ── Diagnóstico ─────────────────────────────────────────────────────────
  diagnosticoPrincipal: string;
  diagnosticoSecundario?: string;
  codigoCie10?: string;
  codigosCie10Secundarios?: string[];

  // ── Tratamiento ─────────────────────────────────────────────────────────
  tratamiento?: string;
  medicacion?: string;
  indicaciones?: string;
  proximaCita?: string;
  observaciones?: string;

  // ── FUM ─────────────────────────────────────────────────────────────────
  fechaUltimaMenustracion?: string;
}

// ActualizarConsultaRequest es igual pero sin historiaClinicaId
export type ActualizarConsultaRequest =
  Omit<CrearConsultaRequest, 'historiaClinicaId'>;
