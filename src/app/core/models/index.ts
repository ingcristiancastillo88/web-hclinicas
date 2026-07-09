// ── API Response wrapper ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  exitoso: boolean;
  mensaje: string;
  data: T;
  error?: string;
  timestamp?: string;
}

export interface PageResponse<T> {
  contenido: T[];
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  tamanioPagina: number;
  primera: boolean;
  ultima: boolean;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  expiracionMs: number;
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  rol: string;
  passwordTemporal: boolean;
}

export interface UsuarioSesion {
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  rol: string;
  token: string;
}

// ── Rol ───────────────────────────────────────────────────────────────────
export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
}

// ── Usuario ───────────────────────────────────────────────────────────────
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO';

export interface Usuario {
  tipoDocumento: string;
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  cedula?: string;
  correo: string;
  telefono?: string;
  rol: string;
  estado: EstadoUsuario;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  creadoPor?: string;
}

export interface CrearUsuarioRequest {
  nombres: string;
  apellidos: string;
  cedula?: string;
  correo: string;
  contrasena: string;
  telefono?: string;
  rolId: number;
}

export interface ActualizarUsuarioRequest {
  nombres: string;
  apellidos: string;
  cedula?: string;
  correo: string;
  contrasena?: string;
  telefono?: string;
  rolId: number;
}

// ── Auditoría ─────────────────────────────────────────────────────────────
export interface Auditoria {
  id: number;
  usuarioCorreo: string;
  nombreUsuario: string;
  accion: string;
  modulo: string;
  descripcion: string;
  ipOrigen: string;
  fechaAccion: string;
  exitoso: boolean;
  detalleError?: string;
}

// ── Paciente ──────────────────────────────────────────────────────────────
export type EstadoPaciente = 'ACTIVO' | 'INACTIVO';

export type EstadoCivil =
  | 'SOLTERO'
  | 'CASADO'
  | 'DIVORCIADO'
  | 'VIUDO'
  | 'UNION_LIBRE';

export type GrupoSanguineo =
  | 'A_POSITIVO'  | 'A_NEGATIVO'
  | 'B_POSITIVO'  | 'B_NEGATIVO'
  | 'AB_POSITIVO' | 'AB_NEGATIVO'
  | 'O_POSITIVO'  | 'O_NEGATIVO';

export interface PacienteResumen {
  id: number;
  cedula: string;
  historiaNumero?: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  fechaNacimiento?: string;
  edad?: number;
  celular?: string;
  correo?: string;
  ciudad?: string;
  grupoSanguineo?: GrupoSanguineo;
  estado: EstadoPaciente;
}

export interface Paciente {
  tipoDocumento: string;
  id: number;
  cedula: string;
  historiaNumero?: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  fechaNacimiento?: string;
  edad?: number;
  lugarNacimiento?: string;
  nacionalidad?: string;
  estadoCivil?: EstadoCivil;
  grupoSanguineo?: GrupoSanguineo;
  instruccion?: string;
  ocupacion?: string;
  religion?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaParentesco?: string;
  contactoEmergenciaTelefono?: string;
  alergias?: string;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  medicacionActual?: string;
  observacionesGenerales?: string;
  estado: EstadoPaciente;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  creadoPor?: string;
  actualizadoPor?: string;
  fechaUltimaMenustracion?: string;
}

export interface CrearPacienteRequest {
  cedula: string;
  historiaNumero?: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  lugarNacimiento?: string;
  nacionalidad?: string;
  estadoCivil?: EstadoCivil;
  grupoSanguineo?: GrupoSanguineo;
  instruccion?: string;
  ocupacion?: string;
  religion?: string;
  correo?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaParentesco?: string;
  contactoEmergenciaTelefono?: string;
  alergias?: string;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  medicacionActual?: string;
  observacionesGenerales?: string;
}

export type ActualizarPacienteRequest = Omit<CrearPacienteRequest, 'cedula'>;

// ── Menu ──────────────────────────────────────────────────────────────────
export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  roles?: string[];
  children?: MenuItem[];
  badge?: string;
}
