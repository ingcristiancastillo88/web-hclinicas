import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule,
         AbstractControl, ValidationErrors } from '@angular/forms';
import { InputTextModule }     from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule }      from 'primeng/dropdown';
import { CalendarModule }      from 'primeng/calendar';
import { ButtonModule }        from 'primeng/button';
import { TabViewModule }       from 'primeng/tabview';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { FormsModule }         from '@angular/forms';
import { MessageService }      from 'primeng/api';
import { PacienteService }     from '../../../core/services/paciente.service';

// ── Validador de cédula ecuatoriana (algoritmo módulo 10) ─────────────────
function validarCedulaEcuatoriana(control: AbstractControl): ValidationErrors | null {
  const cedula = control.value?.toString().trim() ?? '';
  if (!cedula) return null;                         // campo vacío → otro validator lo maneja
  if (!/^\d{10}$/.test(cedula)) return { cedulaInvalida: true };

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return { cedulaInvalida: true };

  const digitos   = cedula.split('').map(Number);
  const verificador = digitos[9];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let val = digitos[i] * (i % 2 === 0 ? 2 : 1);
    if (val >= 10) val -= 9;
    suma += val;
  }

  const residuo   = suma % 10;
  const esperado  = residuo === 0 ? 0 : 10 - residuo;
  return esperado === verificador ? null : { cedulaInvalida: true };
}

@Component({
  selector: 'app-paciente-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterLink,
    InputTextModule, TextareaModule, DropdownModule,
    CalendarModule, ButtonModule, TabViewModule,
    ToastModule, DividerModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon">
          <i [class]="'pi ' + (esEdicion() ? 'pi-pencil' : 'pi-user-plus')"></i>
        </div>
        <div>
          <h2>{{ esEdicion() ? 'Editar Paciente' : 'Nuevo Paciente' }}</h2>
          <p>{{ esEdicion()
                ? 'Actualiza la información del paciente'
                : 'Completa el formulario para registrar un nuevo paciente' }}</p>
        </div>
      </div>
      <div class="header-actions">
        @if (esEdicion()) {
          <a [routerLink]="['/pacientes', pacienteId()]">
            <p-button label="Ver Detalle" icon="pi pi-eye"
                      [text]="true" severity="secondary" />
          </a>
        }
        <a routerLink="/pacientes">
          <p-button label="Volver" icon="pi pi-arrow-left"
                    [text]="true" severity="secondary" />
        </a>
      </div>
    </div>

    <!-- Formulario con pestañas -->
    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <p-tabView styleClass="form-tabs">

          <!-- ── Pestaña 1: Datos Personales ── -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-user tab-icon"></i> Datos Personales</span>
            </ng-template>

            <div class="form-grid">

              <!-- ── TIPO DE DOCUMENTO ── -->
              <div class="field required-field">
                <label>Tipo de Documento <span class="req">*</span></label>
                <p-dropdown
                  formControlName="tipoDocumento"
                  [options]="opTipoDocumento"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecciona el tipo"
                  styleClass="w-full"
                  (onChange)="onTipoDocumentoCambio()"
                  [disabled]="esEdicion()"
                />
                @if (isInvalid('tipoDocumento')) {
                  <small class="err">
                    <i class="pi pi-exclamation-circle"></i>
                    Selecciona el tipo de documento
                  </small>
                }
              </div>

              <!-- ── NÚMERO DE DOCUMENTO (cédula / pasaporte / ID extranjero) ── -->
              <div class="field required-field">
                <label>
                  {{ labelDocumento() }} <span class="req">*</span>
                </label>
                <div class="doc-input-wrapper">
                  <span class="doc-badge" [class]="'badge-' + tipoDocumentoActual()">
                    <i [class]="'pi ' + iconoDocumento()"></i>
                  </span>
                  <input pInputText
                         formControlName="cedula"
                         [placeholder]="placeholderDocumento()"
                         [maxlength]="tipoDocumentoActual() === 'CEDULA' ? 10 : 20"
                         class="w-full doc-input"
                         [readonly]="esEdicion()" />
                </div>
                @if (isInvalid('cedula')) {
                  <small class="err">
                    <i class="pi pi-exclamation-circle"></i>
                    {{ getError('cedula') }}
                  </small>
                }
                @if (esEdicion()) {
                  <small class="hint">
                    <i class="pi pi-lock"></i>
                    El documento no puede modificarse
                  </small>
                }
              </div>

              <!-- Número de Historia -->
              <div class="field">
                <label>Número de Historia</label>
                <input pInputText formControlName="historiaNumero"
                       placeholder="HC-0001" maxlength="20" class="w-full" />
              </div>

              <div class="field required-field">
                <label>Nombres <span class="req">*</span></label>
                <input pInputText formControlName="nombres"
                       placeholder="Ingresa los nombres" class="w-full" />
                @if (isInvalid('nombres')) {
                  <small class="err">
                    <i class="pi pi-exclamation-circle"></i>
                    {{ getError('nombres') }}
                  </small>
                }
              </div>

              <div class="field required-field">
                <label>Apellidos <span class="req">*</span></label>
                <input pInputText formControlName="apellidos"
                       placeholder="Ingresa los apellidos" class="w-full" />
                @if (isInvalid('apellidos')) {
                  <small class="err">
                    <i class="pi pi-exclamation-circle"></i>
                    {{ getError('apellidos') }}
                  </small>
                }
              </div>

              <div class="field">
                <label>Fecha de Nacimiento</label>
                <p-calendar formControlName="fechaNacimiento"
                            placeholder="dd/mm/aaaa"
                            dateFormat="dd/mm/yy"
                            [maxDate]="hoy"
                            [showIcon]="true"
                            styleClass="w-full"
                            inputStyleClass="w-full" />
              </div>

              <div class="field">
                <label>Lugar de Nacimiento</label>
                <input pInputText formControlName="lugarNacimiento"
                       placeholder="Ciudad, Provincia" class="w-full" />
              </div>

              <div class="field">
                <label>Nacionalidad</label>
                <input pInputText formControlName="nacionalidad"
                       placeholder="Ecuatoriana" class="w-full" />
              </div>

              <div class="field">
                <label>Estado Civil</label>
                <p-dropdown formControlName="estadoCivil"
                            [options]="opEstadoCivil"
                            placeholder="Selecciona"
                            styleClass="w-full"
                            [showClear]="true" />
              </div>

              <div class="field">
                <label>Grupo Sanguíneo</label>
                <p-dropdown formControlName="grupoSanguineo"
                            [options]="opGrupoSanguineo"
                            placeholder="Selecciona"
                            styleClass="w-full"
                            [showClear]="true" />
              </div>

              <div class="field">
                <label>Instrucción</label>
                <p-dropdown formControlName="instruccion"
                            [options]="opInstruccion"
                            placeholder="Selecciona"
                            styleClass="w-full"
                            [showClear]="true" />
              </div>

              <div class="field">
                <label>Ocupación</label>
                <input pInputText formControlName="ocupacion"
                       placeholder="Docente, Comerciante..." class="w-full" />
              </div>

              <div class="field">
                <label>Religión</label>
                <input pInputText formControlName="religion"
                       placeholder="Católica, Evangélica..." class="w-full" />
              </div>

            </div>
          </p-tabPanel>

          <!-- ── Pestaña 2: Contacto ── -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-phone tab-icon"></i> Contacto</span>
            </ng-template>

            <div class="section-subtitle">Datos de Contacto</div>
            <div class="form-grid">

              <div class="field">
                <label>Correo Electrónico</label>
                <span class="p-input-icon-left w-full">
                  <i class="pi pi-envelope"></i>
                  <input pInputText type="email" formControlName="correo"
                         placeholder="paciente@correo.com" class="w-full" />
                </span>
                @if (isInvalid('correo')) {
                  <small class="err">
                    <i class="pi pi-exclamation-circle"></i>
                    {{ getError('correo') }}
                  </small>
                }
              </div>

              <div class="field">
                <label>Celular</label>
                <span class="p-input-icon-left w-full">
                  <i class="pi pi-mobile"></i>
                  <input pInputText formControlName="celular"
                         placeholder="0991234567" maxlength="15" class="w-full" />
                </span>
              </div>

              <div class="field">
                <label>Teléfono</label>
                <input pInputText formControlName="telefono"
                       placeholder="032-123456" maxlength="15" class="w-full" />
              </div>

              <div class="field field-full">
                <label>Dirección</label>
                <input pInputText formControlName="direccion"
                       placeholder="Calle, número, barrio..." class="w-full" />
              </div>

              <div class="field">
                <label>Ciudad</label>
                <input pInputText formControlName="ciudad"
                       placeholder="Riobamba" class="w-full" />
              </div>

              <div class="field">
                <label>Provincia</label>
                <p-dropdown formControlName="provincia"
                            [options]="opProvincias"
                            placeholder="Selecciona provincia"
                            styleClass="w-full"
                            [showClear]="true"
                            [filter]="true" />
              </div>

            </div>

            <p-divider />

            <div class="section-subtitle">
              <i class="pi pi-exclamation-triangle"></i>
              Contacto de Emergencia
            </div>
            <div class="form-grid">

              <div class="field">
                <label>Nombre del Contacto</label>
                <input pInputText formControlName="contactoEmergenciaNombre"
                       placeholder="Nombre completo" class="w-full" />
              </div>

              <div class="field">
                <label>Parentesco</label>
                <input pInputText formControlName="contactoEmergenciaParentesco"
                       placeholder="Madre, Padre, Cónyuge..." class="w-full" />
              </div>

              <div class="field">
                <label>Teléfono de Emergencia</label>
                <input pInputText formControlName="contactoEmergenciaTelefono"
                       placeholder="0991234567" maxlength="15" class="w-full" />
              </div>

            </div>
          </p-tabPanel>

          <!-- ── Pestaña 3: Antecedentes Médicos ── -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-heart tab-icon"></i> Antecedentes Médicos</span>
            </ng-template>

            <div class="form-grid-single">

              <div class="field">
                <label>Alergias</label>
                <textarea pInputTextarea formControlName="alergias"
                          rows="3" class="w-full"
                          placeholder="Medicamentos, alimentos u otras alergias conocidas...">
                </textarea>
              </div>

              <div class="field">
                <label>Antecedentes Personales</label>
                <textarea pInputTextarea formControlName="antecedentesPersonales"
                          rows="3" class="w-full"
                          placeholder="Enfermedades previas, cirugías, hospitalizaciones...">
                </textarea>
              </div>

              <div class="field">
                <label>Antecedentes Familiares</label>
                <textarea pInputTextarea formControlName="antecedentesFamiliares"
                          rows="3" class="w-full"
                          placeholder="Enfermedades hereditarias, antecedentes familiares relevantes...">
                </textarea>
              </div>

              <div class="field">
                <label>Medicación Actual</label>
                <textarea pInputTextarea formControlName="medicacionActual"
                          rows="3" class="w-full"
                          placeholder="Medicamentos que toma actualmente, dosis y frecuencia...">
                </textarea>
              </div>

              <div class="field">
                <label>Observaciones Generales</label>
                <textarea pInputTextarea formControlName="observacionesGenerales"
                          rows="3" class="w-full"
                          placeholder="Cualquier información adicional relevante...">
                </textarea>
              </div>

            </div>
          </p-tabPanel>

        </p-tabView>

        <!-- Botones -->
        <div class="form-actions">
          <a routerLink="/pacientes">
            <p-button label="Cancelar" icon="pi pi-times"
                      severity="secondary" [outlined]="true" />
          </a>
          <p-button
            type="submit"
            [label]="esEdicion() ? 'Guardar Cambios' : 'Registrar Paciente'"
            [icon]="esEdicion() ? 'pi pi-save' : 'pi pi-check'"
            [loading]="guardando()"
            [disabled]="form.invalid || guardando()"
            styleClass="btn-primary"
          />
        </div>

      </form>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .page-title  { display: flex; align-items: center; gap: 1rem; }
    .page-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #e91e8c, #c2185b);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .page-icon .pi { font-size: 1.4rem; color: white; }
    .page-title h2 { margin: 0 0 2px; font-size: 1.4rem; font-weight: 700; color: #0a2342; }
    .page-title p  { margin: 0; color: #64748b; font-size: 0.85rem; }
    .header-actions { display: flex; gap: 8px; }

    .form-card {
      background: white; border-radius: 16px;
      padding: 0 0 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07); overflow: hidden;
    }

    /* Tabs con acento rosado */
    :deep(.form-tabs .p-tabview-panels) { padding: 1.5rem 2rem; }
    :deep(.form-tabs .p-tabview-nav)    { padding: 0 1.5rem; background: #fdf2f8; }
    :deep(.form-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
      color: #c2185b; border-color: #e91e8c;
    }
    :deep(.form-tabs .p-tabview-nav li .p-tabview-nav-link:hover) {
      color: #e91e8c;
    }

    .tab-icon { margin-right: 6px; }

    /* Grid */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.2rem;
    }
    .form-grid-single { display: flex; flex-direction: column; gap: 1.2rem; }
    .field-full { grid-column: 1 / -1; }

    /* Field */
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 0.83rem; font-weight: 600; color: #334155; }
    .req  { color: #e91e8c; }
    .err  { display: flex; align-items: center; gap: 4px; color: #ef4444; font-size: 0.78rem; }
    .hint { display: flex; align-items: center; gap: 4px; color: #94a3b8; font-size: 0.78rem; }

    /* Tipo de documento — input con badge */
    .doc-input-wrapper {
      display: flex; align-items: center; gap: 0;
      border: 1px solid #d1d5db; border-radius: 8px;
      overflow: hidden; transition: border-color .2s;
    }
    .doc-input-wrapper:focus-within { border-color: #e91e8c; box-shadow: 0 0 0 2px rgba(233,30,140,.12); }

    .doc-badge {
      display: flex; align-items: center; justify-content: center;
      width: 42px; height: 42px; flex-shrink: 0;
      font-size: .9rem;
    }
    .badge-CEDULA    { background: #fce4ec; color: #c2185b; }
    .badge-PASAPORTE { background: #e3f2fd; color: #1565c0; }
    .badge-ID_EXTRANJERO { background: #e8f5e9; color: #2e7d32; }

    .doc-input {
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      flex: 1;
    }
    :deep(.doc-input.p-inputtext:enabled:focus) {
      box-shadow: none !important;
      border-color: transparent !important;
    }

    /* Section subtitle */
    .section-subtitle {
      font-size: 0.9rem; font-weight: 700; color: #0a2342;
      margin-bottom: 1rem; display: flex; align-items: center; gap: 6px;
    }
    .section-subtitle .pi { color: #e91e8c; }

    /* Actions */
    .form-actions {
      display: flex; justify-content: flex-end;
      gap: 1rem; padding: 0 2rem; flex-wrap: wrap;
    }

    /* Botón primario rosado */
    :deep(.btn-primary) {
      background: linear-gradient(135deg, #e91e8c, #c2185b) !important;
      border-color: #c2185b !important;
    }
    :deep(.btn-primary:hover) {
      background: linear-gradient(135deg, #c2185b, #ad1457) !important;
    }

    :deep(textarea.p-inputtextarea) { border-radius: 10px !important; resize: vertical; }
  `]
})
export class PacienteFormComponent implements OnInit {

  private fb              = inject(FormBuilder);
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private pacienteService = inject(PacienteService);
  private toast           = inject(MessageService);

  esEdicion  = signal(false);
  guardando  = signal(false);
  pacienteId = signal<number | null>(null);
  hoy        = new Date();

  // ── Tipo documento actual (para helpers visuales) ─────────────────────────
  tipoDocumentoActual = signal<string>('CEDULA');

  // ── Opciones ──────────────────────────────────────────────────────────────
  opTipoDocumento = [
    { label: 'Cédula de Ciudadanía',        value: 'CEDULA' },
    { label: 'Pasaporte',                   value: 'PASAPORTE' },
    { label: 'Identificación del Extranjero', value: 'ID_EXTRANJERO' },
  ];

  opEstadoCivil = [
    { label: 'Soltero/a',    value: 'SOLTERO' },
    { label: 'Casado/a',     value: 'CASADO' },
    { label: 'Divorciado/a', value: 'DIVORCIADO' },
    { label: 'Viudo/a',      value: 'VIUDO' },
    { label: 'Unión Libre',  value: 'UNION_LIBRE' },
  ];

  opGrupoSanguineo = [
    { label: 'A+',  value: 'A_POSITIVO'  }, { label: 'A−',  value: 'A_NEGATIVO'  },
    { label: 'B+',  value: 'B_POSITIVO'  }, { label: 'B−',  value: 'B_NEGATIVO'  },
    { label: 'AB+', value: 'AB_POSITIVO' }, { label: 'AB−', value: 'AB_NEGATIVO' },
    { label: 'O+',  value: 'O_POSITIVO'  }, { label: 'O−',  value: 'O_NEGATIVO'  },
  ];

  opInstruccion = [
    { label: 'Ninguna',    value: 'Ninguna'    },
    { label: 'Primaria',   value: 'Primaria'   },
    { label: 'Secundaria', value: 'Secundaria' },
    { label: 'Superior',   value: 'Superior'   },
    { label: 'Posgrado',   value: 'Posgrado'   },
  ];

  opProvincias = [
    'Azuay','Bolívar','Cañar','Carchi','Chimborazo','Cotopaxi',
    'El Oro','Esmeraldas','Galápagos','Guayas','Imbabura',
    'Loja','Los Ríos','Manabí','Morona Santiago','Napo',
    'Orellana','Pastaza','Pichincha','Santa Elena',
    'Santo Domingo','Sucumbíos','Tungurahua','Zamora Chinchipe'
  ].map(p => ({ label: p, value: p }));

  // ── Formulario ────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    // Documento
    tipoDocumento:   ['CEDULA', Validators.required],
    cedula:          ['', [Validators.required, validarCedulaEcuatoriana]],
    historiaNumero:  [''],
    // Personales
    nombres:         ['', [Validators.required, Validators.maxLength(100)]],
    apellidos:       ['', [Validators.required, Validators.maxLength(100)]],
    fechaNacimiento: [null],
    lugarNacimiento: [''],
    nacionalidad:    ['Ecuatoriana'],
    estadoCivil:     [null],
    grupoSanguineo:  [null],
    instruccion:     [null],
    ocupacion:       [''],
    religion:        [''],
    // Contacto
    correo:          ['', Validators.email],
    celular:         [''],
    telefono:        [''],
    direccion:       [''],
    ciudad:          [''],
    provincia:       [null],
    contactoEmergenciaNombre:     [''],
    contactoEmergenciaParentesco: [''],
    contactoEmergenciaTelefono:   [''],
    // Antecedentes
    alergias:               [''],
    antecedentesPersonales: [''],
    antecedentesFamiliares: [''],
    medicacionActual:       [''],
    observacionesGenerales: [''],
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.pacienteId.set(Number(id));
      this.form.get('cedula')?.disable();
      this.form.get('tipoDocumento')?.disable();
      this.cargarPaciente(Number(id));
    }
  }

  // ── Cambio de tipo de documento ───────────────────────────────────────────
  onTipoDocumentoCambio(): void {
    const tipo = this.form.get('tipoDocumento')?.value ?? 'CEDULA';
    this.tipoDocumentoActual.set(tipo);

    const cedulaCtrl = this.form.get('cedula')!;
    cedulaCtrl.setValue('');

    if (tipo === 'CEDULA') {
      // Solo cédula lleva validación del algoritmo ecuatoriano
      cedulaCtrl.setValidators([
        Validators.required,
        validarCedulaEcuatoriana
      ]);
    } else {
      // Pasaporte e ID extranjero: solo obligatorio, sin algoritmo
      cedulaCtrl.setValidators([Validators.required]);
    }
    cedulaCtrl.updateValueAndValidity();
  }

  // ── Helpers visuales para el campo documento ──────────────────────────────
  labelDocumento(): string {
    const m: Record<string, string> = {
      CEDULA:        'Número de Cédula',
      PASAPORTE:     'Número de Pasaporte',
      ID_EXTRANJERO: 'Número de Identificación'
    };
    return m[this.tipoDocumentoActual()] ?? 'Número de Documento';
  }

  placeholderDocumento(): string {
    const m: Record<string, string> = {
      CEDULA:        '10 dígitos numéricos',
      PASAPORTE:     'Ej: A1234567',
      ID_EXTRANJERO: 'Número de identificación'
    };
    return m[this.tipoDocumentoActual()] ?? 'Ingresa el número';
  }

  iconoDocumento(): string {
    const m: Record<string, string> = {
      CEDULA:        'pi-id-card',
      PASAPORTE:     'pi-book',
      ID_EXTRANJERO: 'pi-globe'
    };
    return m[this.tipoDocumentoActual()] ?? 'pi-id-card';
  }

  // ── Carga en edición ──────────────────────────────────────────────────────
  cargarPaciente(id: number): void {
    this.pacienteService.obtener(id).subscribe({
      next: res => {
        if (!res.data) return;
        const p = res.data;
        // Detectar tipo de documento desde los datos cargados
        const tipo = p.tipoDocumento ?? 'CEDULA';
        this.tipoDocumentoActual.set(tipo);
        this.form.patchValue({
          ...p,
          tipoDocumento:   tipo,
          fechaNacimiento: p.fechaNacimiento
            ? new Date(p.fechaNacimiento) : null
        });
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar el paciente' });
        this.router.navigate(['/pacientes']);
      }
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      fechaNacimiento: raw.fechaNacimiento instanceof Date
        ? raw.fechaNacimiento.toISOString().split('T')[0]
        : raw.fechaNacimiento
    };

    if (this.esEdicion()) {
      const { cedula, tipoDocumento, ...updatePayload } = payload;
      this.pacienteService.actualizar(this.pacienteId()!, updatePayload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Guardado',
            detail: 'Paciente actualizado exitosamente' });
          setTimeout(() => this.router.navigate(['/pacientes']), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity: 'error', summary: 'Error',
            detail: err.error?.mensaje ?? 'No se pudo actualizar' });
          this.guardando.set(false);
        }
      });
    } else {
      this.pacienteService.crear(payload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Registrado',
            detail: 'Paciente registrado exitosamente' });
          setTimeout(() => this.router.navigate(['/pacientes']), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity: 'error', summary: 'Error',
            detail: err.error?.mensaje ?? 'No se pudo registrar el paciente' });
          this.guardando.set(false);
        }
      });
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (ctrl?.hasError('required'))      return 'Este campo es obligatorio';
    if (ctrl?.hasError('email'))         return 'Ingresa un correo válido';
    if (ctrl?.hasError('cedulaInvalida'))
      return 'La cédula ecuatoriana ingresada no es válida';
    if (ctrl?.hasError('pattern'))
      return 'Formato incorrecto';
    return '';
  }
}
