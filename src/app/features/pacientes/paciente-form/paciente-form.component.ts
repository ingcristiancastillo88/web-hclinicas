import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { InputTextModule }     from 'primeng/inputtext';
import { TextareaModule }      from 'primeng/textarea';
import { DropdownModule }      from 'primeng/dropdown';
import { SelectButtonModule }  from 'primeng/selectbutton';
import { CalendarModule }      from 'primeng/calendar';
import { InputNumberModule }   from 'primeng/inputnumber';
import { ButtonModule }        from 'primeng/button';
import { TabViewModule }       from 'primeng/tabview';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { TooltipModule }       from 'primeng/tooltip';
import { MessageService }      from 'primeng/api';
import { PacienteService }     from '../../../core/services/paciente.service';

// ── Validador cédula ecuatoriana (módulo 10) ──────────────────────────────
function validarCedulaEcuatoriana(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value?.toString().trim() ?? '';
  if (!v) return null;
  if (!/^\d{10}$/.test(v)) return { cedulaInvalida: true };
  const prov = parseInt(v.substring(0, 2), 10);
  if (prov < 1 || prov > 24) return { cedulaInvalida: true };
  const d = v.split('').map(Number);
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = d[i] * (i % 2 === 0 ? 2 : 1);
    if (val > 9) val -= 9;
    suma += val;
  }
  const check = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  return check === d[9] ? null : { cedulaInvalida: true };
}

@Component({
  selector: 'app-paciente-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    InputTextModule, TextareaModule, DropdownModule,
    SelectButtonModule, CalendarModule, InputNumberModule,
    ButtonModule, TabViewModule, ToastModule,
    DividerModule, TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-right" />

    <!-- ── Header ── -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon">
          <i [class]="'pi ' + (esEdicion() ? 'pi-pencil' : 'pi-user-plus')"></i>
        </div>
        <div>
          <h2>{{ esEdicion() ? 'Editar Paciente' : 'Registrar Paciente' }}</h2>
          <p>{{ esEdicion()
               ? 'Actualiza la información de la paciente'
               : 'Completa los datos para registrar una nueva paciente' }}</p>
          @if (numeroHistoria()) {
            <div class="hc-badge">
              <i class="pi pi-file"></i>
              {{ numeroHistoria() }}
            </div>
          }
        </div>
      </div>
      <div class="header-actions">
        <p-button label="Cancelar" icon="pi pi-times"
                  [text]="true" severity="secondary"
                  (onClick)="router.navigate(['/pacientes'])" />
        <p-button
          [label]="esEdicion() ? 'Guardar Cambios' : 'Registrar Paciente'"
          [icon]="esEdicion() ? 'pi pi-save' : 'pi pi-check'"
          styleClass="btn-primary"
          [loading]="guardando()"
          [disabled]="guardando()"
          (onClick)="onSubmit()" />
      </div>
    </div>

    <!-- ── Formulario ── -->
    <div class="form-card">
      <form [formGroup]="form">
        <p-tabView styleClass="form-tabs">

          <!-- ══════════════════════════════════════════════════════════════
               TAB 1 — FILIACIÓN Y DATOS ADMINISTRATIVOS
               ══════════════════════════════════════════════════════════════ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-id-card tab-icon"></i> Filiación</span>
            </ng-template>

            <!-- Bloque Historia Clínica -->
            <div class="seccion-bloque">
              <div class="seccion-titulo morado">
                <i class="pi pi-file-edit"></i>
                Filiación y Datos Administrativos
              </div>

              <!-- Fila 1: Documento + HC -->
              <div class="form-grid-4">
                <div class="field">
                  <label>Tipo de Documento <span class="req">*</span></label>
                  <p-dropdown formControlName="tipoDocumento"
                              [options]="opTipoDocumento"
                              appendTo="body"
                              (onChange)="onTipoDocumentoCambio()"
                              styleClass="w-full" />
                </div>
                <div class="field">
                  <label>{{ labelDocumento() }} <span class="req">*</span></label>
                  <div class="input-icon-wrap">
                    <i [class]="'pi ' + iconoDocumento()"></i>
                    <input pInputText formControlName="cedula"
                           [placeholder]="placeholderDocumento()" class="w-full" />
                  </div>
                  @if (isInvalid('cedula')) {
                    <small class="err">{{ getError('cedula') }}</small>
                  }
                </div>
                <div class="field">
                  <label>Historia Clínica N°</label>
                  <div class="hc-numero-display">
                    <i class="pi pi-file-edit"></i>
                    <span>{{ numeroHistoria() || 'Se genera automáticamente' }}</span>
                  </div>
                </div>
                <div class="field">
                  <label>Grupo Sanguíneo y Factor Rh</label>
                  <p-dropdown formControlName="grupoSanguineo"
                              [options]="opGrupoSanguineo"
                              placeholder="Selecciona"
                              appendTo="body"
                              styleClass="w-full"
                              [showClear]="true" />
                </div>
              </div>

              <!-- Fila 2: Nombres -->
              <div class="form-grid-2">
                <div class="field">
                  <label>Nombres Completos <span class="req">*</span></label>
                  <input pInputText formControlName="nombres"
                         placeholder="Nombres de la paciente" class="w-full" />
                  @if (isInvalid('nombres')) {
                    <small class="err">{{ getError('nombres') }}</small>
                  }
                </div>
                <div class="field">
                  <label>Apellidos <span class="req">*</span></label>
                  <input pInputText formControlName="apellidos"
                         placeholder="Apellidos de la paciente" class="w-full" />
                  @if (isInvalid('apellidos')) {
                    <small class="err">{{ getError('apellidos') }}</small>
                  }
                </div>
              </div>

              <!-- Fila 3: Nacimiento + Edad -->
              <div class="form-grid-4">
                <div class="field">
                  <label>Fecha de Nacimiento</label>
                  <p-calendar formControlName="fechaNacimiento"
                              [maxDate]="hoy" [showIcon]="true"
                              dateFormat="dd/mm/yy"
                              appendTo="body"
                              styleClass="w-full" inputStyleClass="w-full"
                              (onSelect)="calcularEdad()" />
                </div>
                <div class="field">
                  <label>Edad Cronológica (Autocalculada)</label>
                  <div class="edad-display">
                    {{ edadCalculada() !== null ? edadCalculada() + ' años' : '—' }}
                  </div>
                </div>
                <div class="field">
                  <label>Estado Civil</label>
                  <p-dropdown formControlName="estadoCivil"
                              [options]="opEstadoCivil"
                              placeholder="Selecciona"
                              appendTo="body"
                              styleClass="w-full"
                              [showClear]="true" />
                </div>
                <div class="field">
                  <label>Ocupación</label>
                  <input pInputText formControlName="ocupacion"
                         placeholder="Ej: Docente Universitaria" class="w-full" />
                </div>
              </div>

              <!-- Fila 4: Correo + Celular -->
              <div class="form-grid-3">
                <div class="field req-field">
                  <label>Correo Electrónico <span class="req">*</span></label>
                  <input pInputText type="email" formControlName="correo"
                         placeholder="correo@ejemplo.com" class="w-full" />
                  @if (isInvalid('correo')) {
                    <small class="err">{{ getError('correo') }}</small>
                  }
                </div>
                <div class="field">
                  <label>Dirección de Residencia / Dominio</label>
                  <input pInputText formControlName="direccion"
                         placeholder="Calle, sector, ciudad" class="w-full" />
                </div>
                <div class="field">
                  <label>Teléfono Celular / WhatsApp</label>
                  <input pInputText formControlName="celular"
                         placeholder="09XXXXXXXX" class="w-full" />
                </div>
              </div>

              <!-- Fila 5: Contacto emergencia -->
              <div class="form-grid-3">
                <div class="field">
                  <label>Contacto de Emergencia (Nombre y Parentesco)</label>
                  <input pInputText formControlName="contactoEmergenciaNombre"
                         placeholder="Ej: Carlos Freire (Esposo)" class="w-full" />
                </div>
                <div class="field">
                  <label>Teléfono de Emergencia</label>
                  <input pInputText formControlName="contactoEmergenciaTelefono"
                         placeholder="09XXXXXXXX" class="w-full" />
                </div>
                <div class="field">
                  <label>Instrucción</label>
                  <p-dropdown formControlName="instruccion"
                              [options]="opInstruccion"
                              placeholder="Nivel educativo"
                              appendTo="body"
                              styleClass="w-full"
                              [showClear]="true" />
                </div>
              </div>

            </div>
          </p-tabPanel>

          <!-- ══════════════════════════════════════════════════════════════
               TAB 2 — ANTECEDENTES MÉDICOS COMPLETOS
               ══════════════════════════════════════════════════════════════ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-heart tab-icon"></i> Antecedentes</span>
            </ng-template>

            <!-- 1. Antecedentes Personales Patológicos -->
            <div class="seccion-bloque">
              <div class="seccion-titulo morado">
                <i class="pi pi-user"></i>
                1. Antecedentes Personales (Patológicos)
              </div>
              <div class="field-full">
                <label class="label-upper">Enfermedades Crónicas y Diagnósticos Previos:</label>
                <textarea pInputTextarea formControlName="antecedentesPersonales"
                          rows="3" class="w-full"
                          placeholder="Ej: Hipotiroidismo diagnosticado en 2021 (En tratamiento endócrino continuo con levotiroxina)...">
                </textarea>
              </div>
            </div>

            <!-- 2. Antecedentes Quirúrgicos -->
            <div class="seccion-bloque">
              <div class="seccion-titulo morado">
                <i class="pi pi-verified"></i>
                2. Antecedentes Quirúrgicos
              </div>
              <div class="field-full">
                <label class="label-upper">Cirugías Previas Generales o Ginecológicas:</label>
                <textarea pInputTextarea formControlName="antecedentesQuirurgicos"
                          rows="3" class="w-full"
                          placeholder="Ej: Apendicectomía laparoscópica (2018). Negativo para cirugías ginecológicas mayores...">
                </textarea>
              </div>
            </div>

            <!-- 3. Antecedentes Familiares -->
            <div class="seccion-bloque">
              <div class="seccion-titulo morado">
                <i class="pi pi-users"></i>
                3. Antecedentes Familiares
              </div>
              <div class="field-full">
                <label class="label-upper">Heredo-Familiares en Línea Directa (Madre, Padre, Hermanos):</label>
                <textarea pInputTextarea formControlName="antecedentesFamiliares"
                          rows="3" class="w-full"
                          placeholder="Ej: Madre diagnosticada con Hipertensión Arterial crónica; Abuela materna con Diabetes Mellitus tipo 2...">
                </textarea>
              </div>
            </div>

            <!-- 4. Alergias -->
            <div class="seccion-bloque alergia-bloque" [class.tiene-alergia]="tieneAlergia()">
              <div class="seccion-titulo morado">
                <i class="pi pi-exclamation-triangle"></i>
                4. Alergias
              </div>
              <div class="field">
                <label class="label-upper">¿Presenta Alergias Conocidas? (Indicación Obligatoria):</label>
                <p-dropdown formControlName="tieneAlergia"
                            [options]="opAlergia"
                            appendTo="body"
                            styleClass="w-full"
                            (onChange)="onAlergiaChange()" />
              </div>
              @if (tieneAlergia()) {
                <div class="field-full mt-8">
                  <textarea pInputTextarea formControlName="alergias"
                            rows="2" class="w-full alergia-input"
                            placeholder="Describa las alergias: medicamentos, alimentos, sustancias y reacciones...">
                  </textarea>
                </div>
              }
            </div>

            <!-- 5. Vacuna HPV -->
            <div class="seccion-bloque">
              <div class="seccion-titulo morado">
                <i class="pi pi-shield"></i>
                5. Vacuna para HPV
              </div>
              <div class="field">
                <label class="label-upper">Estado de Inmunización contra VPH:</label>
                <p-dropdown formControlName="estadoVacunaHpv"
                            [options]="opVacunaHpv"
                            placeholder="Seleccionar estado"
                            appendTo="body"
                            styleClass="w-full"
                            [showClear]="true" />
              </div>
            </div>

            <!-- 6. Antecedentes Gineco-Obstétricos -->
            <div class="seccion-bloque">
              <div class="seccion-titulo morado">
                <i class="pi pi-heart-fill"></i>
                6. Antecedentes Gineco-Obstétricos (Línea Base)
              </div>

              <!-- Fórmula Obstétrica -->
              <div class="formula-obstetrica">
                <div class="fo-titulo">
                  <i class="pi pi-table"></i>
                  Fórmula Obstétrica Histórica (Campos Editables por Separado):
                </div>
                <div class="fo-grid">
                  <div class="fo-item">
                    <label>Gestas (G)</label>
                    <p-inputNumber formControlName="gestas" [min]="0"
                                   [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="fo-item">
                    <label>Partos (P)</label>
                    <p-inputNumber formControlName="partos" [min]="0"
                                   [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="fo-item">
                    <label>Cesáreas (C)</label>
                    <p-inputNumber formControlName="cesareas" [min]="0"
                                   [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="fo-item">
                    <label>Abortos (A)</label>
                    <p-inputNumber formControlName="abortos" [min]="0"
                                   [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="fo-item">
                    <label>Vivos (NV)</label>
                    <p-inputNumber formControlName="nacidosVivos" [min]="0"
                                   [showButtons]="true" styleClass="w-full" />
                  </div>
                </div>
              </div>

              <!-- Datos gineco -->
              <div class="form-grid-5 mt-12">
                <div class="field">
                  <label class="label-upper">Menarquia (Años):</label>
                  <input pInputText formControlName="menarquia"
                         placeholder="Ej: 12" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Ciclos Menstruales:</label>
                  <input pInputText formControlName="ciclosMenstruales"
                         placeholder="Ej: 28/4 días (Regulares)" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Inicio Vida Sexual (IVS - Años):</label>
                  <input pInputText formControlName="inicioVidaSexual"
                         placeholder="Ej: 19" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Antecedentes de ETS:</label>
                  <input pInputText formControlName="ets"
                         placeholder="Ej: No refiere" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Planificación Familiar Actual:</label>
                  <p-dropdown formControlName="planificacionFamiliar"
                              [options]="opPlanificacion"
                              placeholder="Seleccionar"
                              appendTo="body"
                              styleClass="w-full"
                              [showClear]="true" />
                </div>
              </div>

              <div class="form-grid-5 mt-8">
                <div class="field">
                  <label class="label-upper">Último Papanicolaou (Fecha y Resultado):</label>
                  <input pInputText formControlName="ultimoPapanicolau"
                         placeholder="Ej: 10/11/2025 (NILM)" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Tamizaje Mamario (ECO / Mamografía):</label>
                  <input pInputText formControlName="tamizajeMamario"
                         placeholder="Ej: Ecografía bilateral normal" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Menopausia / Climaterio:</label>
                  <input pInputText formControlName="menopausia"
                         placeholder="Ej: No aplica (edad fértil)" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">FUM (Fecha Última Menstruación):</label>
                  <p-calendar formControlName="fechaUltimaMenustracion"
                              [showIcon]="true" dateFormat="dd/mm/yy"
                              [maxDate]="hoy" appendTo="body"
                              styleClass="w-full" inputStyleClass="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">FPP (Fecha Probable de Parto - Auto):</label>
                  <div class="fpp-display">
                    {{ fppCalculada() || '—' }}
                  </div>
                </div>
              </div>

              <!-- Medicación actual -->
              <div class="field-full mt-12">
                <label class="label-upper">Medicación Actual / Habitual:</label>
                <textarea pInputTextarea formControlName="medicacionActual"
                          rows="2" class="w-full"
                          placeholder="Medicamentos que toma actualmente con dosis y frecuencia...">
                </textarea>
              </div>
            </div>

          </p-tabPanel>

        </p-tabView>

        <!-- Botones -->
        <div class="form-actions">
          <p-button label="Cancelar" icon="pi pi-times"
                    severity="secondary" [outlined]="true"
                    (onClick)="router.navigate(['/pacientes'])" />
          <p-button
            [label]="esEdicion() ? 'Guardar Cambios' : 'Registrar Paciente'"
            [icon]="esEdicion() ? 'pi pi-save' : 'pi pi-check'"
            styleClass="btn-primary"
            [loading]="guardando()"
            [disabled]="form.invalid || guardando()"
            (onClick)="onSubmit()" />
        </div>

      </form>
    </div>
  `,
  styles: [`
    .page-header {
      display:flex; align-items:flex-start; justify-content:space-between;
      margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;
    }
    .page-title   { display:flex; align-items:flex-start; gap:1rem; }
    .header-actions { display:flex; gap:.75rem; align-items:center; }
    .page-icon {
      width:52px; height:52px;
      background:linear-gradient(135deg,#e91e8c,#c2185b);
      border-radius:14px; display:flex; align-items:center; justify-content:center;
      flex-shrink:0;
    }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 2px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }

    .hc-badge {
      display:inline-flex; align-items:center; gap:5px;
      background:#f5f3ff; color:#6d28d9;
      font-size:.75rem; font-weight:700;
      padding:3px 10px; border-radius:20px; margin-top:5px;
    }

    .form-card {
      background:white; border-radius:16px;
      box-shadow:0 2px 12px rgba(0,0,0,.07); overflow:hidden;
    }

    :deep(.form-tabs .p-tabview-panels) { padding:1.5rem 2rem; }
    :deep(.form-tabs .p-tabview-nav)    { padding:0 1.5rem; background:#fdf2f8; }
    :deep(.form-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
      color:#c2185b; border-color:#e91e8c;
    }
    .tab-icon { margin-right:6px; }

    /* Secciones */
    .seccion-bloque {
      margin-bottom:1.5rem;
      padding:1.25rem;
      background:#fafafa;
      border-radius:12px;
      border:1px solid #f1f5f9;
    }
    .seccion-titulo {
      display:flex; align-items:center; gap:8px;
      font-size:.92rem; font-weight:800;
      padding:8px 12px; border-radius:8px;
      margin-bottom:1rem;
      border-left:4px solid #e91e8c;
    }
    .seccion-titulo.morado {
      color:#6d28d9; background:#f5f3ff;
      border-left-color:#7c3aed;
    }
    .seccion-titulo .pi { font-size:.95rem; }

    /* Grids */
    .form-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1rem; }
    .form-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1rem; }
    .form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
    .form-grid-5 { display:grid; grid-template-columns:repeat(5,1fr); gap:1rem; }
    .field-full  { margin-bottom:1rem; }
    @media (max-width:900px) {
      .form-grid-4,.form-grid-5 { grid-template-columns:repeat(2,1fr); }
      .form-grid-3 { grid-template-columns:1fr 1fr; }
    }
    @media (max-width:600px) {
      .form-grid-4,.form-grid-5,.form-grid-3,.form-grid-2 { grid-template-columns:1fr; }
    }

    .field { display:flex; flex-direction:column; gap:5px; }
    .field label,.label-upper {
      font-size:.78rem; font-weight:700; color:#475569;
      text-transform:uppercase; letter-spacing:.03em;
    }
    .req { color:#e91e8c; }
    .err { display:flex; align-items:center; gap:4px; color:#ef4444; font-size:.75rem; }
    .mt-8  { margin-top:.5rem; }
    .mt-12 { margin-top:.75rem; }

    /* Input con ícono */
    .input-icon-wrap { position:relative; }
    .input-icon-wrap .pi {
      position:absolute; left:10px; top:50%;
      transform:translateY(-50%); color:#94a3b8;
    }
    .input-icon-wrap input { padding-left:32px !important; }

    /* HC número display */
    .hc-numero-display {
      display:flex; align-items:center; gap:8px;
      background:#f5f3ff; border:1.5px solid #ddd6fe;
      border-radius:10px; padding:.6rem 1rem;
      font-size:.9rem; font-weight:700; color:#6d28d9;
      min-height:42px;
    }
    .hc-numero-display .pi { color:#7c3aed; }

    /* Edad display */
    .edad-display {
      background:#f0fdf4; border:1.5px solid #86efac;
      border-radius:10px; padding:.6rem 1rem;
      font-size:.95rem; font-weight:700; color:#15803d;
      min-height:42px; display:flex; align-items:center;
    }

    /* FPP display */
    .fpp-display {
      background:#eff6ff; border:1.5px solid #bfdbfe;
      border-radius:10px; padding:.6rem 1rem;
      font-size:.85rem; font-weight:600; color:#2563eb;
      min-height:42px; display:flex; align-items:center;
    }

    /* Fórmula obstétrica */
    .formula-obstetrica {
      background:white; border:1px solid #e2e8f0;
      border-radius:10px; padding:1rem; margin-bottom:.5rem;
    }
    .fo-titulo {
      display:flex; align-items:center; gap:6px;
      font-size:.78rem; font-weight:700; color:#475569;
      text-transform:uppercase; margin-bottom:.75rem;
    }
    .fo-grid {
      display:grid; grid-template-columns:repeat(5,1fr); gap:.75rem;
    }
    .fo-item { display:flex; flex-direction:column; gap:4px; }
    .fo-item label {
      font-size:.72rem; font-weight:700; color:#64748b;
      text-align:center; text-transform:uppercase;
    }
    :deep(.fo-item .p-inputnumber input) { text-align:center; font-size:1.1rem; font-weight:700; }

    /* Alergia */
    .alergia-bloque { transition:background .2s; }
    .alergia-bloque.tiene-alergia { background:#fef2f2; border-color:#fca5a5; }
    .alergia-input { border-color:#f87171 !important; }

    :deep(.btn-primary) {
      background:linear-gradient(135deg,#e91e8c,#c2185b) !important;
      border-color:#c2185b !important;
    }

    :deep(textarea.p-inputtextarea) { border-radius:10px !important; resize:vertical; }
    :deep(.p-inputnumber) { width:100%; }

    .form-actions {
      display:flex; justify-content:flex-end; gap:1rem;
      padding:1rem 2rem; border-top:1px solid #f1f5f9;
    }
  `]
})
export class PacienteFormComponent implements OnInit {

  private fb              = inject(FormBuilder);
  private route           = inject(ActivatedRoute);
  readonly router         = inject(Router);
  private pacienteService = inject(PacienteService);
  private toast           = inject(MessageService);

  esEdicion  = signal(false);
  guardando  = signal(false);
  pacienteId = signal<number | null>(null);
  hoy        = new Date();

  edadCalculada  = signal<number | null>(null);
  tipoDocumentoActual = signal<string>('CEDULA');

  // ── Opciones ──────────────────────────────────────────────────────────────
  opTipoDocumento = [
    { label: 'Cédula de Ciudadanía',          value: 'CEDULA'        },
    { label: 'Pasaporte',                      value: 'PASAPORTE'     },
    { label: 'Identificación del Extranjero',  value: 'ID_EXTRANJERO' },
  ];

  opEstadoCivil = [
    { label: 'Soltera',     value: 'SOLTERO'    },
    { label: 'Casada',      value: 'CASADO'     },
    { label: 'Divorciada',  value: 'DIVORCIADO' },
    { label: 'Viuda',       value: 'VIUDO'      },
    { label: 'Unión Libre', value: 'UNION_LIBRE'},
  ];

  opGrupoSanguineo = [
    { label: 'A Positivo (A+)',   value: 'A_POSITIVO'  },
    { label: 'A Negativo (A−)',   value: 'A_NEGATIVO'  },
    { label: 'B Positivo (B+)',   value: 'B_POSITIVO'  },
    { label: 'B Negativo (B−)',   value: 'B_NEGATIVO'  },
    { label: 'AB Positivo (AB+)', value: 'AB_POSITIVO' },
    { label: 'AB Negativo (AB−)', value: 'AB_NEGATIVO' },
    { label: 'O Positivo (O+)',   value: 'O_POSITIVO'  },
    { label: 'O Negativo (O−)',   value: 'O_NEGATIVO'  },
  ];

  opInstruccion = [
    { label: 'Ninguna',    value: 'Ninguna'    },
    { label: 'Primaria',   value: 'Primaria'   },
    { label: 'Secundaria', value: 'Secundaria' },
    { label: 'Superior',   value: 'Superior'   },
    { label: 'Posgrado',   value: 'Posgrado'   },
  ];

  opAlergia = [
    { label: 'NO TIENE — Sin alergias conocidas',   value: false },
    { label: 'SÍ TIENE — Especificar abajo',         value: true  },
  ];

  opVacunaHpv = [
    { label: 'No Vacunada',                                value: 'NO_VACUNADA'        },
    { label: 'Esquema Incompleto',                         value: 'INCOMPLETO'         },
    { label: 'Sí Está Vacunada — Esquema completo 2 dosis',value: 'COMPLETO_2_DOSIS'   },
    { label: 'Sí Está Vacunada — Esquema completo 3 dosis',value: 'COMPLETO_3_DOSIS'   },
    { label: 'Desconoce',                                  value: 'DESCONOCE'          },
  ];

  opPlanificacion = [
    { label: 'Ninguno',                           value: 'NINGUNO'       },
    { label: 'Preservativo',                      value: 'PRESERVATIVO'  },
    { label: 'Píldora Anticonceptiva',            value: 'PILDORA'       },
    { label: 'DIU de Cobre',                      value: 'DIU_COBRE'     },
    { label: 'DIU de Levonorgestrel (Mirena)',    value: 'DIU_MIRENA'    },
    { label: 'Implante Subdérmico',               value: 'IMPLANTE'      },
    { label: 'Inyectable Mensual',                value: 'INYECTABLE_M'  },
    { label: 'Inyectable Trimestral',             value: 'INYECTABLE_T'  },
    { label: 'Ligadura de Trompas',               value: 'LIGADURA'      },
    { label: 'Otro',                              value: 'OTRO'          },
  ];

  // ── Formulario ────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    // Documento e identificación
    tipoDocumento:   ['CEDULA', Validators.required],
    cedula:          ['', [Validators.required, validarCedulaEcuatoriana]],
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
    correo:          ['', [Validators.required, Validators.email]],
    celular:         [''],
    telefono:        [''],
    direccion:       [''],
    ciudad:          [''],
    provincia:       [null],
    contactoEmergenciaNombre:      [''],
    contactoEmergenciaParentesco:  [''],
    contactoEmergenciaTelefono:    [''],
    // Antecedentes
    antecedentesPersonales:   [''],
    antecedentesQuirurgicos:  [''],
    antecedentesFamiliares:   [''],
    tieneAlergia:             [false],
    alergias:                 [''],
    estadoVacunaHpv:          [null],
    medicacionActual:         [''],
    observacionesGenerales:   [''],
    // Gineco-obstétricos
    menarquia:              [''],
    ciclosMenstruales:      [''],
    inicioVidaSexual:       [''],
    ets:                    [''],
    planificacionFamiliar:  [null],
    gestas:                 [null],
    partos:                 [null],
    cesareas:               [null],
    abortos:                [null],
    nacidosVivos:           [null],
    ultimoPapanicolau:      [''],
    tamizajeMamario:        [''],
    menopausia:             [''],
    fechaUltimaMenustracion:[null],
  });

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Número de historia en formato HC-{id} */
  numeroHistoria(): string | null {
    const id = this.pacienteId();
    return id ? `HC-${id}` : null;
  }

  /** FPP = FUM + 280 días (Regla de Naegele) */
  fppCalculada(): string {
    const fum = this.form.get('fechaUltimaMenustracion')?.value;
    if (!fum) return '—';
    const fpp = new Date(fum);
    fpp.setDate(fpp.getDate() + 280);
    return fpp.toLocaleDateString('es-EC', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  tieneAlergia(): boolean {
    return !!this.form.get('tieneAlergia')?.value;
  }

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

    // Calcular FPP reactivamente cuando cambia la FUM
    this.form.get('fechaUltimaMenustracion')?.valueChanges.subscribe(() => {
      // fppCalculada() es computed, se actualiza solo
    });
  }

  // ── Eventos ──────────────────────────────────────────────────────────────
  calcularEdad(): void {
    const fn = this.form.get('fechaNacimiento')?.value;
    if (!fn) { this.edadCalculada.set(null); return; }
    const hoy = new Date();
    const nac = new Date(fn);
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) edad--;
    this.edadCalculada.set(edad);
  }

  onAlergiaChange(): void {
    if (!this.tieneAlergia()) {
      this.form.get('alergias')?.setValue('');
    }
  }

  onTipoDocumentoCambio(): void {
    const tipo = this.form.get('tipoDocumento')?.value ?? 'CEDULA';
    this.tipoDocumentoActual.set(tipo);
    const ctrl = this.form.get('cedula')!;
    ctrl.setValue('');
    ctrl.setValidators(tipo === 'CEDULA'
      ? [Validators.required, validarCedulaEcuatoriana]
      : [Validators.required]);
    ctrl.updateValueAndValidity();
  }

  // ── Helpers documentos ────────────────────────────────────────────────────
  labelDocumento(): string {
    return ({ CEDULA:'Número de Cédula', PASAPORTE:'Número de Pasaporte',
      ID_EXTRANJERO:'Número de Identificación' }
      [this.tipoDocumentoActual()] ?? 'Número de Documento');
  }

  placeholderDocumento(): string {
    return ({ CEDULA:'10 dígitos numéricos', PASAPORTE:'Ej: A1234567',
      ID_EXTRANJERO:'Número de identificación' }
      [this.tipoDocumentoActual()] ?? '');
  }

  iconoDocumento(): string {
    return ({ CEDULA:'pi-id-card', PASAPORTE:'pi-book',
      ID_EXTRANJERO:'pi-globe' }
      [this.tipoDocumentoActual()] ?? 'pi-id-card');
  }

  // ── Carga en edición ──────────────────────────────────────────────────────
  cargarPaciente(id: number): void {
    this.pacienteService.obtener(id).subscribe({
      next: res => {
        if (!res.data) return;
        const p = res.data;
        this.tipoDocumentoActual.set(p.tipoDocumento ?? 'CEDULA');
        this.form.patchValue({
          ...p,
          tipoDocumento:   p.tipoDocumento ?? 'CEDULA',
          fechaNacimiento: p.fechaNacimiento ? new Date(p.fechaNacimiento) : null,
          fechaUltimaMenustracion: p.fechaUltimaMenustracion
            ? new Date(p.fechaUltimaMenustracion + 'T00:00:00') : null,
          tieneAlergia: !!(p.alergias?.trim()),
        });
        this.calcularEdad();
      },
      error: () => {
        this.toast.add({ severity:'error', summary:'Error',
          detail:'No se pudo cargar el paciente' });
        this.router.navigate(['/pacientes']);
      }
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);

    const raw = this.form.getRawValue();
    const toISO = (d: any) => d instanceof Date ? d.toISOString().split('T')[0] : d;
    const payload = {
      ...raw,
      fechaNacimiento:        toISO(raw.fechaNacimiento),
      fechaUltimaMenustracion:toISO(raw.fechaUltimaMenustracion),
    };

    if (this.esEdicion()) {
      const { cedula, tipoDocumento, ...upd } = payload;
      this.pacienteService.actualizar(this.pacienteId()!, upd).subscribe({
        next: () => {
          this.toast.add({ severity:'success', summary:'Guardado',
            detail:'Paciente actualizado exitosamente' });
          setTimeout(() => this.router.navigate(['/pacientes']), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error',
            detail: err.error?.mensaje ?? 'No se pudo actualizar' });
          this.guardando.set(false);
        }
      });
    } else {
      this.pacienteService.crear(payload).subscribe({
        next: () => {
          this.toast.add({ severity:'success', summary:'Registrado',
            detail:'Paciente registrado exitosamente' });
          setTimeout(() => this.router.navigate(['/pacientes']), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error',
            detail: err.error?.mensaje ?? 'No se pudo registrar el paciente' });
          this.guardando.set(false);
        }
      });
    }
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c?.touched);
  }

  getError(f: string): string {
    const c = this.form.get(f);
    if (c?.hasError('required'))      return 'Obligatorio';
    if (c?.hasError('email'))         return 'Correo inválido';
    if (c?.hasError('cedulaInvalida'))return 'Cédula ecuatoriana no válida';
    return '';
  }
}
