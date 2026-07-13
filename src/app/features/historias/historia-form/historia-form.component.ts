import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputTextModule }    from 'primeng/inputtext';
import { TextareaModule }     from 'primeng/textarea';
import { InputNumberModule }  from 'primeng/inputnumber';
import { CalendarModule }     from 'primeng/calendar';
import { ButtonModule }       from 'primeng/button';
import { TabViewModule }      from 'primeng/tabview';
import { FileUploadModule }   from 'primeng/fileupload';
import { DropdownModule }     from 'primeng/dropdown';
import { ToastModule }        from 'primeng/toast';
import { DividerModule }      from 'primeng/divider';
import { DialogModule }       from 'primeng/dialog';
import { TooltipModule }      from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService }     from 'primeng/api';
import { HistoriaClinicaService }      from '../../../core/services/historia-clinica.service';
import { DocumentoService }            from '../../../core/services/documento.service';
import { DialogoLaboratorioComponent } from '../dialogo-laboratorio/dialogo-laboratorio.component';
import { MedicamentoCatalogoService, MedicamentoSugerencia } from '../../../core/services/medicamento-catalogo.service';
import { Cie10Service, Cie10Sugerencia } from '../../../core/services/cie10.service';

interface Medicamento {
  nombreGenerico:  string;  // Ej: "Ibuprofeno 400 mg"
  nombreComercial: string;  // Ej: "BUPREX FLASH"
  presentacion:    string;  // Ej: "Tabletas #10 (diez)"
  indicaciones:    string;  // Ej: "1 tab cada 8h por 3 días"
}

@Component({
  selector: 'app-historia-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    InputTextModule, TextareaModule, InputNumberModule,
    CalendarModule, ButtonModule, TabViewModule,
    FileUploadModule, DropdownModule, ToastModule,
    DividerModule, DialogModule, TooltipModule,
    DialogoLaboratorioComponent, AutoCompleteModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- ── Header ── -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon">
          <i [class]="'pi ' + (esEdicion() ? 'pi-pencil' : 'pi-plus')"></i>
        </div>
        <div>
          <h2>{{ esEdicion() ? 'Editar Consulta' : 'Nueva Consulta' }}</h2>
          <p>{{ esEdicion() ? 'Actualiza los datos de la consulta'
                            : 'Registra una nueva consulta médica' }}</p>
          @if (edadPaciente() !== null || numeroHistoria()) {
            <div class="paciente-meta">
              @if (edadPaciente() !== null) {
                <span class="meta-chip"><i class="pi pi-user"></i>{{ edadPaciente() }} años</span>
              }
              @if (numeroHistoria()) {
                <span class="meta-chip meta-hc"><i class="pi pi-file"></i>{{ numeroHistoria() }}</span>
              }
            </div>
          }
        </div>
      </div>
      <div class="header-actions">
        @if (esEdicion()) {
          <p-button label="Generar Receta" icon="pi pi-file-edit"
                    styleClass="btn-receta"
                    (onClick)="abrirReceta()" />
          <app-dialogo-laboratorio [consultaId]="consultaId()!" />
        }
        <p-button label="Cancelar" icon="pi pi-times"
                  [text]="true" severity="secondary" (onClick)="volver()" />
      </div>
    </div>

    <!-- ── Formulario ── -->
    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <p-tabView styleClass="form-tabs">

          <!-- ══════════════════════════════════════════════════════════════
               TAB 1 — CONSULTA Y HALLAZGOS
               ══════════════════════════════════════════════════════════════ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-calendar tab-i"></i>① Consulta</span>
            </ng-template>

            <!-- Parámetros de la visita -->
            <div class="seccion-bloque">
              <div class="seccion-titulo"><i class="pi pi-calendar-clock"></i>Parámetros de la Visita Actual</div>
              <div class="form-grid-3">
                <div class="field req-field">
                  <label class="label-upper">Fecha y Hora de Consulta <span class="req">*</span></label>
                  <p-calendar formControlName="fechaConsulta"
                              [maxDate]="hoy" [showIcon]="true"
                              [showTime]="true" dateFormat="dd/mm/yy"
                              appendTo="body"
                              styleClass="w-full" inputStyleClass="w-full" />
                  @if (isInvalid('fechaConsulta')) {
                    <small class="err">Obligatorio</small>
                  }
                </div>
                <div class="field">
                  <label class="label-upper">Tipo de Consulta</label>
                  <p-dropdown formControlName="tipoConsulta"
                              [options]="opTipoConsulta"
                              placeholder="Seleccionar"
                              appendTo="body"
                              styleClass="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">¿La Paciente Está Embarazada?</label>
                  <p-dropdown formControlName="estaEmbarazada"
                              [options]="opEmbarazo"
                              appendTo="body"
                              styleClass="w-full"
                              (onChange)="onEmbarazoChange()" />
                </div>
              </div>
            </div>

            <!-- Anamnesis y Evolución -->
            <div class="seccion-bloque">
              <div class="seccion-titulo"><i class="pi pi-comment"></i>Anamnesis y Evolución</div>
              <div class="form-grid-2">
                <div class="field req-field">
                  <label class="label-upper">Motivo de Consulta <span class="req">*</span></label>
                  <textarea pInputTextarea formControlName="motivoConsulta"
                            rows="4" class="w-full"
                            placeholder="Motivo principal por el que consulta la paciente...">
                  </textarea>
                  @if (isInvalid('motivoConsulta')) {
                    <small class="err">Obligatorio</small>
                  }
                </div>
                <div class="field">
                  <label class="label-upper">Nota de Evolución / Enfermedad Actual</label>
                  <textarea pInputTextarea formControlName="enfermedadActual"
                            rows="4" class="w-full"
                            placeholder="Descripción detallada: tiempo de evolución, características, síntomas acompañantes...">
                  </textarea>
                </div>
              </div>
            </div>

            <!-- Reporte / Hallazgos de exámenes traídos -->
            <div class="seccion-bloque">
              <div class="seccion-titulo resultado-titulo">
                <i class="pi pi-clipboard"></i>
                Reporte / Hallazgos de Resultados de Exámenes Traídos por la Paciente
              </div>
              <div class="field">
                <label class="label-upper">Interpretación Clínica de Exámenes de Laboratorio, Imagenología o Papanicolaou Previos:</label>
                <textarea pInputTextarea formControlName="reporteExamenesPrevios"
                          rows="4" class="w-full"
                          placeholder="Descripción e interpretación de los resultados que trae la paciente en esta visita...">
                </textarea>
              </div>
            </div>

          </p-tabPanel>

          <!-- ══════════════════════════════════════════════════════════════
               TAB 2 — EXAMEN FÍSICO
               ══════════════════════════════════════════════════════════════ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-heart tab-i"></i>② Examen Físico</span>
            </ng-template>

            <!-- Antropometría y Signos Vitales -->
            <div class="seccion-bloque">
              <div class="seccion-titulo"><i class="pi pi-chart-bar"></i>Antropometría y Signos Vitales (Rutina en cada visita)</div>
              <div class="form-grid-5">
                <div class="field">
                  <label class="label-upper">Peso Actual (kg):</label>
                  <p-inputNumber formControlName="peso" [minFractionDigits]="1"
                                 [maxFractionDigits]="1" placeholder="68.5"
                                 styleClass="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Talla Basal (cm):</label>
                  <p-inputNumber formControlName="talla" [minFractionDigits]="1"
                                 [maxFractionDigits]="1" placeholder="162"
                                 styleClass="w-full" />
                </div>
                <div class="field field-full-imc">
                  <label class="label-upper">IMC Calculado (Auto) — Clasificación OMS</label>
                  @if (imc()) {
                    <div class="imc-semaforo-wrap">
                      <div class="imc-top-row">
                        <div class="imc-valor-box" [class]="imcClase()">
                          <span class="imc-numero">{{ imc() }}</span>
                          <span class="imc-unidad">kg/m²</span>
                        </div>
                        <div class="imc-clasificacion" [class]="imcClase()">
                          <i [class]="'pi ' + imcIcono()"></i>
                          <span>{{ imcLabel() }}</span>
                        </div>
                      </div>
                      <div class="imc-barra-track">
                        <div class="imc-seg seg-dsevera"   title="Delgadez severa (< 16)"><span class="seg-lbl">Del.<br>Sev.</span></div>
                        <div class="imc-seg seg-dmoderada" title="Delgadez moderada (16-16.9)"><span class="seg-lbl">Del.<br>Mod.</span></div>
                        <div class="imc-seg seg-dleve"     title="Delgadez leve (17-18.4)"><span class="seg-lbl">Del.<br>Leve</span></div>
                        <div class="imc-seg seg-normal"    title="Normal (18.5-24.9)"><span class="seg-lbl">Normal</span></div>
                        <div class="imc-seg seg-sobrepeso" title="Sobrepeso (25-29.9)"><span class="seg-lbl">Sobre<br>peso</span></div>
                        <div class="imc-seg seg-ob1"       title="Obesidad I (30-34.9)"><span class="seg-lbl">Ob. I</span></div>
                        <div class="imc-seg seg-ob2"       title="Obesidad II (35-39.9)"><span class="seg-lbl">Ob. II</span></div>
                        <div class="imc-seg seg-ob3"       title="Obesidad III (≥ 40)"><span class="seg-lbl">Ob. III</span></div>
                        <div class="imc-marker" [style.left.%]="imcPosicion()">
                          <div class="imc-marker-pin"></div>
                        </div>
                      </div>
                      <div class="imc-rangos">
                        <span>&lt;16</span><span>16</span><span>17</span>
                        <span>18.5</span><span>25</span><span>30</span>
                        <span>35</span><span>40+</span>
                      </div>
                      <div class="imc-oms-nota">
                        <i class="pi pi-info-circle"></i>
                        Clasificación según OMS — Organización Mundial de la Salud
                      </div>
                    </div>
                  } @else {
                    <div class="imc-vacio">
                      <i class="pi pi-calculator"></i>
                      Ingresa peso y talla para calcular
                    </div>
                  }
                </div>
                <div class="field">
                  <label class="label-upper">Tensión Arterial:</label>
                  <input pInputText formControlName="presionArterial"
                         placeholder="110/70 mmHg" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Frecuencia Cardíaca:</label>
                  <input pInputText formControlName="frecuenciaCardiacaTexto"
                         placeholder="78 lpm" class="w-full" />
                </div>
              </div>
              <div class="form-grid-3 mt-8">
                <div class="field">
                  <label class="label-upper">Frecuencia Respiratoria:</label>
                  <input pInputText formControlName="frecuenciaRespiratoriaTexto"
                         placeholder="18 rpm" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Temperatura (°C):</label>
                  <input pInputText formControlName="temperaturaTexto"
                         placeholder="36.6 °C" class="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Saturación O₂ (%):</label>
                  <input pInputText formControlName="saturacionTexto"
                         placeholder="97%" class="w-full" />
                </div>
              </div>
            </div>

            <!-- ══ MÓDULO EMBARAZADA ══════════════════════════════════════ -->
            @if (estaEmbarazada()) {
              <div class="seccion-bloque modulo-embarazo">
                <div class="seccion-titulo titulo-embarazo">
                  <i class="pi pi-heart-fill"></i>
                  Módulo Especializado: Medicina Materno-Fetal (Activo por Embarazo)
                </div>
                <div class="form-grid-6">
                  <div class="field">
                    <label class="label-upper">FUM (Última Menstruación):</label>
                    <p-calendar [(ngModel)]="fumConsulta"
                                [ngModelOptions]="{standalone:true}"
                                [showIcon]="true" dateFormat="dd/mm/yy"
                                [maxDate]="hoy" appendTo="body"
                                placeholder="dd/mm/aaaa"
                                styleClass="w-full" inputStyleClass="w-full"
                                (onSelect)="onFumChange()" />
                  </div>
                  <div class="field">
                    <label class="label-upper">Semanas por FUM (Auto):</label>
                    <div class="semanas-display">{{ semanasGestacionAuto() }}</div>
                  </div>
                  <div class="field">
                    <label class="label-upper">Altura Uterina (cm):</label>
                    <input pInputText formControlName="alturaUterina"
                           placeholder="Ej: 24 cm" class="w-full" />
                  </div>
                  <div class="field">
                    <label class="label-upper">FC Fetal (FCF - LPM):</label>
                    <input pInputText formControlName="fcFetal"
                           placeholder="Ej: 148 lpm (Rítmicas)" class="w-full" />
                  </div>
                  <div class="field">
                    <label class="label-upper">Presentación / Posición:</label>
                    <input pInputText formControlName="presentacionFetal"
                           placeholder="Ej: Cefálica | Dorso derecho" class="w-full" />
                  </div>
                  <div class="field">
                    <label class="label-upper">Tono y Actividad Uterina:</label>
                    <input pInputText formControlName="tonoUterino"
                           placeholder="Ej: Normotónico, sin contracciones" class="w-full" />
                  </div>
                </div>
                <div class="form-grid-2 mt-8">
                  <div class="field">
                    <label class="label-upper">Movimientos Fetales:</label>
                    <input pInputText formControlName="movimientosFetales"
                           placeholder="Ej: Presentes, activos y reactivos" class="w-full" />
                  </div>
                  <div class="field">
                    <label class="label-upper">Peso Fetal Estimado (EPF):</label>
                    <input pInputText formControlName="pesoFetalEstimado"
                           placeholder="Ej: 820 gramos" class="w-full" />
                  </div>
                </div>
                <div class="field-full mt-8">
                  <label class="label-upper score-label">
                    ⚠ Score Mamá (Valoración de Riesgo Obstétrico Nacional - Llenado por la Doctora):
                  </label>
                  <p-dropdown formControlName="scoreMama"
                              [options]="opScoreMama"
                              appendTo="body"
                              styleClass="w-full" />
                </div>
              </div>
            }

            <!-- ══ EXAMEN FÍSICO POR SISTEMAS ══════════════════════════ -->
            <div class="seccion-bloque">
              <div class="seccion-titulo">
                <i class="pi pi-search"></i>Examen Físico por Sistemas (Cabeza a Extremidades)
                <p-button label="★ Marcar Todo Normal" icon="pi pi-check"
                          [text]="true" severity="secondary" [style]="{fontSize:'.78rem'}"
                          (onClick)="marcarTodoNormal()" />
              </div>
              <div class="form-grid-2">
                <div class="field">
                  <label class="label-upper">1. Examen Físico General:</label>
                  <textarea pInputTextarea formControlName="examenFisico"
                            rows="3" class="w-full"
                            placeholder="Paciente orientada en tiempo, espacio y persona...">
                  </textarea>
                </div>
                <div class="field">
                  <label class="label-upper">2. Cabeza y Cuello:</label>
                  <textarea pInputTextarea formControlName="examenCabeza"
                            rows="3" class="w-full"
                            placeholder="Normocefálica. Escleras anictéricas...">
                  </textarea>
                </div>
                <div class="field">
                  <label class="label-upper">3. Tórax / Cardio Pulmonar:</label>
                  <textarea pInputTextarea formControlName="examenTorax"
                            rows="3" class="w-full"
                            placeholder="Auscultación cardiopulmonar normal...">
                  </textarea>
                </div>
                <div class="field">
                  <label class="label-upper">4. Abdomen (No Obstétrico):</label>
                  <textarea pInputTextarea formControlName="examenAbdomen"
                            rows="3" class="w-full"
                            placeholder="Blando, depresible, no doloroso...">
                  </textarea>
                </div>
                <div class="field">
                  <label class="label-upper">5. Región Genital:</label>
                  <textarea pInputTextarea formControlName="examenGenital"
                            rows="3" class="w-full"
                            placeholder="Genitales externos de aspecto normal...">
                  </textarea>
                </div>
                <div class="field">
                  <label class="label-upper">6. Extremidades (Edema / Várices):</label>
                  <textarea pInputTextarea formControlName="examenExtremidades"
                            rows="3" class="w-full"
                            placeholder="Simétricas, tono y trofismo conservados...">
                  </textarea>
                </div>
              </div>
            </div>

            <!-- ══ MÓDULO GINECOLÓGICO (solo si NO embarazada) ══════════ -->
            @if (!estaEmbarazada()) {
              <div class="seccion-bloque modulo-gineco">
                <div class="seccion-titulo titulo-gineco">
                  <i class="pi pi-eye"></i>
                  Módulo Especializado: Exploración Ginecológica General (Activo por No Embarazo)
                </div>
                <div class="form-grid-2">
                  <div class="field">
                    <label class="label-upper">Inspección Externa / Vulva:</label>
                    <textarea pInputTextarea formControlName="inspeccionVulva"
                              rows="3" class="w-full"
                              placeholder="Ej: Genitales externos normoconfigurados, sin eritema ni lesiones dérmicas...">
                    </textarea>
                  </div>
                  <div class="field">
                    <label class="label-upper">Especuloscopia (Cérvix / Vagina / DIU):</label>
                    <textarea pInputTextarea formControlName="especuloscopia"
                              rows="3" class="w-full"
                              placeholder="Ej: Cérvix sano, sin leucorrea patológica...">
                    </textarea>
                  </div>
                  <div class="field">
                    <label class="label-upper">Tacto Bimanual (Útero y Anexos):</label>
                    <textarea pInputTextarea formControlName="tactoVaginal"
                              rows="3" class="w-full"
                              placeholder="Ej: Útero en anteversoflexión de tamaño normal, no doloroso...">
                    </textarea>
                  </div>
                  <div class="field">
                    <label class="label-upper">Examen de Mamas Bilateral:</label>
                    <textarea pInputTextarea formControlName="examenMamas"
                              rows="3" class="w-full"
                              placeholder="Ej: Simétricas, sin nódulos palpables ni retracciones...">
                    </textarea>
                  </div>
                </div>
              </div>
            }

          </p-tabPanel>

          <!-- ══════════════════════════════════════════════════════════════
               TAB 3 — DIAGNÓSTICO Y TRATAMIENTO
               ══════════════════════════════════════════════════════════════ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-check-circle tab-i"></i>③ Diagnóstico</span>
            </ng-template>

            <div class="seccion-bloque">
              <div class="seccion-titulo"><i class="pi pi-check-circle"></i>Diagnóstico (CIE-10)</div>
              <div class="form-grid-col">
                <!-- CIE-10 Principal — VA PRIMERO -->
                <div class="field">
                  <label class="label-upper">CIE-10 Principal
                    <span class="lbl-hint">Selecciona uno</span>
                  </label>
                  <div class="cie-wrap">
                    <p-autoComplete [(ngModel)]="cie10Input"
                                    [ngModelOptions]="{standalone:true}"
                                    [suggestions]="sugerenciasCie10()"
                                    (completeMethod)="buscarCie10($event)"
                                    (onSelect)="seleccionarCie10Principal($event)"
                                    field="label" [minLength]="2"
                                    placeholder="Código o descripción... Ej: O80 o PARTO"
                                    styleClass="w-full" inputStyleClass="w-full"
                                    [showEmptyMessage]="true"
                                    emptyMessage="Sin coincidencias">
                      <ng-template let-item pTemplate="item">
                        <div class="cie-item">
                          <span class="cie-cod">{{ item.codigo }}</span>
                          <span class="cie-desc">{{ item.descripcion }}</span>
                        </div>
                      </ng-template>
                    </p-autoComplete>
                    @if (form.get('codigoCie10')?.value) {
                      <div class="cie-badge cie-principal">
                        <i class="pi pi-star-fill"></i>
                        <strong>{{ form.get('codigoCie10')?.value }}</strong>
                        <span>{{ cie10DescSeleccionada }}</span>
                        <p-button icon="pi pi-times" [rounded]="true" [text]="true"
                                  severity="danger" [style]="{padding:'0'}"
                                  (onClick)="limpiarCie10()" />
                      </div>
                    }
                  </div>
                </div>

                <!-- CIE-10 Secundarios -->
                <div class="field">
                  <label class="label-upper">CIE-10 Secundarios
                    <span class="lbl-hint">Opcional — puedes agregar varios</span>
                  </label>
                  <p-autoComplete [(ngModel)]="cie10SecInput"
                                  [ngModelOptions]="{standalone:true}"
                                  [suggestions]="sugerenciasCie10Sec()"
                                  (completeMethod)="buscarCie10Sec($event)"
                                  (onSelect)="agregarCie10Secundario($event)"
                                  field="label" [minLength]="2"
                                  placeholder="Busca y agrega diagnósticos secundarios..."
                                  styleClass="w-full" inputStyleClass="w-full"
                                  [showEmptyMessage]="true"
                                  emptyMessage="Sin coincidencias">
                    <ng-template let-item pTemplate="item">
                      <div class="cie-item">
                        <span class="cie-cod">{{ item.codigo }}</span>
                        <span class="cie-desc">{{ item.descripcion }}</span>
                      </div>
                    </ng-template>
                  </p-autoComplete>
                  @if (cie10Secundarios().length > 0) {
                    <div class="cie-sec-lista">
                      @for (s of cie10Secundarios(); track s.codigo; let i = $index) {
                        <div class="cie-sec-item">
                          <span class="cie-sec-num">{{ i+1 }}</span>
                          <span class="cie-cod">{{ s.codigo }}</span>
                          <span class="cie-sec-desc">{{ s.descripcion }}</span>
                          <p-button icon="pi pi-times" [rounded]="true" [text]="true"
                                    severity="danger" [style]="{padding:'0'}"
                                    (onClick)="eliminarCie10Secundario(i)" />
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Diagnóstico libre — después del CIE-10 -->
                <div class="field req-field">
                  <label class="label-upper">
                    Diagnóstico Principal (Texto Libre)
                    <span class="lbl-hint">Se precarga al seleccionar CIE-10 principal</span>
                    <span class="req">*</span>
                  </label>
                  <textarea pInputTextarea formControlName="diagnosticoPrincipal"
                            rows="2" class="w-full"
                            placeholder="Diagnóstico principal de la consulta...">
                  </textarea>
                  @if (isInvalid('diagnosticoPrincipal')) {
                    <small class="err">Obligatorio</small>
                  }
                </div>
                <div class="field">
                  <label class="label-upper">Diagnóstico Secundario (Texto Libre)</label>
                  <textarea pInputTextarea formControlName="diagnosticoSecundario"
                            rows="2" class="w-full"
                            placeholder="Diagnóstico secundario (si aplica)...">
                  </textarea>
                </div>
              </div>
            </div>

            <div class="seccion-bloque">
              <div class="seccion-titulo"><i class="pi pi-heart"></i>Tratamiento y Plan</div>
              <div class="form-grid-col">
                <div class="field">
                  <label class="label-upper">Tratamiento Indicado</label>
                  <textarea pInputTextarea formControlName="tratamiento"
                            rows="3" class="w-full" placeholder="Tratamiento indicado..."></textarea>
                </div>
                <div class="field">
                  <label class="label-upper">Medicación</label>
                  <textarea pInputTextarea formControlName="medicacion"
                            rows="3" class="w-full"
                            placeholder="Medicamentos, dosis y frecuencia..."></textarea>
                </div>
                <div class="field">
                  <label class="label-upper">Indicaciones para la Paciente</label>
                  <textarea pInputTextarea formControlName="indicaciones"
                            rows="2" class="w-full"
                            placeholder="Indicaciones de cuidado..."></textarea>
                </div>
                <div class="field" style="max-width:280px">
                  <label class="label-upper">Próxima Cita</label>
                  <p-calendar formControlName="proximaCita" [minDate]="hoy"
                              [showIcon]="true" dateFormat="dd/mm/yy"
                              appendTo="body"
                              styleClass="w-full" inputStyleClass="w-full" />
                </div>
                <div class="field">
                  <label class="label-upper">Observaciones Adicionales</label>
                  <textarea pInputTextarea formControlName="observaciones"
                            rows="2" class="w-full"
                            placeholder="Observaciones adicionales..."></textarea>
                </div>
              </div>
            </div>

          </p-tabPanel>

          <!-- ══════════════════════════════════════════════════════════════
               TAB 4 — ARCHIVOS ADJUNTOS
               ══════════════════════════════════════════════════════════════ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span>
                <i class="pi pi-paperclip tab-i"></i>Archivos
                @if (archivosSubidos() > 0) {
                  <span class="tab-bdg">{{ archivosSubidos() }}</span>
                }
              </span>
            </ng-template>

            @if (!esEdicion()) {
              <div class="aviso-archivos">
                <i class="pi pi-info-circle"></i>
                <span>Guarda primero la consulta para poder adjuntar archivos.</span>
              </div>
            } @else {
              <p-fileUpload mode="advanced" [multiple]="true"
                            accept=".jpg,.jpeg,.png,.pdf,.docx,.doc,.xlsx"
                            [maxFileSize]="10485760"
                            chooseLabel="Seleccionar Archivos"
                            uploadLabel="Subir" cancelLabel="Limpiar"
                            (onSelect)="onFileSelect($event)"
                            (onClear)="archivosSeleccionados.set([])"
                            styleClass="upload-cust">
                <ng-template pTemplate="empty">
                  <div class="upload-ph">
                    <i class="pi pi-cloud-upload"></i>
                    <p>Arrastra los archivos aquí o haz clic en <strong>Seleccionar Archivos</strong></p>
                    <small>JPG, PNG, PDF, DOCX, XLSX · Máximo 10 MB</small>
                  </div>
                </ng-template>
              </p-fileUpload>
              @if (archivosSeleccionados().length > 0) {
                <div class="upload-actions">
                  <div class="field" style="min-width:220px">
                    <label>Categoría</label>
                    <p-dropdown [(ngModel)]="tipoArchivo"
                                [ngModelOptions]="{standalone:true}"
                                [options]="opTipos"
                                optionLabel="label" optionValue="value"
                                appendTo="body"
                                placeholder="Selecciona" styleClass="w-full" />
                  </div>
                  <p-button [label]="'Subir ' + archivosSeleccionados().length + ' archivo(s)'"
                            icon="pi pi-upload" styleClass="btn-pink"
                            [loading]="subiendo()" (onClick)="subirArchivos()" />
                </div>
              }
              @if (archivosSubidos() > 0) {
                <div class="archivos-ok">
                  <i class="pi pi-check-circle"></i>
                  {{ archivosSubidos() }} archivo(s) adjunto(s)
                </div>
              }
            }
          </p-tabPanel>

        </p-tabView>

        <!-- Botones -->
        <div class="form-actions">
          <p-button label="Cancelar" icon="pi pi-times"
                    severity="secondary" [outlined]="true" (onClick)="volver()" />
          <p-button type="submit"
                    [label]="esEdicion() ? 'Guardar Cambios' : 'Registrar Consulta'"
                    [icon]="esEdicion() ? 'pi pi-save' : 'pi pi-check'"
                    [loading]="guardando()"
                    [disabled]="form.invalid || guardando()"
                    styleClass="btn-pink" />
        </div>
      </form>
    </div>

    <!-- ══ DIÁLOGO RECETA ═══════════════════════════════════════════════════ -->
    <p-dialog [(visible)]="dialogReceta" header="Receta Médica"
              [modal]="true" [style]="{width:'780px', maxWidth:'96vw'}"
              [draggable]="false" [resizable]="false" styleClass="dialog-receta">
      <div class="receta-body">
        <!-- Diagnóstico precargado del formulario -->
        @if (recetaDiagnostico) {
          <div class="receta-diag-banner">
            <i class="pi pi-check-circle"></i>
            <span class="receta-diag-lbl">Diagnóstico:</span>
            <span>{{ recetaDiagnostico }}</span>
          </div>
        }
        <div class="receta-seccion">
          <div class="receta-sec-titulo"><i class="pi pi-plus-circle"></i> Rx — Medicamentos</div>
          @if (medicamentos().length > 0) {
            <div class="med-lista">
              @for (med of medicamentos(); track $index; let i = $index) {
                <div class="med-item">
                  <div class="med-item-info">
                    <span class="med-nombre">{{ med.nombreGenerico }}</span>
                    @if (med.nombreComercial) {
                      <span class="med-comercial">{{ med.nombreComercial }}</span>
                    }
                    @if (med.presentacion) {
                      <span class="med-detalle">{{ med.presentacion }}</span>
                    }
                    @if (med.indicaciones) {
                      <span class="med-ind">{{ med.indicaciones }}</span>
                    }
                  </div>
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true"
                            severity="danger" (onClick)="eliminarMedicamento(i)" />
                </div>
              }
            </div>
          }
          <div class="med-form">
            <div class="med-form-grid-new">
              <!-- Fila 1: Nombre genérico (autocompletado) + Nombre comercial -->
              <div class="field">
                <label>Nombre Genérico (con dosis) <span class="req">*</span></label>
                <p-autoComplete [(ngModel)]="nuevoMed.nombreGenerico"
                                [suggestions]="sugerenciasMed()"
                                (completeMethod)="buscarSugerencias($event)"
                                (onSelect)="seleccionarSugerencia($event)"
                                field="nombreGenerico" [minLength]="2"
                                placeholder="Ej: Ibuprofeno 400 mg"
                                styleClass="w-full" inputStyleClass="w-full"
                                [showEmptyMessage]="true" emptyMessage="Se registrará como nuevo">
                  <ng-template let-m pTemplate="item">
                    <div class="sugerencia-item">
                      <div class="sug-bloque">
                        <span class="sug-nombre">{{ m.nombreGenerico }}</span>
                        @if (m.nombreComercial) {
                          <span class="sug-comercial">{{ m.nombreComercial }}</span>
                        }
                      </div>
                      <span class="sug-usos">{{ m.vecesUsado }}x</span>
                    </div>
                  </ng-template>
                </p-autoComplete>
              </div>
              <div class="field">
                <label>Nombre Comercial</label>
                <input pInputText [(ngModel)]="nuevoMed.nombreComercial"
                       placeholder="Ej: BUPREX FLASH" class="w-full"
                       style="text-transform:uppercase" />
              </div>
              <!-- Fila 2: Presentación + Indicaciones -->
              <div class="field">
                <label>Presentación y Cantidad</label>
                <input pInputText [(ngModel)]="nuevoMed.presentacion"
                       placeholder="Ej: Tabletas #10 (diez)" class="w-full" />
              </div>
              <div class="field">
                <label>Indicaciones de Administración</label>
                <input pInputText [(ngModel)]="nuevoMed.indicaciones"
                       placeholder="Ej: 1 tab cada 8 horas por 3 días" class="w-full" />
              </div>
            </div>
            <p-button label="Agregar Medicamento" icon="pi pi-plus"
                      styleClass="btn-agregar"
                      [disabled]="!nuevoMed.nombreGenerico"
                      (onClick)="agregarMedicamento()" />
          </div>
        </div>
        <div class="receta-sep"></div>
        <div class="receta-seccion">
          <div class="receta-sec-titulo"><i class="pi pi-list"></i> Indicaciones Generales</div>
          <div class="field" style="margin-bottom:.8rem">
            <label>Prescripción médica</label>
            <textarea pInputTextarea [(ngModel)]="recetaPrescripcion" rows="3" class="w-full"
                      placeholder="Indicaciones generales..."></textarea>
          </div>
          <div class="field">
            <label>Próxima cita / Control</label>
            <input pInputText [(ngModel)]="recetaProximaCita"
                   placeholder="Ej: Regresar en 15 días" class="w-full" />
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="receta-footer">
          <p-button label="Cancelar" [text]="true" severity="secondary" (onClick)="cerrarReceta()" />
          <div style="display:flex; gap:.75rem; flex-wrap:wrap">
            <p-button label="Guardar" icon="pi pi-save" severity="secondary" [outlined]="true"
                      [loading]="guardandoReceta()"
                      [disabled]="medicamentos().length === 0 && !recetaPrescripcion"
                      (onClick)="guardarReceta()" />
            <p-button label="Previsualizar PDF" icon="pi pi-eye" severity="secondary" [outlined]="true"
                      [loading]="generandoReceta()"
                      [disabled]="medicamentos().length === 0 && !recetaPrescripcion"
                      (onClick)="previsualizarReceta()" />
            <p-button label="Descargar Receta" icon="pi pi-file-pdf" styleClass="btn-pink"
                      [loading]="generandoReceta()"
                      [disabled]="medicamentos().length === 0 && !recetaPrescripcion"
                      (onClick)="descargarReceta()" />
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .page-header  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .page-title   { display:flex; align-items:center; gap:1rem; }
    .header-actions { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
    .page-icon { width:52px; height:52px; background:linear-gradient(135deg,#e91e8c,#c2185b); border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 2px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }

    .paciente-meta { display:flex; gap:6px; flex-wrap:wrap; margin-top:5px; }
    .meta-chip { display:inline-flex; align-items:center; gap:4px; background:#e0f2fe; color:#0369a1; font-size:.75rem; font-weight:600; padding:3px 10px; border-radius:20px; }
    .meta-hc   { background:#f5f3ff; color:#6d28d9; }

    :deep(.btn-receta) { background:linear-gradient(135deg,#e91e8c,#c2185b) !important; border-color:#c2185b !important; color:white !important; }
    :deep(.btn-pink)   { background:linear-gradient(135deg,#e91e8c,#c2185b) !important; border-color:#c2185b !important; color:white !important; }

    .form-card { background:white; border-radius:16px; padding:0 0 1.5rem; box-shadow:0 2px 12px rgba(0,0,0,.07); overflow:hidden; }
    :deep(.form-tabs .p-tabview-panels) { padding:1.5rem 2rem; }
    :deep(.form-tabs .p-tabview-nav)    { padding:0 1rem; background:#fdf2f8; }
    :deep(.form-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link) { color:#c2185b; border-color:#e91e8c; }
    .tab-i   { margin-right:6px; }
    .tab-bdg { background:#e91e8c; color:white; font-size:.7rem; font-weight:700; padding:1px 6px; border-radius:20px; margin-left:5px; }

    /* Secciones */
    .seccion-bloque { margin-bottom:1.25rem; padding:1.25rem; background:#fafafa; border-radius:12px; border:1px solid #f1f5f9; }
    .seccion-titulo { display:flex; align-items:center; gap:8px; font-size:.88rem; font-weight:800; color:#0a2342; margin-bottom:1rem; padding:6px 10px; background:#f1f5f9; border-radius:8px; border-left:4px solid #e91e8c; }
    .resultado-titulo { border-left-color:#7c3aed; background:#f5f3ff; color:#5b21b6; }

    /* Módulo embarazo */
    .modulo-embarazo { background:#fdf2f8; border-color:#f8bbd0; }
    .titulo-embarazo { background:#fce4ec; border-left-color:#e91e8c; color:#c2185b; }
    .semanas-display { background:#fce4ec; border:1.5px solid #f8bbd0; border-radius:10px; padding:.6rem 1rem; font-size:.95rem; font-weight:700; color:#c2185b; min-height:42px; display:flex; align-items:center; }
    .score-label { color:#d97706 !important; }

    /* Módulo ginecológico */
    .modulo-gineco { background:#fdf2f8; border-color:#f8bbd0; }
    .titulo-gineco { background:#fce4ec; border-left-color:#e91e8c; color:#c2185b; }

    /* Grids */
    .form-grid-5 { display:grid; grid-template-columns:repeat(5,1fr); gap:1rem; }
    .form-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
    .form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .form-grid-col { display:flex; flex-direction:column; gap:1rem; }
    .field-full { margin-bottom:1rem; }
    .mt-8 { margin-top:.5rem; }
    @media (max-width:900px) { .form-grid-5 { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:600px) { .form-grid-5,.form-grid-3,.form-grid-2 { grid-template-columns:1fr; } }

    .field { display:flex; flex-direction:column; gap:5px; }
    .field label,.label-upper { font-size:.78rem; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.02em; }
    .lbl-hint { font-size:.7rem; font-weight:400; color:#94a3b8; margin-left:6px; text-transform:none; }
    .req  { color:#e91e8c; }
    .err  { color:#ef4444; font-size:.75rem; }
    .req-field .label-upper { color:#c2185b; }

    /* ── IMC Semáforo OMS ────────────────────────────────────── */
    .field-full-imc { grid-column: 1 / -1; }
    .imc-semaforo-wrap { display:flex; flex-direction:column; gap:.6rem; background:#f8fafc; border-radius:14px; padding:1rem 1.25rem; border:1.5px solid #e2e8f0; }
    .imc-top-row { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
    .imc-valor-box { display:flex; align-items:baseline; gap:5px; padding:.4rem .875rem; border-radius:10px; border:2px solid #e2e8f0; }
    .imc-numero { font-size:1.6rem; font-weight:800; color:#0a2342; }
    .imc-unidad { font-size:.72rem; color:#64748b; font-weight:600; }
    .imc-clasificacion { display:flex; align-items:center; gap:6px; font-size:.88rem; font-weight:700; padding:.4rem .875rem; border-radius:8px; border:1.5px solid transparent; }
    .imc-barra-track { position:relative; display:flex; height:36px; border-radius:10px; overflow:hidden; }
    .imc-seg { display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .seg-lbl { font-size:.48rem; font-weight:700; color:white; text-align:center; line-height:1.2; padding:0 2px; text-shadow:0 1px 2px rgba(0,0,0,.3); }
    .seg-dsevera   { width:8%;  background:#1d4ed8; }
    .seg-dmoderada { width:6%;  background:#3b82f6; }
    .seg-dleve     { width:9%;  background:#60a5fa; }
    .seg-normal    { width:24%; background:#16a34a; }
    .seg-sobrepeso { width:20%; background:#d97706; }
    .seg-ob1       { width:14%; background:#ea580c; }
    .seg-ob2       { width:10%; background:#dc2626; }
    .seg-ob3       { flex:1;    background:#7f1d1d; }
    .imc-marker { position:absolute; top:0; bottom:0; transform:translateX(-50%); display:flex; align-items:center; pointer-events:none; transition:left .4s ease; }
    .imc-marker-pin { width:4px; height:100%; background:white; box-shadow:0 0 0 2px #0a2342; border-radius:2px; }
    .imc-rangos { display:flex; justify-content:space-between; font-size:.6rem; color:#94a3b8; padding:0 2px; }
    .imc-oms-nota { display:flex; align-items:center; gap:6px; font-size:.72rem; color:#94a3b8; }
    .imc-oms-nota .pi { color:#60a5fa; }
    .imc-vacio { display:flex; align-items:center; gap:8px; background:#f8fafc; border:1.5px dashed #e2e8f0; border-radius:10px; padding:.75rem 1rem; color:#94a3b8; font-size:.82rem; min-height:42px; }
    /* Colores IMC categorías */
    .imc-dsevera   { border-color:#1d4ed8 !important; background:#dbeafe; }
    .imc-dmoderada { border-color:#3b82f6 !important; background:#eff6ff; }
    .imc-dleve     { border-color:#60a5fa !important; background:#f0f9ff; }
    .imc-normal    { border-color:#16a34a !important; background:#f0fdf4; color:#15803d; }
    .imc-sobrepeso { border-color:#d97706 !important; background:#fffbeb; color:#b45309; }
    .imc-ob1       { border-color:#ea580c !important; background:#fff7ed; color:#c2410c; }
    .imc-ob2       { border-color:#dc2626 !important; background:#fef2f2; color:#b91c1c; }
    .imc-ob3       { border-color:#7f1d1d !important; background:#fef2f2; color:#7f1d1d; }
    .form-grid-6 { display:grid; grid-template-columns:repeat(6,1fr); gap:1rem; }
    @media (max-width:900px) { .form-grid-6 { grid-template-columns:repeat(3,1fr); } }
    @media (max-width:600px) { .form-grid-6 { grid-template-columns:repeat(2,1fr); } }

    /* CIE-10 */
    .cie-wrap { display:flex; flex-direction:column; gap:6px; }
    .cie-item { display:flex; align-items:center; gap:8px; }
    .cie-cod  { background:#7c3aed; color:white; font-size:.7rem; font-weight:800; padding:2px 7px; border-radius:6px; font-family:monospace; flex-shrink:0; }
    .cie-desc { font-size:.82rem; color:#334155; }
    .cie-badge { display:flex; align-items:center; gap:8px; flex-wrap:wrap; border-radius:10px; padding:.5rem .75rem; font-size:.82rem; }
    .cie-principal { background:#f5f3ff; border:1px solid #ddd6fe; }
    .cie-principal .pi { color:#7c3aed; }
    .cie-principal strong { color:#5b21b6; font-family:monospace; }
    .cie-principal span { color:#64748b; flex:1; }
    .cie-sec-lista { display:flex; flex-direction:column; gap:4px; margin-top:8px; }
    .cie-sec-item  { display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:5px 10px; }
    .cie-sec-num   { width:20px; height:20px; border-radius:50%; background:#7c3aed; color:white; font-size:.65rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .cie-sec-desc  { font-size:.8rem; color:#475569; flex:1; }

    /* Archivos */
    .aviso-archivos { display:flex; align-items:center; gap:10px; background:#fdf2f8; border:1px solid #f8bbd0; border-radius:10px; padding:1rem 1.25rem; color:#c2185b; font-size:.88rem; }
    :deep(.upload-cust) { width:100%; margin-bottom:1rem; }
    .upload-ph { display:flex; flex-direction:column; align-items:center; padding:2rem; color:#94a3b8; text-align:center; }
    .upload-ph .pi { font-size:2.5rem; margin-bottom:.5rem; color:#f8bbd0; }
    .upload-actions { display:flex; align-items:flex-end; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; }
    .archivos-ok { display:flex; align-items:center; gap:8px; background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:.75rem 1rem; color:#166534; font-size:.85rem; }

    :deep(textarea.p-inputtextarea) { border-radius:10px !important; resize:vertical; }
    :deep(.p-inputnumber) { width:100%; }
    .form-actions { display:flex; justify-content:flex-end; gap:1rem; padding:0 2rem; flex-wrap:wrap; }

    /* Receta dialog */
    :deep(.dialog-receta .p-dialog-header) { background:linear-gradient(135deg,#0a2342,#1a4a7a); color:white; border-radius:12px 12px 0 0; }
    :deep(.dialog-receta .p-dialog-header .p-dialog-title) { font-weight:700; }
    :deep(.dialog-receta .p-dialog-header-icons .p-dialog-header-close) { color:white; }
    .receta-diag-banner {
      display:flex; align-items:center; gap:8px;
      background:#f0fdf4; border:1px solid #86efac;
      border-radius:10px; padding:.6rem 1rem;
      font-size:.85rem; color:#15803d; margin-bottom:.75rem;
    }
    .receta-diag-banner .pi { color:#16a34a; flex-shrink:0; }
    .receta-diag-lbl { font-weight:700; flex-shrink:0; }
    .receta-body { display:flex; flex-direction:column; gap:0; }
    .receta-seccion { padding:1.25rem 0; }
    .receta-sec-titulo { display:flex; align-items:center; gap:8px; font-size:.95rem; font-weight:700; color:#0a2342; margin-bottom:1rem; padding-bottom:.5rem; border-bottom:2px solid #fce4ec; }
    .receta-sec-titulo .pi { color:#e91e8c; }
    .receta-sep { height:1px; background:#f1f5f9; margin:.25rem 0; }
    .med-lista { display:flex; flex-direction:column; gap:.5rem; margin-bottom:1rem; }
    .med-item  { display:flex; align-items:center; gap:1rem; background:#fdf2f8; border:1px solid #f8bbd0; border-radius:10px; padding:.7rem 1rem; }
    .med-item-info { display:flex; flex-direction:column; gap:2px; flex:1; }
    .med-nombre  { font-weight:700; color:#0a2342; font-size:.9rem; }
    .med-detalle { font-size:.78rem; color:#c2185b; font-weight:600; }
    .med-ind     { font-size:.75rem; color:#64748b; }
    .med-form { background:#f8fafc; border-radius:12px; padding:1rem; border:1px dashed #e2e8f0; }
    .med-form-grid-new { display:grid; grid-template-columns:1fr 1fr; gap:.8rem; margin-bottom:.8rem; }
    @media (max-width:600px) { .med-form-grid-new { grid-template-columns:1fr; } }
    .med-nombre   { font-weight:700; color:#0a2342; font-size:.9rem; }
    .med-comercial{ font-size:.82rem; color:#7c3aed; font-weight:700; text-decoration:underline; }
    .med-detalle  { font-size:.78rem; color:#c2185b; font-weight:600; }
    .med-ind      { font-size:.75rem; color:#64748b; }
    .sug-bloque   { display:flex; flex-direction:column; gap:1px; flex:1; }
    .sug-nombre   { font-weight:600; color:#0a2342; font-size:.85rem; }
    .sug-comercial{ font-size:.72rem; color:#7c3aed; font-weight:600; }
    .sug-usos     { background:#fce4ec; color:#c2185b; font-size:.68rem; font-weight:700; padding:1px 6px; border-radius:10px; flex-shrink:0; }
    .receta-footer { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.75rem; }
  `]
})
export class HistoriaFormComponent implements OnInit {

  private fb     = inject(FormBuilder);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private hSvc   = inject(HistoriaClinicaService);
  private docSvc = inject(DocumentoService);
  private medSvc = inject(MedicamentoCatalogoService);
  private cieSvc = inject(Cie10Service);
  private toast  = inject(MessageService);

  // ── Signals ───────────────────────────────────────────────────────────────
  esEdicion             = signal(false);
  guardando             = signal(false);
  subiendo              = signal(false);
  generandoReceta       = signal(false);
  guardandoReceta       = signal(false);
  consultaId            = signal<number | null>(null);
  historiaId            = signal<number | null>(null);
  archivosSeleccionados = signal<File[]>([]);
  archivosSubidos       = signal(0);
  imc                   = signal<number | null>(null);
  sugerenciasMed        = signal<MedicamentoSugerencia[]>([]);
  sugerenciasCie10      = signal<Cie10Sugerencia[]>([]);
  sugerenciasCie10Sec   = signal<Cie10Sugerencia[]>([]);
  edadPaciente          = signal<number | null>(null);
  numeroHistoria        = signal<string | null>(null);
  cie10Secundarios      = signal<Cie10Sugerencia[]>([]);
  fumPaciente           = signal<Date | null>(null); // FUM cargada del paciente
  fumConsulta: Date | null = null;                   // FUM ingresada en la consulta

  tipoArchivo           = 'OTRO';
  cie10Input            = '';
  cie10SecInput         = '';
  cie10DescSeleccionada = '';
  hoy                   = new Date();

  // Receta
  dialogReceta       = false;
  medicamentos       = signal<Medicamento[]>([]);
  recetaPrescripcion = '';
  recetaProximaCita  = '';
  recetaDiagnostico  = '';  // diagnóstico precargado del formulario
  nuevoMed: Medicamento = { nombreGenerico:'', nombreComercial:'', presentacion:'', indicaciones:'' };

  opTipos = [
    { label:'Imagen',                value:'IMAGEN'               },
    { label:'Documento',             value:'DOCUMENTO'            },
    { label:'Receta',                value:'RECETA'               },
    { label:'Resultado Laboratorio', value:'RESULTADO_LABORATORIO'},
    { label:'Ecografía',             value:'ECOGRAFIA'            },
    { label:'Otro',                  value:'OTRO'                 },
  ];

  opTipoConsulta = [
    { label:'Control Prenatal (Secuencial)', value:'PRENATAL'         },
    { label:'Ginecología General / Control', value:'GINECO_GENERAL'   },
    { label:'Procedimiento Ginecológico',    value:'PROCEDIMIENTO'    },
    { label:'Lectura de Resultados',         value:'RESULTADOS'       },
    { label:'Primera Vez',                   value:'PRIMERA_VEZ'      },
  ];

  opEmbarazo = [
    { label:'SÍ — Activar Módulo Materno-Fetal',   value: true  },
    { label:'NO — Activar Módulo Ginecológico',     value: false },
  ];

  opScoreMama = [
    { label:'SCORE 0 — Signos vitales estables, sin criterios de riesgo u alarma obstétrica actual', value:'SCORE_0' },
    { label:'SCORE 1 — Un criterio de riesgo presente',      value:'SCORE_1' },
    { label:'SCORE 2 — Dos criterios de riesgo presentes',   value:'SCORE_2' },
    { label:'SCORE 3 — Tres o más criterios / Alarma activa',value:'SCORE_3' },
  ];

  // ── Form ──────────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    fechaConsulta:        [new Date(), Validators.required],
    tipoConsulta:         ['GINECO_GENERAL'],
    estaEmbarazada:       [false],
    // Consulta
    motivoConsulta:       ['', Validators.required],
    enfermedadActual:     [''],
    reporteExamenesPrevios:[''],
    // Signos vitales (como texto para más flexibilidad)
    peso:                 [null],
    talla:                [null],
    presionArterial:      [''],
    frecuenciaCardiacaTexto:   [''],
    frecuenciaRespiratoriaTexto:[''],
    temperaturaTexto:     [''],
    saturacionTexto:      [''],
    // Módulo materno
    alturaUterina:        [''],
    fcFetal:              [''],
    presentacionFetal:    [''],
    tonoUterino:          [''],
    movimientosFetales:   [''],
    pesoFetalEstimado:    [''],
    scoreMama:            [null],
    // Examen físico por sistemas
    examenFisico:         [''],
    examenCabeza:         [''],
    examenTorax:          [''],
    examenAbdomen:        [''],
    examenGenital:        [''],
    examenExtremidades:   [''],
    // Módulo ginecológico
    inspeccionVulva:      [''],
    especuloscopia:       [''],
    tactoVaginal:         [''],
    examenMamas:          [''],
    // Diagnóstico
    diagnosticoPrincipal: ['', Validators.required],
    diagnosticoSecundario:[''],
    codigoCie10:          [''],
    // Tratamiento
    tratamiento:          [''],
    medicacion:           [''],
    indicaciones:         [''],
    proximaCita:          [null],
    observaciones:        [''],
  });

  // ── Computed ──────────────────────────────────────────────────────────────
  estaEmbarazada(): boolean {
    return !!this.form.get('estaEmbarazada')?.value;
  }

  /** Calcula semanas desde la FUM ingresada en consulta, o la del paciente como fallback */
  semanasGestacionAuto(): string {
    const fum = this.fumConsulta ?? this.fumPaciente();
    if (!fum) return 'Ingresa la FUM →';
    const hoy  = new Date();
    const dias  = Math.floor((hoy.getTime() - fum.getTime()) / (1000 * 60 * 60 * 24));
    const sem   = Math.floor(dias / 7);
    const extra = dias % 7;
    return `${sem}.${extra} Semanas`;
  }

  /** Se llama al seleccionar la FUM en el calendario del módulo materno */
  onFumChange(): void {
    // Actualiza el signal para que semanasGestacionAuto() recalcule
    this.fumPaciente.set(this.fumConsulta);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const cId = this.route.snapshot.paramMap.get('consultaId');
    const hId = this.route.snapshot.queryParamMap.get('historiaId');

    if (cId) {
      this.esEdicion.set(true);
      this.consultaId.set(Number(cId));
      this.cargarConsulta(Number(cId));
    } else if (hId) {
      this.historiaId.set(Number(hId));
      // Cargar FUM del paciente para el cálculo de semanas
      this.cargarFumDesdeHistoria(Number(hId));
    } else {
      this.router.navigate(['/historias']);
    }

    ['peso','talla'].forEach(f =>
      this.form.get(f)?.valueChanges.subscribe(() => this.calcImc())
    );
  }

  cargarFumDesdeHistoria(historiaId: number): void {
    this.hSvc.obtenerPorId(historiaId).subscribe({
      next: r => {
        const fum = (r.data as any)?.fechaUltimaMenstruacion;
        if (fum) this.fumPaciente.set(new Date(fum + 'T00:00:00'));
        if (r.data?.pacienteEdad != null) {
          this.edadPaciente.set(r.data.pacienteEdad);
        }
        this.numeroHistoria.set(`HC-${historiaId}`);
      },
      error: () => {}
    });
  }

  cargarConsulta(id: number): void {
    this.hSvc.obtenerConsulta(id).subscribe({
      next: r => {
        if (!r.data) return;
        this.historiaId.set(r.data.historiaClinicaId);
        this.archivosSubidos.set(r.data.totalArchivos);
        this.numeroHistoria.set(`HC-${r.data.historiaClinicaId}`);
        this.cargarFumDesdeHistoria(r.data.historiaClinicaId);

        if (r.data.pacienteEdad != null) {
          this.edadPaciente.set(r.data.pacienteEdad);
        }

        if (r.data.codigoCie10) {
          this.cie10Input = r.data.codigoCie10;
          this.cie10DescSeleccionada = (r.data as any).codigoCie10Descripcion ?? '';
        }

        const secundarios = (r.data as any).codigosCie10Secundarios;
        if (Array.isArray(secundarios) && secundarios.length) {
          this.cie10Secundarios.set(
            secundarios.map((c: any) => typeof c === 'string'
              ? { codigo: c, descripcion: '', label: c } : c)
          );
        }

        this.form.patchValue({
          ...r.data,
          fechaConsulta: r.data.fechaConsulta
            ? new Date(r.data.fechaConsulta + 'T00:00:00') : null,
          proximaCita: r.data.proximaCita
            ? new Date(r.data.proximaCita + 'T00:00:00') : null,
        });
        this.calcImc();
      },
      error: () => {
        this.toast.add({ severity:'error', summary:'Error',
          detail:'No se pudo cargar la consulta' });
        this.volver();
      }
    });
  }

  onEmbarazoChange(): void {
    // Limpiar los campos del módulo que no aplica al cambiar
    if (this.estaEmbarazada()) {
      this.form.patchValue({
        inspeccionVulva:'', especuloscopia:'', tactoVaginal:'', examenMamas:''
      });
    } else {
      this.form.patchValue({
        alturaUterina:'', fcFetal:'', presentacionFetal:'',
        tonoUterino:'', movimientosFetales:'', pesoFetalEstimado:'', scoreMama: null
      });
    }
  }

  marcarTodoNormal(): void {
    this.form.patchValue({
      examenFisico:     'Paciente orientada en tiempo, espacio y persona. Alerta, consciente, hidratada, afebril, con marcha normal y buen estado nutricional aparente.',
      examenCabeza:     'Normocefálica. Escleras anictéricas, conjuntivas rosadas. Mucosas orales húmedas. Cuello móvil, tiroides normal a la palpación, sin adenopatías.',
      examenTorax:      'Auscultación cardiopulmonar normal. Ruidos cardíacos rítmicos de buen tono e intensidad, sin soplos patológicos. Pulmones claros.',
      examenAbdomen:    'Blando, depresible, no doloroso a la palpación superficial ni profunda. Ruidos hidroaéreos normales. Sin visceromegalias.',
      examenGenital:    'Genitales externos de aspecto y configuración normal, sin lesiones dérmicas ni secreciones patológicas.',
      examenExtremidades:'Simétricas, tono y trofismo conservados. Sin edema ni várices. Reflejos osteotendinosos presentes y simétricos.',
    });
    if (!this.estaEmbarazada()) {
      this.form.patchValue({
        inspeccionVulva: 'Genitales externos normoconfigurados, sin eritema ni lesiones dérmicas.',
        examenMamas:     'Simétricas, sin nódulos palpables ni retracciones. Expresión del pezón negativa.',
      });
    }
    this.toast.add({ severity:'success', summary:'Campos marcados',
      detail:'Examen físico marcado como normal' });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);

    const raw   = this.form.getRawValue();
    const toISO = (d: any) => d instanceof Date ? d.toISOString().split('T')[0] : d;
    const payload = {
      ...raw,
      fechaConsulta: toISO(raw.fechaConsulta),
      proximaCita:   toISO(raw.proximaCita),
      codigosCie10Secundarios: this.cie10Secundarios().map(s => s.codigo),
    };

    if (this.esEdicion()) {
      this.hSvc.actualizarConsulta(this.consultaId()!, payload).subscribe({
        next: r => {
          this.toast.add({ severity:'success', summary:'Guardado', detail:'Consulta actualizada' });
          setTimeout(() => this.router.navigate(['/historias/consultas', r.data.id]), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error',
            detail: err.error?.mensaje ?? 'Error al actualizar' });
          this.guardando.set(false);
        }
      });
    } else {
      this.hSvc.crearConsulta({ ...payload, historiaClinicaId: this.historiaId()! }).subscribe({
        next: r => {
          this.toast.add({ severity:'success', summary:'Registrada',
            detail:'Consulta registrada.' });
          setTimeout(() => this.router.navigate(['/historias/consultas', r.data.id, 'editar']), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error',
            detail: err.error?.mensaje ?? 'Error al registrar' });
          this.guardando.set(false);
        }
      });
    }
  }

  // ── Archivos ──────────────────────────────────────────────────────────────
  onFileSelect(e: any): void { this.archivosSeleccionados.set(e.currentFiles ?? []); }

  subirArchivos(): void {
    const files = this.archivosSeleccionados();
    const id    = this.consultaId();
    if (!files.length || !id) return;
    this.subiendo.set(true);
    let done = 0;
    files.forEach(f => {
      this.hSvc.subirArchivo(id, f, this.tipoArchivo, '').subscribe({
        next: () => {
          done++;
          if (done === files.length) {
            this.subiendo.set(false);
            this.archivosSeleccionados.set([]);
            this.archivosSubidos.update(n => n + done);
            this.toast.add({ severity:'success', summary:'Archivos subidos',
              detail:`${done} archivo(s) adjuntado(s)` });
          }
        },
        error: () => { this.subiendo.set(false); }
      });
    });
  }

  // ── CIE-10 ────────────────────────────────────────────────────────────────
  buscarCie10(event: { query: string }): void {
    this.cieSvc.buscar(event.query).subscribe({
      next: r => this.sugerenciasCie10.set(r.data ?? []),
      error: () => this.sugerenciasCie10.set([])
    });
  }

  seleccionarCie10Principal(event: any): void {
    const item: Cie10Sugerencia = event.value ?? event;
    this.form.patchValue({ codigoCie10: item.codigo });
    this.cie10Input            = item.codigo;
    this.cie10DescSeleccionada = item.descripcion;

    // Precarga el campo diagnósticoPrincipal si está vacío
    const diagActual = this.form.get('diagnosticoPrincipal')?.value;
    if (!diagActual || diagActual.trim() === '') {
      this.form.patchValue({
        diagnosticoPrincipal: item.descripcion
      });
    }
  }

  limpiarCie10(): void {
    this.form.patchValue({ codigoCie10: '' });
    this.cie10Input            = '';
    this.cie10DescSeleccionada = '';
  }

  buscarCie10Sec(event: { query: string }): void {
    this.cieSvc.buscar(event.query).subscribe({
      next: r => this.sugerenciasCie10Sec.set(r.data ?? []),
      error: () => this.sugerenciasCie10Sec.set([])
    });
  }

  agregarCie10Secundario(event: any): void {
    const item: Cie10Sugerencia = event.value ?? event;
    if (this.cie10Secundarios().some(s => s.codigo === item.codigo)) {
      this.toast.add({ severity:'warn', summary:'Duplicado',
        detail: `El código ${item.codigo} ya fue agregado` });
      this.cie10SecInput = '';
      return;
    }
    if (item.codigo === this.form.get('codigoCie10')?.value) {
      this.toast.add({ severity:'warn', summary:'Duplicado',
        detail:'Este código ya es el CIE-10 principal' });
      this.cie10SecInput = '';
      return;
    }
    this.cie10Secundarios.update(list => [...list, item]);
    this.cie10SecInput = '';
  }

  eliminarCie10Secundario(idx: number): void {
    this.cie10Secundarios.update(list => list.filter((_,i) => i !== idx));
  }

  // ── Receta ────────────────────────────────────────────────────────────────
  abrirReceta(): void {
    const id = this.consultaId();
    if (id) {
      this.docSvc.obtenerReceta(id).subscribe({
        next: r => {
          if (r.data) {
            this.medicamentos.set(r.data.medicamentos ?? []);
            this.recetaPrescripcion = r.data.prescripcion ?? '';
            this.recetaProximaCita  = r.data.proximaCita  ?? '';
          } else { this.precargarDesdeFormulario(); }
        },
        error: () => this.precargarDesdeFormulario()
      });
    }
    this.dialogReceta = true;
  }

  private precargarDesdeFormulario(): void {
    const indicaciones = this.form.get('indicaciones')?.value ?? '';
    const diagnostico  = this.form.get('diagnosticoPrincipal')?.value ?? '';
    const codigoCie    = this.form.get('codigoCie10')?.value ?? '';

    // Precarga prescripción con indicaciones + diagnóstico para la receta
    this.recetaPrescripcion = indicaciones;

    // Precarga próxima cita
    const pc = this.form.get('proximaCita')?.value;
    if (pc instanceof Date) this.recetaProximaCita = pc.toLocaleDateString('es-EC');

    // Precarga diagnóstico en la receta si viene del formulario
    if (diagnostico || codigoCie) {
      this.recetaDiagnostico = codigoCie
        ? `${diagnostico} (${codigoCie})`
        : diagnostico;
    }
  }

  guardarReceta(): void {
    const id = this.consultaId();
    if (!id) return;
    this.guardandoReceta.set(true);
    this.docSvc.guardarReceta(id, this.buildRecetaPayload()).subscribe({
      next: () => {
        this.guardandoReceta.set(false);
        this.toast.add({ severity:'success', summary:'Guardada',
          detail:'Receta guardada en la historia clínica' });
      },
      error: () => {
        this.guardandoReceta.set(false);
        this.toast.add({ severity:'error', summary:'Error',
          detail:'No se pudo guardar la receta' });
      }
    });
  }

  cerrarReceta(): void { this.dialogReceta = false; }

  agregarMedicamento(): void {
    if (!this.nuevoMed.nombreGenerico) return;
    this.medicamentos.update(list => [...list, { ...this.nuevoMed }]);
    // Solo registra nombre genérico + comercial, sin dosis ni cantidades
    this.medSvc.registrarUso({
      nombreGenerico:  this.nuevoMed.nombreGenerico,
      nombreComercial: this.nuevoMed.nombreComercial
    } as any).subscribe({ error: () => {} });
    this.nuevoMed = { nombreGenerico:'', nombreComercial:'', presentacion:'', indicaciones:'' };
  }

  buscarSugerencias(event: { query: string }): void {
    this.medSvc.buscar(event.query).subscribe({
      next: r => this.sugerenciasMed.set(r.data ?? []),
      error: () => this.sugerenciasMed.set([])
    });
  }

  seleccionarSugerencia(event: any): void {
    const med = event.value ?? event;
    // Al seleccionar sugerencia solo se llenan genérico y comercial
    // La presentación e indicaciones las escribe el médico cada vez
    this.nuevoMed.nombreGenerico  = med.nombreGenerico ?? med.nombre ?? '';
    this.nuevoMed.nombreComercial = med.nombreComercial ?? '';
    this.nuevoMed.presentacion    = '';
    this.nuevoMed.indicaciones    = '';
  }

  eliminarMedicamento(idx: number): void {
    this.medicamentos.update(list => list.filter((_,i) => i !== idx));
  }

  previsualizarReceta(): void {
    const id = this.consultaId();
    if (!id) return;
    this.generandoReceta.set(true);
    this.docSvc.generarPdfReceta(id, this.buildRecetaPayload()).subscribe({
      next: (blob: Blob) => { this.docSvc.previsualizarPdf(blob); this.generandoReceta.set(false); },
      error: () => { this.toast.add({ severity:'error', summary:'Error',
        detail:'No se pudo generar' }); this.generandoReceta.set(false); }
    });
  }

  descargarReceta(): void {
    const id = this.consultaId();
    if (!id) return;
    this.generandoReceta.set(true);
    this.docSvc.generarPdfReceta(id, this.buildRecetaPayload()).subscribe({
      next: (blob: Blob) => { this.docSvc.descargarPdf(blob, `receta_consulta_${id}.pdf`);
        this.generandoReceta.set(false); },
      error: () => { this.toast.add({ severity:'error', summary:'Error',
        detail:'No se pudo descargar' }); this.generandoReceta.set(false); }
    });
  }

  private buildRecetaPayload() {
    return {
      medicamentos: this.medicamentos(),
      prescripcion: this.recetaPrescripcion,
      proximaCita:  this.recetaProximaCita,
      diagnostico:  this.recetaDiagnostico,
    };
  }

  // ── IMC OMS ───────────────────────────────────────────────────────────────
  calcImc(): void {
    const p = this.form.get('peso')?.value;
    const t = this.form.get('talla')?.value;
    if (!p || !t || t === 0) { this.imc.set(null); return; }
    const m = t / 100;
    this.imc.set(Math.round((p / (m * m)) * 100) / 100);
  }

  imcLabel(): string {
    const v = this.imc();
    if (!v) return '';
    if (v < 16)   return 'Delgadez Severa';
    if (v < 17)   return 'Delgadez Moderada';
    if (v < 18.5) return 'Delgadez Leve';
    if (v < 25)   return 'Normal';
    if (v < 30)   return 'Sobrepeso';
    if (v < 35)   return 'Obesidad Clase I';
    if (v < 40)   return 'Obesidad Clase II';
    return 'Obesidad Clase III';
  }

  imcClase(): string {
    const v = this.imc();
    if (!v) return '';
    if (v < 16)   return 'imc-dsevera';
    if (v < 17)   return 'imc-dmoderada';
    if (v < 18.5) return 'imc-dleve';
    if (v < 25)   return 'imc-normal';
    if (v < 30)   return 'imc-sobrepeso';
    if (v < 35)   return 'imc-ob1';
    if (v < 40)   return 'imc-ob2';
    return 'imc-ob3';
  }

  imcIcono(): string {
    const v = this.imc();
    if (!v) return 'pi-circle';
    if (v < 18.5) return 'pi-arrow-down-right';
    if (v < 25)   return 'pi-check-circle';
    if (v < 30)   return 'pi-arrow-up-right';
    return 'pi-exclamation-triangle';
  }

  imcPosicion(): number {
    const v = this.imc();
    if (!v) return 0;
    const min = 14, max = 44;
    const clamped = Math.min(Math.max(v, min), max);
    return Math.round(((clamped - min) / (max - min)) * 100);
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c?.touched);
  }

  volver(): void {
    const hId = this.historiaId();
    if (hId) {
      this.hSvc.obtenerPorId(hId).subscribe({
        next: r => this.router.navigate(['/historias/paciente', r.data?.pacienteId]),
        error: () => this.router.navigate(['/historias'])
      });
    } else { this.router.navigate(['/historias']); }
  }
}
