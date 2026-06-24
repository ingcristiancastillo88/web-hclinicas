import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputTextModule }     from 'primeng/inputtext';
import { TextareaModule }      from 'primeng/textarea';
import { InputNumberModule }   from 'primeng/inputnumber';
import { CalendarModule }      from 'primeng/calendar';
import { ButtonModule }        from 'primeng/button';
import { TabViewModule }       from 'primeng/tabview';
import { FileUploadModule }    from 'primeng/fileupload';
import { DropdownModule }      from 'primeng/dropdown';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { DialogModule }        from 'primeng/dialog';
import { TooltipModule }       from 'primeng/tooltip';
import { AutoCompleteModule }  from 'primeng/autocomplete';
import { MessageService }      from 'primeng/api';
import { HistoriaClinicaService }     from '../../../core/services/historia-clinica.service';
import { DocumentoService }           from '../../../core/services/documento.service';
import { DialogoLaboratorioComponent } from '../dialogo-laboratorio/dialogo-laboratorio.component';
import { MedicamentoCatalogoService, MedicamentoSugerencia } from '../../../core/services/medicamento-catalogo.service';
import { Cie10Service, Cie10Sugerencia } from '../../../core/services/cie10.service';

interface Medicamento {
  nombre: string; dosis: string; cantidad: string; indicaciones: string;
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
        </div>
      </div>
      <div class="header-actions">
        @if (esEdicion()) {
          <p-button label="Generar Receta" icon="pi pi-file-edit"
                    styleClass="btn-receta"
                    pTooltip="Generar receta médica" tooltipPosition="bottom"
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

          <!-- ══ ① DATOS GENERALES + ANTECEDENTES ══ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-user tab-i"></i>Filiación</span>
            </ng-template>

            <div class="seccion-titulo">
              <i class="pi pi-calendar-clock"></i> Datos de la Consulta
            </div>
            <div class="form-grid">
              <div class="field req-field">
                <label>Fecha de Consulta <span class="req">*</span></label>
                <p-calendar formControlName="fechaConsulta"
                            [maxDate]="hoy" [showIcon]="true"
                            dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa"
                            styleClass="w-full" inputStyleClass="w-full" />
                @if (isInvalid('fechaConsulta')) {
                  <small class="err"><i class="pi pi-exclamation-circle"></i> Obligatorio</small>
                }
              </div>
            </div>

            <p-divider align="left">
              <span class="div-lbl"><i class="pi pi-id-card"></i> Antecedentes Personales</span>
            </p-divider>
            <div class="form-grid-col">
              <div class="field">
                <label>Antecedentes Personales</label>
                <textarea pInputTextarea formControlName="antecedentesPersonales"
                          rows="2" class="w-full"
                          placeholder="Patologías previas, cirugías, hospitalizaciones..."></textarea>
              </div>
              <div class="field">
                <label>Antecedentes Quirúrgicos</label>
                <textarea pInputTextarea formControlName="antecedentesQuirurgicos"
                          rows="2" class="w-full"
                          placeholder="Cirugías previas..."></textarea>
              </div>
              <div class="field">
                <label>Antecedentes Familiares</label>
                <textarea pInputTextarea formControlName="antecedentesFamiliares"
                          rows="2" class="w-full"
                          placeholder="Enfermedades hereditarias en familiares directos..."></textarea>
              </div>
              <div class="field">
                <label>Alergias</label>
                <input pInputText formControlName="alergias"
                       placeholder="Medicamentos, alimentos, sustancias..." class="w-full" />
              </div>
            </div>

            <p-divider align="left">
              <span class="div-lbl"><i class="pi pi-heart-fill"></i> Antecedentes Gineco-Obstétricos</span>
            </p-divider>
            <div class="form-grid">
              <div class="field">
                <label>Menarquía</label>
                <input pInputText formControlName="menarquia"
                       placeholder="Edad de primera menstruación" class="w-full" />
              </div>
              <div class="field">
                <label>Ciclos Menstruales</label>
                <input pInputText formControlName="ciclosMenstruales"
                       placeholder="Ej: 28/5, regulares" class="w-full" />
              </div>
              <div class="field">
                <label>Inicio Vida Sexual</label>
                <input pInputText formControlName="inicioVidaSexual"
                       placeholder="Edad" class="w-full" />
              </div>
              <div class="field">
                <label>ETS</label>
                <input pInputText formControlName="ets"
                       placeholder="Enfermedades de transmisión sexual" class="w-full" />
              </div>
              <div class="field">
                <label>Gestas</label>
                <p-inputNumber formControlName="gestas" [min]="0" placeholder="0" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Partos</label>
                <p-inputNumber formControlName="partos" [min]="0" placeholder="0" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Cesáreas</label>
                <p-inputNumber formControlName="cesareas" [min]="0" placeholder="0" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Abortos</label>
                <p-inputNumber formControlName="abortos" [min]="0" placeholder="0" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Nacidos Vivos (NV)</label>
                <p-inputNumber formControlName="nacidosVivos" [min]="0" placeholder="0" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Último Papanicolau</label>
                <input pInputText formControlName="ultimoPapanicolau"
                       placeholder="Fecha o resultado" class="w-full" />
              </div>
              <div class="field">
                <label>Tamizaje Mamario</label>
                <input pInputText formControlName="tamizajeMamario"
                       placeholder="Fecha o resultado" class="w-full" />
              </div>
              <div class="field">
                <label>Menopausia</label>
                <input pInputText formControlName="menopausia"
                       placeholder="Edad o N/A" class="w-full" />
              </div>
            </div>
          </p-tabPanel>

          <!-- ══ ② MOTIVO + ③ ENFERMEDAD ACTUAL ══ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-comment tab-i"></i>Consulta</span>
            </ng-template>

            <div class="form-grid-col">
              <div class="field req-field">
                <label>Motivo de Consulta <span class="req">*</span></label>
                <textarea pInputTextarea formControlName="motivoConsulta"
                          rows="2" class="w-full"
                          placeholder="Motivo principal por el que consulta la paciente..."></textarea>
                @if (isInvalid('motivoConsulta')) {
                  <small class="err"><i class="pi pi-exclamation-circle"></i> Obligatorio</small>
                }
              </div>

              <div class="field req-field">
                <label>Enfermedad Actual</label>
                <textarea pInputTextarea formControlName="enfermedadActual"
                          rows="4" class="w-full"
                          placeholder="Descripción detallada de la enfermedad o síntomas actuales, tiempo de evolución, características..."></textarea>
              </div>
            </div>
          </p-tabPanel>

          <!-- ══ ④ EXAMEN FÍSICO + SIGNOS VITALES ══ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-heart tab-i"></i>Examen Físico</span>
            </ng-template>

            <div class="seccion-titulo">
              <i class="pi pi-chart-bar"></i> Signos Vitales
            </div>
            <div class="form-grid">
              <div class="field">
                <label>Peso (kg)</label>
                <p-inputNumber formControlName="peso" [minFractionDigits]="1"
                               [maxFractionDigits]="1" placeholder="65.0" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Talla (cm)</label>
                <p-inputNumber formControlName="talla" [minFractionDigits]="1"
                               [maxFractionDigits]="1" placeholder="165.0" styleClass="w-full" />
              </div>
              @if (imc()) {
                <div class="field">
                  <label>IMC (calculado)</label>
                  <div class="imc-box" [class]="imcClase()">
                    <span class="imc-v">{{ imc() }}</span>
                    <span class="imc-l">{{ imcLabel() }}</span>
                  </div>
                </div>
              }
              <div class="field">
                <label>Tensión Arterial</label>
                <input pInputText formControlName="presionArterial"
                       placeholder="120/80 mmHg" class="w-full" />
              </div>
              <div class="field">
                <label>Frecuencia Cardíaca (lpm)</label>
                <p-inputNumber formControlName="frecuenciaCardiaca"
                               placeholder="72" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Frecuencia Respiratoria (rpm)</label>
                <p-inputNumber formControlName="frecuenciaRespiratoria"
                               placeholder="18" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Temperatura (°C)</label>
                <p-inputNumber formControlName="temperatura"
                               [minFractionDigits]="1" placeholder="36.5" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Saturación O₂ (%)</label>
                <p-inputNumber formControlName="saturacionOxigeno"
                               [min]="0" [max]="100" placeholder="98" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Semanas de Gestación</label>
                <p-inputNumber formControlName="semanasGestacion"
                               placeholder="(si aplica)" styleClass="w-full" />
              </div>
            </div>

            <p-divider align="left">
              <span class="div-lbl"><i class="pi pi-search"></i> Examen por Sistemas</span>
            </p-divider>
            <div class="form-grid">
              <div class="field">
                <label>Cabeza</label>
                <textarea pInputTextarea formControlName="examenCabeza"
                          rows="2" class="w-full" placeholder="Hallazgos en cabeza..."></textarea>
              </div>
              <div class="field">
                <label>Tórax</label>
                <textarea pInputTextarea formControlName="examenTorax"
                          rows="2" class="w-full" placeholder="Hallazgos en tórax..."></textarea>
              </div>
              <div class="field">
                <label>Abdomen</label>
                <textarea pInputTextarea formControlName="examenAbdomen"
                          rows="2" class="w-full" placeholder="Hallazgos en abdomen..."></textarea>
              </div>
              <div class="field">
                <label>Región Genital</label>
                <textarea pInputTextarea formControlName="examenGenital"
                          rows="2" class="w-full" placeholder="Hallazgos en región genital..."></textarea>
              </div>
              <div class="field">
                <label>Extremidades</label>
                <textarea pInputTextarea formControlName="examenExtremidades"
                          rows="2" class="w-full" placeholder="Hallazgos en extremidades..."></textarea>
              </div>
              <div class="field">
                <label>Examen Físico General</label>
                <textarea pInputTextarea formControlName="examenFisico"
                          rows="2" class="w-full" placeholder="Otros hallazgos relevantes..."></textarea>
              </div>
            </div>
          </p-tabPanel>

          <!-- ══ ⑤ DIAGNÓSTICO CIE-10 + TRATAMIENTO ══ -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-check-circle tab-i"></i>Diagnóstico</span>
            </ng-template>

            <div class="seccion-titulo">
              <i class="pi pi-check-circle"></i>Diagnóstico (CIE-10)
            </div>
            <div class="form-grid-col">
              <div class="field req-field">
                <label>Diagnóstico Principal <span class="req">*</span></label>
                <textarea pInputTextarea formControlName="diagnosticoPrincipal"
                          rows="2" class="w-full" placeholder="Diagnóstico principal..."></textarea>
                @if (isInvalid('diagnosticoPrincipal')) {
                  <small class="err"><i class="pi pi-exclamation-circle"></i> Obligatorio</small>
                }
              </div>
              <div class="field">
                <label>Diagnóstico Secundario</label>
                <textarea pInputTextarea formControlName="diagnosticoSecundario"
                          rows="2" class="w-full" placeholder="Diagnóstico secundario (si aplica)..."></textarea>
              </div>

              <!-- CIE-10 con autocompletado -->
              <div class="field">
                <label>Código CIE-10</label>
                <div class="cie-autocomplete-wrap">
                  <p-autoComplete
                    [(ngModel)]="cie10Input"
                    [ngModelOptions]="{standalone: true}"
                    [suggestions]="sugerenciasCie10()"
                    (completeMethod)="buscarCie10($event)"
                    (onSelect)="seleccionarCie10($event)"
                    field="label"
                    [minLength]="2"
                    placeholder="Escribe código o descripción... Ej: O80 o PARTO"
                    styleClass="w-full" inputStyleClass="w-full"
                    [showEmptyMessage]="true"
                    emptyMessage="Sin coincidencias en CIE-10">
                    <ng-template let-item pTemplate="item">
                      <div class="cie-item">
                        <span class="cie-codigo">{{ item.codigo }}</span>
                        <span class="cie-desc">{{ item.descripcion }}</span>
                      </div>
                    </ng-template>
                  </p-autoComplete>
                  @if (form.get('codigoCie10')?.value) {
                    <div class="cie-seleccionado">
                      <i class="pi pi-check-circle"></i>
                      <strong>{{ form.get('codigoCie10')?.value }}</strong>
                      <span>{{ cie10DescSeleccionada }}</span>
                      <p-button icon="pi pi-times" [rounded]="true" [text]="true"
                                severity="danger" [style]="{padding:'0'}"
                                (onClick)="limpiarCie10()" />
                    </div>
                  }
                </div>
              </div>
            </div>

            <p-divider align="left">
              <span class="div-lbl"><i class="pi pi-heart"></i> Tratamiento</span>
            </p-divider>
            <div class="form-grid-col">
              <div class="field">
                <label>Tratamiento Indicado</label>
                <textarea pInputTextarea formControlName="tratamiento"
                          rows="3" class="w-full" placeholder="Tratamiento indicado..."></textarea>
              </div>
              <div class="field">
                <label>Medicación</label>
                <textarea pInputTextarea formControlName="medicacion"
                          rows="3" class="w-full" placeholder="Medicamentos, dosis y frecuencia..."></textarea>
              </div>
              <div class="field">
                <label>Indicaciones para la Paciente</label>
                <textarea pInputTextarea formControlName="indicaciones"
                          rows="2" class="w-full" placeholder="Indicaciones de cuidado..."></textarea>
              </div>
              <div class="field" style="max-width:280px">
                <label>Próxima Cita</label>
                <p-calendar formControlName="proximaCita" [minDate]="hoy"
                            [showIcon]="true" dateFormat="dd/mm/yy"
                            placeholder="dd/mm/aaaa"
                            styleClass="w-full" inputStyleClass="w-full" />
              </div>
              <div class="field">
                <label>Observaciones Adicionales</label>
                <textarea pInputTextarea formControlName="observaciones"
                          rows="2" class="w-full" placeholder="Observaciones adicionales..."></textarea>
              </div>
            </div>
          </p-tabPanel>

          <!-- ══ Archivos Adjuntos ══ -->
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
              <div class="tipos-info">
                <div class="tipo-chip"><i class="pi pi-image"></i> Imágenes</div>
                <div class="tipo-chip"><i class="pi pi-file-pdf"></i> PDF</div>
                <div class="tipo-chip"><i class="pi pi-file"></i> Documentos</div>
                <div class="tipo-chip"><i class="pi pi-heart"></i> Ecografías</div>
                <div class="tipo-chip"><i class="pi pi-flask"></i> Laboratorio</div>
              </div>
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
                    <small>JPG, PNG, PDF, DOCX, XLSX · Máximo 10 MB por archivo</small>
                  </div>
                </ng-template>
              </p-fileUpload>
              @if (archivosSeleccionados().length > 0) {
                <div class="upload-actions">
                  <div class="field" style="min-width:220px">
                    <label>Categoría del archivo</label>
                    <p-dropdown [(ngModel)]="tipoArchivo"
                                [ngModelOptions]="{standalone:true}"
                                [options]="opTipos"
                                optionLabel="label" optionValue="value"
                                placeholder="Selecciona categoría" styleClass="w-full" />
                  </div>
                  <p-button [label]="'Subir ' + archivosSeleccionados().length + ' archivo(s)'"
                            icon="pi pi-upload" styleClass="btn-pink"
                            [loading]="subiendo()" (onClick)="subirArchivos()" />
                </div>
              }
              @if (archivosSubidos() > 0) {
                <div class="archivos-subidos-info">
                  <i class="pi pi-check-circle"></i>
                  {{ archivosSubidos() }} archivo(s) adjunto(s) a esta consulta
                </div>
              }
            }
          </p-tabPanel>

        </p-tabView>

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

    <!-- ══ DIÁLOGO RECETA ═══════════════════════════════════════════════ -->
    <p-dialog [(visible)]="dialogReceta" header="Receta Médica"
              [modal]="true" [style]="{width:'780px', maxWidth:'96vw'}"
              [draggable]="false" [resizable]="false" styleClass="dialog-receta">

      <div class="receta-body">
        <div class="receta-seccion">
          <div class="receta-sec-titulo">
            <i class="pi pi-plus-circle"></i> Rx — Medicamentos
          </div>
          @if (medicamentos().length > 0) {
            <div class="med-lista">
              @for (med of medicamentos(); track $index; let i = $index) {
                <div class="med-item">
                  <div class="med-item-info">
                    <span class="med-nombre">{{ med.nombre }}</span>
                    <span class="med-detalle">{{ med.dosis }} · Cant: {{ med.cantidad }}</span>
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
            <div class="med-form-grid">
              <div class="field">
                <label>Medicamento *</label>
                <p-autoComplete [(ngModel)]="nuevoMed.nombre"
                                [suggestions]="sugerenciasMed()"
                                (completeMethod)="buscarSugerencias($event)"
                                (onSelect)="seleccionarSugerencia($event)"
                                field="nombre" [minLength]="2"
                                placeholder="Nombre del medicamento..."
                                styleClass="w-full" inputStyleClass="w-full"
                                [showEmptyMessage]="true"
                                emptyMessage="Se guardará como nuevo">
                  <ng-template let-med pTemplate="item">
                    <div class="sugerencia-item">
                      <span class="sug-nombre">{{ med.nombre }}</span>
                      @if (med.dosisSugerida) {
                        <span class="sug-detalle">{{ med.dosisSugerida }}</span>
                      }
                      <span class="sug-usos">{{ med.vecesUsado }}x</span>
                    </div>
                  </ng-template>
                </p-autoComplete>
              </div>
              <div class="field">
                <label>Dosis *</label>
                <input pInputText [(ngModel)]="nuevoMed.dosis"
                       placeholder="Ej: 500 mg" class="w-full" />
              </div>
              <div class="field">
                <label>Cantidad</label>
                <input pInputText [(ngModel)]="nuevoMed.cantidad"
                       placeholder="Ej: 10 tabletas" class="w-full" />
              </div>
              <div class="field field-full">
                <label>Indicaciones de administración</label>
                <input pInputText [(ngModel)]="nuevoMed.indicaciones"
                       placeholder="Ej: 1 tableta cada 8 horas por 7 días" class="w-full" />
              </div>
            </div>
            <p-button label="Agregar Medicamento" icon="pi pi-plus"
                      styleClass="btn-agregar"
                      [disabled]="!nuevoMed.nombre || !nuevoMed.dosis"
                      (onClick)="agregarMedicamento()" />
          </div>
        </div>

        <div class="receta-sep"></div>

        <div class="receta-seccion">
          <div class="receta-sec-titulo">
            <i class="pi pi-list"></i> Indicaciones Generales
          </div>
          <div class="field" style="margin-bottom:.8rem">
            <label>Prescripción médica</label>
            <textarea pInputTextarea [(ngModel)]="recetaPrescripcion"
                      rows="3" class="w-full"
                      placeholder="Indicaciones generales..."></textarea>
          </div>
          <div class="field">
            <label>Próxima cita / Control</label>
            <input pInputText [(ngModel)]="recetaProximaCita"
                   placeholder="Ej: Regresar en 15 días para control" class="w-full" />
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="receta-footer">
          <p-button label="Cancelar" [text]="true" severity="secondary"
                    (onClick)="cerrarReceta()" />
          <div style="display:flex; gap:.75rem; flex-wrap:wrap">
            <p-button label="Guardar" icon="pi pi-save"
                      severity="secondary" [outlined]="true"
                      [loading]="guardandoReceta()"
                      [disabled]="medicamentos().length === 0 && !recetaPrescripcion"
                      (onClick)="guardarReceta()" />
            <p-button label="Previsualizar PDF" icon="pi pi-eye"
                      severity="secondary" [outlined]="true"
                      [loading]="generandoReceta()"
                      [disabled]="medicamentos().length === 0 && !recetaPrescripcion"
                      (onClick)="previsualizarReceta()" />
            <p-button label="Descargar Receta" icon="pi pi-file-pdf"
                      styleClass="btn-pink"
                      [loading]="generandoReceta()"
                      [disabled]="medicamentos().length === 0 && !recetaPrescripcion"
                      (onClick)="descargarReceta()" />
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .page-header  { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .page-title   { display:flex; align-items:center; gap:1rem; }
    .header-actions { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
    .page-icon    { width:52px; height:52px; background:linear-gradient(135deg,#e91e8c,#c2185b); border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 2px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }

    :deep(.btn-receta) { background:linear-gradient(135deg,#e91e8c,#c2185b) !important; border-color:#c2185b !important; color:white !important; }
    :deep(.btn-pink)   { background:linear-gradient(135deg,#e91e8c,#c2185b) !important; border-color:#c2185b !important; color:white !important; }

    .form-card { background:white; border-radius:16px; padding:0 0 1.5rem; box-shadow:0 2px 12px rgba(0,0,0,.07); overflow:hidden; }

    :deep(.form-tabs .p-tabview-panels) { padding:1.5rem 2rem; }
    :deep(.form-tabs .p-tabview-nav)    { padding:0 1rem; background:#fdf2f8; }
    :deep(.form-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link) { color:#c2185b; border-color:#e91e8c; }
    .tab-i   { margin-right:6px; }
    .tab-bdg { background:#e91e8c; color:white; font-size:.7rem; font-weight:700; padding:1px 6px; border-radius:20px; margin-left:5px; }

    .seccion-titulo { display:flex; align-items:center; gap:8px; font-size:.92rem; font-weight:800; color:#0a2342; margin-bottom:1rem; padding:8px 12px; background:#fdf2f8; border-radius:10px; border-left:4px solid #e91e8c; }
    .seccion-titulo .pi { color:#e91e8c; }

    .form-grid     { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1.2rem; margin-bottom:1rem; }
    .form-grid-col { display:flex; flex-direction:column; gap:1.2rem; margin-bottom:1rem; }
    .field-full    { grid-column:1/-1; }
    .field { display:flex; flex-direction:column; gap:5px; }
    .field label { font-size:.83rem; font-weight:600; color:#334155; }
    .req  { color:#e91e8c; }
    .err  { display:flex; align-items:center; gap:4px; color:#ef4444; font-size:.78rem; }

    :deep(.p-divider-content) { background:white; }
    .div-lbl { display:flex; align-items:center; gap:6px; font-size:.85rem; font-weight:700; color:#334155; }
    .div-lbl .pi { color:#e91e8c; }

    /* IMC */
    .imc-box  { display:flex; align-items:center; gap:8px; padding:.6rem 1rem; border-radius:10px; border:2px solid #e2e8f0; }
    .imc-normal    { border-color:#16a34a; background:#f0fdf4; }
    .imc-bajo      { border-color:#2563eb; background:#eff6ff; }
    .imc-sobrepeso { border-color:#d97706; background:#fffbeb; }
    .imc-obesidad  { border-color:#dc2626; background:#fef2f2; }
    .imc-v { font-size:1.4rem; font-weight:800; color:#0a2342; }
    .imc-l { font-size:.78rem; color:#64748b; }

    /* CIE-10 autocomplete */
    .cie-autocomplete-wrap { display:flex; flex-direction:column; gap:6px; }
    .cie-item { display:flex; align-items:center; gap:10px; }
    .cie-codigo { background:#7c3aed; color:white; font-size:.72rem; font-weight:800; padding:2px 8px; border-radius:6px; flex-shrink:0; font-family:monospace; }
    .cie-desc   { font-size:.82rem; color:#334155; }
    .cie-seleccionado {
      display:flex; align-items:center; gap:8px; flex-wrap:wrap;
      background:#f5f3ff; border:1px solid #ddd6fe; border-radius:10px;
      padding:.5rem .75rem; font-size:.82rem;
    }
    .cie-seleccionado .pi { color:#7c3aed; }
    .cie-seleccionado strong { color:#5b21b6; font-family:monospace; }
    .cie-seleccionado span { color:#64748b; flex:1; }

    /* Archivos */
    .aviso-archivos { display:flex; align-items:center; gap:10px; background:#fdf2f8; border:1px solid #f8bbd0; border-radius:10px; padding:1rem 1.25rem; color:#c2185b; font-size:.88rem; font-weight:500; }
    .tipos-info { display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:1rem; }
    .tipo-chip { display:flex; align-items:center; gap:5px; background:#fce4ec; color:#c2185b; border-radius:20px; padding:4px 12px; font-size:.75rem; font-weight:600; }
    :deep(.upload-cust) { width:100%; margin-bottom:1rem; }
    .upload-ph { display:flex; flex-direction:column; align-items:center; padding:2rem; color:#94a3b8; text-align:center; }
    .upload-ph .pi { font-size:2.5rem; margin-bottom:.5rem; color:#f8bbd0; }
    .upload-ph p { margin:0 0 4px; font-size:.9rem; }
    .upload-ph small { font-size:.78rem; }
    .upload-actions { display:flex; align-items:flex-end; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; }
    .archivos-subidos-info { display:flex; align-items:center; gap:8px; background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:.75rem 1rem; color:#166534; font-size:.85rem; font-weight:600; }

    :deep(textarea.p-inputtextarea) { border-radius:10px !important; resize:vertical; }
    :deep(.p-inputnumber) { width:100%; }
    :deep(.p-inputnumber-input) { width:100%; border-radius:10px !important; }
    .form-actions { display:flex; justify-content:flex-end; gap:1rem; padding:0 2rem; flex-wrap:wrap; }

    /* Diálogo Receta */
    :deep(.dialog-receta .p-dialog-header) { background:linear-gradient(135deg,#0a2342,#1a4a7a); color:white; border-radius:12px 12px 0 0; }
    :deep(.dialog-receta .p-dialog-header .p-dialog-title) { font-weight:700; }
    :deep(.dialog-receta .p-dialog-header-icons .p-dialog-header-close) { color:white; }
    .receta-body { display:flex; flex-direction:column; gap:0; }
    .receta-seccion { padding:1.25rem 0; }
    .receta-sec-titulo { display:flex; align-items:center; gap:8px; font-size:.95rem; font-weight:700; color:#0a2342; margin-bottom:1rem; padding-bottom:.5rem; border-bottom:2px solid #fce4ec; }
    .receta-sec-titulo .pi { color:#e91e8c; }
    .receta-sep { height:1px; background:#f1f5f9; margin:.25rem 0; }
    .med-lista { display:flex; flex-direction:column; gap:.5rem; margin-bottom:1rem; }
    .med-item { display:flex; align-items:center; gap:1rem; background:#fdf2f8; border:1px solid #f8bbd0; border-radius:10px; padding:.7rem 1rem; }
    .med-item-info { display:flex; flex-direction:column; gap:2px; flex:1; }
    .med-nombre  { font-weight:700; color:#0a2342; font-size:.9rem; }
    .med-detalle { font-size:.78rem; color:#c2185b; font-weight:600; }
    .med-ind     { font-size:.75rem; color:#64748b; }
    .med-form { background:#f8fafc; border-radius:12px; padding:1rem; border:1px dashed #e2e8f0; }
    .med-form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:.8rem; margin-bottom:.8rem; }
    :deep(.btn-agregar) { background:#fce4ec !important; color:#c2185b !important; border:1px solid #f8bbd0 !important; font-weight:700 !important; }
    .receta-footer { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.75rem; }

    /* Sugerencias medicamento */
    .sugerencia-item { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:2px 0; }
    .sug-nombre  { font-weight:600; color:#0a2342; font-size:.85rem; }
    .sug-detalle { font-size:.75rem; color:#64748b; flex:1; }
    .sug-usos    { background:#fce4ec; color:#c2185b; font-size:.68rem; font-weight:700; padding:1px 6px; border-radius:10px; }
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

  tipoArchivo          = 'OTRO';
  cie10Input           = '';
  cie10DescSeleccionada = '';
  hoy                  = new Date();

  // Receta
  dialogReceta       = false;
  medicamentos       = signal<Medicamento[]>([]);
  recetaPrescripcion = '';
  recetaProximaCita  = '';
  nuevoMed: Medicamento = { nombre:'', dosis:'', cantidad:'', indicaciones:'' };

  opTipos = [
    { label:'Imagen',                value:'IMAGEN' },
    { label:'Documento',             value:'DOCUMENTO' },
    { label:'Receta',                value:'RECETA' },
    { label:'Resultado Laboratorio', value:'RESULTADO_LABORATORIO' },
    { label:'Ecografía',             value:'ECOGRAFIA' },
    { label:'Otro',                  value:'OTRO' },
  ];

  form: FormGroup = this.fb.group({
    fechaConsulta:           [new Date(), Validators.required],
    // ① Antecedentes
    antecedentesPersonales:  [''],
    antecedentesQuirurgicos: [''],
    antecedentesFamiliares:  [''],
    alergias:                [''],
    // Gineco-obstétricos
    menarquia:               [''],
    ciclosMenstruales:       [''],
    inicioVidaSexual:        [''],
    ets:                     [''],
    gestas:                  [null],
    partos:                  [null],
    cesareas:                [null],
    abortos:                 [null],
    nacidosVivos:            [null],
    ultimoPapanicolau:       [''],
    tamizajeMamario:         [''],
    menopausia:              [''],
    // ② Motivo
    motivoConsulta:          ['', Validators.required],
    // ③ Enfermedad actual
    enfermedadActual:        [''],
    // ④ Examen físico
    peso:                    [null], talla:                [null],
    presionArterial:         [''],   frecuenciaCardiaca:   [null],
    frecuenciaRespiratoria:  [null], temperatura:          [null],
    saturacionOxigeno:       [null], semanasGestacion:     [null],
    examenCabeza:            [''],   examenTorax:          [''],
    examenAbdomen:           [''],   examenGenital:        [''],
    examenExtremidades:      [''],   examenFisico:         [''],
    // ⑤ Diagnóstico
    diagnosticoPrincipal:    ['', Validators.required],
    diagnosticoSecundario:   [''],
    codigoCie10:             [''],
    // Tratamiento
    tratamiento:             [''], medicacion:   [''],
    indicaciones:            [''], proximaCita:  [null],
    observaciones:           [''],
  });

  ngOnInit(): void {
    const cId = this.route.snapshot.paramMap.get('consultaId');
    const hId = this.route.snapshot.queryParamMap.get('historiaId');

    if (cId) {
      this.esEdicion.set(true);
      this.consultaId.set(Number(cId));
      this.cargarConsulta(Number(cId));
    } else if (hId) {
      this.historiaId.set(Number(hId));
    } else {
      this.router.navigate(['/historias']);
    }

    ['peso','talla'].forEach(f =>
      this.form.get(f)?.valueChanges.subscribe(() => this.calcImc())
    );
  }

  cargarConsulta(id: number): void {
    this.hSvc.obtenerConsulta(id).subscribe({
      next: r => {
        if (!r.data) return;
        this.historiaId.set(r.data.historiaClinicaId);
        this.archivosSubidos.set(r.data.totalArchivos);
        // Precargar CIE-10 si tiene
        if (r.data.codigoCie10) {
          this.cie10Input = r.data.codigoCie10;
          this.cie10DescSeleccionada = '';
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
        this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo cargar la consulta' });
        this.volver();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const raw   = this.form.getRawValue();
    const toISO = (d: any) => d instanceof Date ? d.toISOString().split('T')[0] : d;
    const payload = { ...raw, fechaConsulta: toISO(raw.fechaConsulta), proximaCita: toISO(raw.proximaCita) };

    if (this.esEdicion()) {
      this.hSvc.actualizarConsulta(this.consultaId()!, payload).subscribe({
        next: r => {
          this.toast.add({ severity:'success', summary:'Guardado', detail:'Consulta actualizada' });
          setTimeout(() => this.router.navigate(['/historias/consultas', r.data.id]), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error', detail: err.error?.mensaje ?? 'Error al actualizar' });
          this.guardando.set(false);
        }
      });
    } else {
      this.hSvc.crearConsulta({ ...payload, historiaClinicaId: this.historiaId()! }).subscribe({
        next: r => {
          this.toast.add({ severity:'success', summary:'Registrada', detail:'Consulta registrada.' });
          setTimeout(() => this.router.navigate(['/historias/consultas', r.data.id, 'editar']), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error', detail: err.error?.mensaje ?? 'Error al registrar' });
          this.guardando.set(false);
        }
      });
    }
  }

  // ── CIE-10 ───────────────────────────────────────────────────────────────
  buscarCie10(event: { query: string }): void {
    this.cieSvc.buscar(event.query).subscribe({
      next: r => this.sugerenciasCie10.set(r.data ?? []),
      error: () => this.sugerenciasCie10.set([])
    });
  }

  seleccionarCie10(event: any): void {
    const item: Cie10Sugerencia = event.value ?? event;
    this.form.patchValue({ codigoCie10: item.codigo });
    this.cie10Input            = item.codigo;
    this.cie10DescSeleccionada = item.descripcion;
  }

  limpiarCie10(): void {
    this.form.patchValue({ codigoCie10: '' });
    this.cie10Input            = '';
    this.cie10DescSeleccionada = '';
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
            this.toast.add({ severity:'success', summary:'Archivos subidos', detail:`${done} archivo(s) adjuntado(s)` });
          }
        },
        error: () => { this.subiendo.set(false); this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo subir: ' + f.name }); }
      });
    });
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
    this.recetaPrescripcion = this.form.get('indicaciones')?.value ?? '';
    const pc = this.form.get('proximaCita')?.value;
    if (pc instanceof Date) this.recetaProximaCita = pc.toLocaleDateString('es-EC');
  }

  guardarReceta(): void {
    const id = this.consultaId();
    if (!id) return;
    this.guardandoReceta.set(true);
    this.docSvc.guardarReceta(id, this.buildRecetaPayload()).subscribe({
      next: () => {
        this.guardandoReceta.set(false);
        this.toast.add({ severity:'success', summary:'Guardada', detail:'Receta guardada en la historia clínica' });
      },
      error: () => {
        this.guardandoReceta.set(false);
        this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo guardar la receta' });
      }
    });
  }

  cerrarReceta(): void { this.dialogReceta = false; }

  agregarMedicamento(): void {
    if (!this.nuevoMed.nombre || !this.nuevoMed.dosis) return;
    this.medicamentos.update(list => [...list, { ...this.nuevoMed }]);
    this.medSvc.registrarUso(this.nuevoMed).subscribe({ error: () => {} });
    this.nuevoMed = { nombre:'', dosis:'', cantidad:'', indicaciones:'' };
  }

  buscarSugerencias(event: { query: string }): void {
    this.medSvc.buscar(event.query).subscribe({
      next: r => this.sugerenciasMed.set(r.data ?? []),
      error: () => this.sugerenciasMed.set([])
    });
  }

  seleccionarSugerencia(event: any): void {
    const med: MedicamentoSugerencia = event.value ?? event;
    this.nuevoMed.nombre       = med.nombre;
    this.nuevoMed.dosis        = med.dosisSugerida ?? '';
    this.nuevoMed.cantidad     = med.cantidadSugerida ?? '';
    this.nuevoMed.indicaciones = med.indicacionesSugeridas ?? '';
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
      error: () => { this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo generar' }); this.generandoReceta.set(false); }
    });
  }

  descargarReceta(): void {
    const id = this.consultaId();
    if (!id) return;
    this.generandoReceta.set(true);
    this.docSvc.generarPdfReceta(id, this.buildRecetaPayload()).subscribe({
      next: (blob: Blob) => { this.docSvc.descargarPdf(blob, `receta_consulta_${id}.pdf`); this.generandoReceta.set(false); },
      error: () => { this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo descargar' }); this.generandoReceta.set(false); }
    });
  }

  private buildRecetaPayload() {
    return { medicamentos: this.medicamentos(), prescripcion: this.recetaPrescripcion, proximaCita: this.recetaProximaCita };
  }

  // ── IMC ───────────────────────────────────────────────────────────────────
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
    if (v < 18.5) return 'Bajo peso'; if (v < 25) return 'Normal';
    if (v < 30)   return 'Sobrepeso'; return 'Obesidad';
  }

  imcClase(): string {
    const v = this.imc();
    if (!v) return '';
    if (v < 18.5) return 'imc-bajo'; if (v < 25) return 'imc-normal';
    if (v < 30)   return 'imc-sobrepeso'; return 'imc-obesidad';
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
