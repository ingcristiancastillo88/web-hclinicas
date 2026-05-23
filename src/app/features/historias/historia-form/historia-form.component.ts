import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputTextModule }     from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule }   from 'primeng/inputnumber';
import { CalendarModule }      from 'primeng/calendar';
import { ButtonModule }        from 'primeng/button';
import { TabViewModule }       from 'primeng/tabview';
import { FileUploadModule }    from 'primeng/fileupload';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { DropdownModule }      from 'primeng/dropdown';
import { MessageService }      from 'primeng/api';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';


@Component({
  selector: 'app-historia-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    InputTextModule, InputTextareaModule, InputNumberModule,
    CalendarModule, ButtonModule, TabViewModule,
    FileUploadModule, ToastModule, DividerModule, DropdownModule,
    FormsModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon">
          <i [class]="'pi ' + (esEdicion() ? 'pi-pencil' : 'pi-plus')"></i>
        </div>
        <div>
          <h2>{{ esEdicion() ? 'Editar Consulta' : 'Nueva Consulta' }}</h2>
          <p>{{ esEdicion()
                ? 'Actualiza los datos de la consulta médica'
                : 'Registra una nueva consulta en la historia clínica' }}</p>
        </div>
      </div>
      <p-button label="Cancelar" icon="pi pi-times"
                [text]="true" severity="secondary"
                (onClick)="volver()" />
    </div>

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <p-tabView styleClass="form-tabs">

          <!-- ── Tab 1: Datos Generales ── -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-calendar tab-icon"></i>Datos Generales</span>
            </ng-template>

            <div class="form-grid">

              <div class="field required-field">
                <label>Fecha de Consulta <span class="req">*</span></label>
                <p-calendar formControlName="fechaConsulta"
                            [maxDate]="hoy" [showIcon]="true"
                            dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa"
                            styleClass="w-full" inputStyleClass="w-full" />
                @if (isInvalid('fechaConsulta')) {
                  <small class="err"><i class="pi pi-exclamation-circle"></i>
                    La fecha es obligatoria</small>
                }
              </div>

              <div class="field field-full required-field">
                <label>Motivo de Consulta <span class="req">*</span></label>
                <textarea pInputTextarea formControlName="motivoConsulta"
                          rows="2" class="w-full"
                          placeholder="Describa el motivo principal de la consulta...">
                </textarea>
                @if (isInvalid('motivoConsulta')) {
                  <small class="err"><i class="pi pi-exclamation-circle"></i>
                    El motivo es obligatorio</small>
                }
              </div>

            </div>

            <p-divider align="left">
              <span class="divider-label">
                <i class="pi pi-heart"></i> Signos Vitales
              </span>
            </p-divider>

            <div class="form-grid">

              <div class="field">
                <label>Peso (kg)</label>
                <p-inputNumber formControlName="peso" [minFractionDigits]="1"
                               [maxFractionDigits]="1" placeholder="65.5"
                               styleClass="w-full" />
              </div>

              <div class="field">
                <label>Talla (cm)</label>
                <p-inputNumber formControlName="talla" [minFractionDigits]="1"
                               [maxFractionDigits]="1" placeholder="165.0"
                               styleClass="w-full" />
              </div>

              <div class="field">
                <label>Presión Arterial</label>
                <input pInputText formControlName="presionArterial"
                       placeholder="120/80" class="w-full" />
              </div>

              <div class="field">
                <label>Frecuencia Cardíaca (lpm)</label>
                <p-inputNumber formControlName="frecuenciaCardiaca"
                               placeholder="72" styleClass="w-full" />
              </div>

              <div class="field">
                <label>Temperatura (°C)</label>
                <p-inputNumber formControlName="temperatura"
                               [minFractionDigits]="1" [maxFractionDigits]="1"
                               placeholder="36.5" styleClass="w-full" />
              </div>

              <div class="field">
                <label>Saturación O₂ (%)</label>
                <p-inputNumber formControlName="saturacionOxigeno"
                               placeholder="98" [min]="0" [max]="100"
                               styleClass="w-full" />
              </div>

              <div class="field">
                <label>Semanas de Gestación</label>
                <p-inputNumber formControlName="semanasGestacion"
                               placeholder="0 (si aplica)"
                               styleClass="w-full" />
              </div>

              <!-- IMC calculado -->
              @if (imc()) {
                <div class="field">
                  <label>IMC (calculado)</label>
                  <div class="imc-display" [class]="imcClase()">
                    <span class="imc-valor">{{ imc() }}</span>
                    <span class="imc-label">{{ imcLabel() }}</span>
                  </div>
                </div>
              }

            </div>

          </p-tabPanel>

          <!-- ── Tab 2: Diagnóstico y Tratamiento ── -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-check-circle tab-icon"></i>Diagnóstico</span>
            </ng-template>

            <div class="form-grid-single">

              <div class="field">
                <label>Examen Físico</label>
                <textarea pInputTextarea formControlName="examenFisico"
                          rows="3" class="w-full"
                          placeholder="Descripción del examen físico realizado...">
                </textarea>
              </div>

              <div class="field required-field">
                <label>Diagnóstico Principal <span class="req">*</span></label>
                <textarea pInputTextarea formControlName="diagnosticoPrincipal"
                          rows="2" class="w-full"
                          placeholder="Diagnóstico principal de la consulta...">
                </textarea>
                @if (isInvalid('diagnosticoPrincipal')) {
                  <small class="err"><i class="pi pi-exclamation-circle"></i>
                    El diagnóstico principal es obligatorio</small>
                }
              </div>

              <div class="field">
                <label>Diagnóstico Secundario</label>
                <textarea pInputTextarea formControlName="diagnosticoSecundario"
                          rows="2" class="w-full"
                          placeholder="Diagnóstico secundario (si aplica)...">
                </textarea>
              </div>

              <div class="field">
                <label>Código CIE-10</label>
                <input pInputText formControlName="codigoCie10"
                       placeholder="ej. O80, N95.1" class="w-full"
                       style="max-width: 220px" />
              </div>

            </div>

            <p-divider align="left">
              <span class="divider-label">
                <i class="pi pi-heart"></i> Tratamiento
              </span>
            </p-divider>

            <div class="form-grid-single">

              <div class="field">
                <label>Tratamiento Indicado</label>
                <textarea pInputTextarea formControlName="tratamiento"
                          rows="3" class="w-full"
                          placeholder="Describa el tratamiento indicado...">
                </textarea>
              </div>

              <div class="field">
                <label>Medicación</label>
                <textarea pInputTextarea formControlName="medicacion"
                          rows="3" class="w-full"
                          placeholder="Medicamentos, dosis y frecuencia...">
                </textarea>
              </div>

              <div class="field">
                <label>Indicaciones para el Paciente</label>
                <textarea pInputTextarea formControlName="indicaciones"
                          rows="2" class="w-full"
                          placeholder="Indicaciones de cuidado en casa...">
                </textarea>
              </div>

              <div class="field">
                <label>Próxima Cita</label>
                <p-calendar formControlName="proximaCita"
                            [minDate]="hoy" [showIcon]="true"
                            dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa"
                            styleClass="w-full" inputStyleClass="w-full" />
              </div>

              <div class="field">
                <label>Observaciones Adicionales</label>
                <textarea pInputTextarea formControlName="observaciones"
                          rows="2" class="w-full"
                          placeholder="Cualquier observación adicional...">
                </textarea>
              </div>

            </div>
          </p-tabPanel>

          <!-- ── Tab 3: Archivos Adjuntos ── -->
          @if (esEdicion()) {
            <p-tabPanel>
              <ng-template pTemplate="header">
                <span>
                  <i class="pi pi-paperclip tab-icon"></i>Archivos
                  @if (archivosSubidos() > 0) {
                    <span class="tab-badge">{{ archivosSubidos() }}</span>
                  }
                </span>
              </ng-template>

              <div class="archivos-section">

                <div class="upload-area">
                  <p-fileUpload
                    mode="advanced"
                    [multiple]="true"
                    accept=".jpg,.jpeg,.png,.pdf,.docx,.doc,.xlsx"
                    [maxFileSize]="10485760"
                    chooseLabel="Seleccionar archivos"
                    uploadLabel="Subir"
                    cancelLabel="Cancelar"
                    (onSelect)="onFileSelect($event)"
                    (onClear)="archivosSeleccionados.set([])"
                    styleClass="upload-custom"
                  >
                    <ng-template pTemplate="empty">
                      <div class="upload-placeholder">
                        <i class="pi pi-cloud-upload"></i>
                        <p>Arrastra archivos aquí o haz clic para seleccionar</p>
                        <small>JPG, PNG, PDF, DOCX, XLSX · Máx 10 MB por archivo</small>
                      </div>
                    </ng-template>
                  </p-fileUpload>

                  @if (archivosSeleccionados().length > 0) {
                    <div class="tipo-selector">
                      <label>Tipo de archivo</label>
                      <p-dropdown
                        [(ngModel)]="tipoArchivoSeleccionado"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="opcionesTipoArchivo"
                        optionLabel="label"
                        optionValue="value"
                        styleClass="w-full"
                      />
                    </div>
                    <p-button
                      label="Subir {{ archivosSeleccionados().length }} archivo(s)"
                      icon="pi pi-upload"
                      styleClass="btn-primary"
                      [loading]="subiendoArchivos()"
                      (onClick)="subirArchivos()"
                    />
                  }
                </div>

              </div>
            </p-tabPanel>
          }

        </p-tabView>

        <!-- Botones de acción -->
        <div class="form-actions">
          <p-button label="Cancelar" icon="pi pi-times"
                    severity="secondary" [outlined]="true"
                    (onClick)="volver()" />
          <p-button
            type="submit"
            [label]="esEdicion() ? 'Guardar Cambios' : 'Registrar Consulta'"
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
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem;
    }
    .page-title { display: flex; align-items: center; gap: 1rem; }
    .page-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #0fb8ad, #2d7dd2);
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
    }
    .page-icon .pi { font-size: 1.4rem; color: white; }
    .page-title h2 { margin: 0 0 2px; font-size: 1.4rem; font-weight: 700; color: #0a2342; }
    .page-title p  { margin: 0; color: #64748b; font-size: 0.85rem; }

    .form-card {
      background: white; border-radius: 16px;
      padding: 0 0 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.07); overflow: hidden;
    }

    :deep(.form-tabs .p-tabview-panels) { padding: 1.5rem 2rem; }
    :deep(.form-tabs .p-tabview-nav)    { padding: 0 1.5rem; background: #f8fafc; }
    :deep(.form-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
      color: #0fb8ad; border-color: #0fb8ad;
    }

    .tab-icon { margin-right: 6px; }
    .tab-badge {
      background: #0fb8ad; color: white;
      font-size: 0.7rem; font-weight: 700;
      padding: 1px 6px; border-radius: 20px; margin-left: 5px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.2rem;
    }
    .form-grid-single { display: flex; flex-direction: column; gap: 1.2rem; }
    .field-full { grid-column: 1 / -1; }

    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 0.83rem; font-weight: 600; color: #334155; }
    .req { color: #ef4444; }
    .err {
      display: flex; align-items: center; gap: 4px;
      color: #ef4444; font-size: 0.78rem;
    }

    /* Divisor */
    :deep(.p-divider-content) { background: white; }
    .divider-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.85rem; font-weight: 700; color: #334155;
    }
    .divider-label .pi { color: #0fb8ad; }

    /* IMC */
    .imc-display {
      display: flex; align-items: center; gap: 8px;
      padding: 0.6rem 1rem; border-radius: 10px;
      border: 2px solid #e2e8f0;
    }
    .imc-normal  { border-color: #16a34a; background: #f0fdf4; }
    .imc-bajo    { border-color: #2563eb; background: #eff6ff; }
    .imc-sobrepeso { border-color: #d97706; background: #fffbeb; }
    .imc-obesidad  { border-color: #dc2626; background: #fef2f2; }
    .imc-valor { font-size: 1.4rem; font-weight: 800; color: #0a2342; }
    .imc-label { font-size: 0.78rem; color: #64748b; }

    /* Archivos */
    .archivos-section { display: flex; flex-direction: column; gap: 1rem; }
    .upload-area { display: flex; flex-direction: column; gap: 1rem; }
    :deep(.upload-custom) { width: 100%; }
    .upload-placeholder {
      display: flex; flex-direction: column; align-items: center;
      padding: 2rem; color: #94a3b8; text-align: center;
    }
    .upload-placeholder .pi { font-size: 2.5rem; margin-bottom: 0.5rem; color: #cbd5e1; }
    .upload-placeholder p  { margin: 0 0 4px; font-size: 0.9rem; }
    .upload-placeholder small { font-size: 0.78rem; }

    .tipo-selector { display: flex; flex-direction: column; gap: 5px; }
    .tipo-selector label { font-size: 0.83rem; font-weight: 600; color: #334155; }

    :deep(textarea.p-inputtextarea) { border-radius: 10px !important; resize: vertical; }
    :deep(.p-inputnumber) { width: 100%; }
    :deep(.p-inputnumber-input) { width: 100%; border-radius: 10px !important; }

    .form-actions {
      display: flex; justify-content: flex-end;
      gap: 1rem; padding: 0 2rem; flex-wrap: wrap;
    }
  `]
})
export class HistoriaFormComponent implements OnInit {

  private fb             = inject(FormBuilder);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private historiaService = inject(HistoriaClinicaService);
  private toast          = inject(MessageService);

  esEdicion             = signal(false);
  guardando             = signal(false);
  subiendoArchivos      = signal(false);
  consultaId            = signal<number | null>(null);
  historiaId            = signal<number | null>(null);
  archivosSeleccionados = signal<File[]>([]);
  archivosSubidos       = signal(0);
  tipoArchivoSeleccionado = 'OTRO';
  hoy = new Date();

  opcionesTipoArchivo = [
    { label: 'Imagen',              value: 'IMAGEN' },
    { label: 'Documento',           value: 'DOCUMENTO' },
    { label: 'Receta',              value: 'RECETA' },
    { label: 'Resultado laboratorio', value: 'RESULTADO_LABORATORIO' },
    { label: 'Ecografía',           value: 'ECOGRAFIA' },
    { label: 'Otro',                value: 'OTRO' },
  ];

  form: FormGroup = this.fb.group({
    fechaConsulta:       [new Date(), Validators.required],
    motivoConsulta:      ['', Validators.required],
    peso:                [null],
    talla:               [null],
    presionArterial:     [''],
    frecuenciaCardiaca:  [null],
    temperatura:         [null],
    saturacionOxigeno:   [null],
    semanasGestacion:    [null],
    examenFisico:        [''],
    diagnosticoPrincipal:['', Validators.required],
    diagnosticoSecundario:[''],
    codigoCie10:         [''],
    tratamiento:         [''],
    medicacion:          [''],
    indicaciones:        [''],
    proximaCita:         [null],
    observaciones:       [''],
  });

  // IMC calculado en tiempo real
  imc = signal<number | null>(null);

  ngOnInit(): void {
    const consultaIdParam = this.route.snapshot.paramMap.get('consultaId');
    const historiaIdParam = this.route.snapshot.paramMap.get('historiaId');

    if (consultaIdParam) {
      this.esEdicion.set(true);
      this.consultaId.set(Number(consultaIdParam));
      this.cargarConsulta(Number(consultaIdParam));
    }

    if (historiaIdParam) {
      this.historiaId.set(Number(historiaIdParam));
    }

    // Calcular IMC cuando cambian peso/talla
    this.form.get('peso')?.valueChanges.subscribe(() => this.calcularImc());
    this.form.get('talla')?.valueChanges.subscribe(() => this.calcularImc());
  }

  cargarConsulta(id: number): void {
    this.historiaService.obtenerConsulta(id).subscribe({
      next: res => {
        if (!res.data) return;
        const c = res.data;
        this.historiaId.set(c.historiaClinicaId);
        this.archivosSubidos.set(c.totalArchivos);
        this.form.patchValue({
          ...c,
          fechaConsulta: c.fechaConsulta ? new Date(c.fechaConsulta) : null,
          proximaCita:   c.proximaCita   ? new Date(c.proximaCita)   : null,
        });
        this.calcularImc();
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar la consulta' });
        this.volver();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const raw = this.form.value;

    const toISO = (d: Date | null) => d instanceof Date
      ? d.toISOString().split('T')[0] : d;

    const payload = {
      ...raw,
      fechaConsulta: toISO(raw.fechaConsulta),
      proximaCita:   toISO(raw.proximaCita),
    };

    if (this.esEdicion()) {
      this.historiaService
        .actualizarConsulta(this.consultaId()!, payload)
        .subscribe({
          next: () => {
            this.toast.add({ severity: 'success', summary: 'Guardado',
              detail: 'Consulta actualizada exitosamente' });
            setTimeout(() => this.volver(), 900);
            this.guardando.set(false);
          },
          error: err => {
            this.toast.add({ severity: 'error', summary: 'Error',
              detail: err.error?.mensaje ?? 'No se pudo actualizar' });
            this.guardando.set(false);
          }
        });
    } else {
      const request = {
        ...payload,
        historiaClinicaId: this.historiaId()!
      };
      this.historiaService.crearConsulta(request).subscribe({
        next: res => {
          this.toast.add({ severity: 'success', summary: 'Registrada',
            detail: 'Consulta registrada exitosamente' });
          // Redirigir al detalle de la consulta creada
          setTimeout(() =>
            this.router.navigate(['/historias/consultas', res.data.id]),
            900
          );
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity: 'error', summary: 'Error',
            detail: err.error?.mensaje ?? 'No se pudo registrar' });
          this.guardando.set(false);
        }
      });
    }
  }

  onFileSelect(event: any): void {
    this.archivosSeleccionados.set(event.currentFiles ?? []);
  }

  subirArchivos(): void {
    const archivos = this.archivosSeleccionados();
    const id = this.consultaId();
    if (!archivos.length || !id) return;

    this.subiendoArchivos.set(true);
    let subidos = 0;

    archivos.forEach(file => {
      this.historiaService.subirArchivo(
        id, file, this.tipoArchivoSeleccionado, ''
      ).subscribe({
        next: () => {
          subidos++;
          if (subidos === archivos.length) {
            this.subiendoArchivos.set(false);
            this.archivosSeleccionados.set([]);
            this.archivosSubidos.update(n => n + subidos);
            this.toast.add({ severity: 'success', summary: 'Archivos subidos',
              detail: `${subidos} archivo(s) subido(s) exitosamente` });
          }
        },
        error: () => {
          this.subiendoArchivos.set(false);
          this.toast.add({ severity: 'error', summary: 'Error',
            detail: 'No se pudo subir: ' + file.name });
        }
      });
    });
  }

  calcularImc(): void {
    const peso  = this.form.get('peso')?.value;
    const talla = this.form.get('talla')?.value;
    if (!peso || !talla || talla === 0) { this.imc.set(null); return; }
    const tallaM = talla / 100;
    this.imc.set(Math.round((peso / (tallaM * tallaM)) * 100) / 100);
  }

  imcLabel(): string {
    const v = this.imc();
    if (!v) return '';
    if (v < 18.5) return 'Bajo peso';
    if (v < 25)   return 'Normal';
    if (v < 30)   return 'Sobrepeso';
    return 'Obesidad';
  }

  imcClase(): string {
    const v = this.imc();
    if (!v) return '';
    if (v < 18.5) return 'imc-bajo';
    if (v < 25)   return 'imc-normal';
    if (v < 30)   return 'imc-sobrepeso';
    return 'imc-obesidad';
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  volver(): void {
    const hId = this.historiaId();
    if (hId) {
      // Navegar de vuelta al historial del paciente
      this.historiaService.obtenerPorId(hId).subscribe({
        next: res => {
          if (res.data?.pacienteId) {
            this.router.navigate(['/historias/paciente', res.data.pacienteId]);
          } else {
            this.router.navigate(['/pacientes']);
          }
        },
        error: () => this.router.navigate(['/pacientes'])
      });
    } else {
      this.router.navigate(['/pacientes']);
    }
  }
}