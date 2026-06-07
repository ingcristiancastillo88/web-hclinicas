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
import { DropdownModule }      from 'primeng/dropdown';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { MessageService }      from 'primeng/api';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';

@Component({
  selector: 'app-historia-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    InputTextModule, InputTextareaModule, InputNumberModule,
    CalendarModule, ButtonModule, TabViewModule,
    FileUploadModule, DropdownModule, ToastModule, DividerModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="page-header">
      <div class="page-title">
        <div class="page-icon">
          <i [class]="'pi ' + (esEdicion() ? 'pi-pencil' : 'pi-plus')"></i>
        </div>
        <div>
          <h2>{{ esEdicion() ? 'Editar Consulta' : 'Nueva Consulta' }}</h2>
          <p>{{ esEdicion() ? 'Actualiza los datos de la consulta' : 'Registra una nueva consulta médica' }}</p>
        </div>
      </div>
      <p-button label="Cancelar" icon="pi pi-times"
                [text]="true" severity="secondary" (onClick)="volver()" />
    </div>

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <p-tabView styleClass="form-tabs">

          <!-- Tab 1: Datos Generales + Signos Vitales -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-calendar tab-i"></i>Datos Generales</span>
            </ng-template>

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

              <div class="field field-full req-field">
                <label>Motivo de Consulta <span class="req">*</span></label>
                <textarea pInputTextarea formControlName="motivoConsulta"
                          rows="2" class="w-full"
                          placeholder="Motivo principal de la consulta...">
                </textarea>
                @if (isInvalid('motivoConsulta')) {
                  <small class="err"><i class="pi pi-exclamation-circle"></i> Obligatorio</small>
                }
              </div>
            </div>

            <p-divider align="left">
              <span class="div-lbl"><i class="pi pi-heart"></i> Signos Vitales</span>
            </p-divider>

            <div class="form-grid">
              <div class="field">
                <label>Peso (kg)</label>
                <p-inputNumber formControlName="peso" [minFractionDigits]="1"
                               [maxFractionDigits]="1" placeholder="65.0"
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
                               [minFractionDigits]="1" placeholder="36.5"
                               styleClass="w-full" />
              </div>
              <div class="field">
                <label>Saturación O₂ (%)</label>
                <p-inputNumber formControlName="saturacionOxigeno"
                               [min]="0" [max]="100" placeholder="98"
                               styleClass="w-full" />
              </div>
              <div class="field">
                <label>Semanas de Gestación</label>
                <p-inputNumber formControlName="semanasGestacion"
                               placeholder="(si aplica)" styleClass="w-full" />
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
            </div>
          </p-tabPanel>

          <!-- Tab 2: Diagnóstico y Tratamiento -->
          <p-tabPanel>
            <ng-template pTemplate="header">
              <span><i class="pi pi-check-circle tab-i"></i>Diagnóstico</span>
            </ng-template>

            <div class="form-grid-col">
              <div class="field">
                <label>Examen Físico</label>
                <textarea pInputTextarea formControlName="examenFisico"
                          rows="3" class="w-full"
                          placeholder="Hallazgos del examen físico...">
                </textarea>
              </div>

              <div class="field req-field">
                <label>Diagnóstico Principal <span class="req">*</span></label>
                <textarea pInputTextarea formControlName="diagnosticoPrincipal"
                          rows="2" class="w-full"
                          placeholder="Diagnóstico principal...">
                </textarea>
                @if (isInvalid('diagnosticoPrincipal')) {
                  <small class="err"><i class="pi pi-exclamation-circle"></i> Obligatorio</small>
                }
              </div>

              <div class="field">
                <label>Diagnóstico Secundario</label>
                <textarea pInputTextarea formControlName="diagnosticoSecundario"
                          rows="2" class="w-full"
                          placeholder="Diagnóstico secundario (si aplica)...">
                </textarea>
              </div>

              <div class="field" style="max-width:220px">
                <label>Código CIE-10</label>
                <input pInputText formControlName="codigoCie10"
                       placeholder="ej. O80" class="w-full" />
              </div>
            </div>

            <p-divider align="left">
              <span class="div-lbl"><i class="pi pi-heart"></i> Tratamiento</span>
            </p-divider>

            <div class="form-grid-col">
              <div class="field">
                <label>Tratamiento Indicado</label>
                <textarea pInputTextarea formControlName="tratamiento"
                          rows="3" class="w-full" placeholder="Tratamiento indicado...">
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
                <label>Indicaciones para la Paciente</label>
                <textarea pInputTextarea formControlName="indicaciones"
                          rows="2" class="w-full"
                          placeholder="Indicaciones de cuidado...">
                </textarea>
              </div>
              <div class="field" style="max-width:280px">
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
                          placeholder="Observaciones adicionales...">
                </textarea>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab 3: Archivos (solo en edición) -->
          @if (esEdicion()) {
            <p-tabPanel>
              <ng-template pTemplate="header">
                <span>
                  <i class="pi pi-paperclip tab-i"></i>Archivos
                  @if (archivosSubidos() > 0) {
                    <span class="tab-bdg">{{ archivosSubidos() }}</span>
                  }
                </span>
              </ng-template>

              <p-fileUpload mode="advanced" [multiple]="true"
                            accept=".jpg,.jpeg,.png,.pdf,.docx,.doc,.xlsx"
                            [maxFileSize]="10485760"
                            chooseLabel="Seleccionar" uploadLabel="Subir"
                            cancelLabel="Cancelar"
                            (onSelect)="onFileSelect($event)"
                            (onClear)="archivosSeleccionados.set([])"
                            styleClass="upload-cust">
                <ng-template pTemplate="empty">
                  <div class="upload-ph">
                    <i class="pi pi-cloud-upload"></i>
                    <p>Arrastra archivos o haz clic para seleccionar</p>
                    <small>JPG, PNG, PDF, DOCX, XLSX · Máx. 10 MB</small>
                  </div>
                </ng-template>
              </p-fileUpload>

              @if (archivosSeleccionados().length > 0) {
                <div class="upload-actions">
                  <div class="field" style="min-width:200px">
                    <label>Tipo de archivo</label>
                    <p-dropdown
                      [(ngModel)]="tipoArchivo"
                      [ngModelOptions]="{standalone:true}"
                      [options]="opTipos" optionLabel="label" optionValue="value"
                      styleClass="w-full" />
                  </div>
                  <p-button
                    [label]="'Subir ' + archivosSeleccionados().length + ' archivo(s)'"
                    icon="pi pi-upload" styleClass="btn-primary"
                    [loading]="subiendo()" (onClick)="subirArchivos()" />
                </div>
              }
            </p-tabPanel>
          }

        </p-tabView>

        <div class="form-actions">
          <p-button label="Cancelar" icon="pi pi-times"
                    severity="secondary" [outlined]="true" (onClick)="volver()" />
          <p-button type="submit"
                    [label]="esEdicion() ? 'Guardar Cambios' : 'Registrar Consulta'"
                    [icon]="esEdicion() ? 'pi pi-save' : 'pi pi-check'"
                    [loading]="guardando()"
                    [disabled]="form.invalid || guardando()"
                    styleClass="btn-primary" />
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .page-title  { display:flex; align-items:center; gap:1rem; }
    .page-icon   { width:52px; height:52px; background:linear-gradient(135deg,#0fb8ad,#2d7dd2); border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 2px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }

    .form-card { background:white; border-radius:16px; padding:0 0 1.5rem; box-shadow:0 2px 12px rgba(0,0,0,.07); overflow:hidden; }

    :deep(.form-tabs .p-tabview-panels) { padding:1.5rem 2rem; }
    :deep(.form-tabs .p-tabview-nav)    { padding:0 1.5rem; background:#f8fafc; }
    :deep(.form-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link) { color:#0fb8ad; border-color:#0fb8ad; }

    .tab-i   { margin-right:6px; }
    .tab-bdg { background:#0fb8ad; color:white; font-size:.7rem; font-weight:700; padding:1px 6px; border-radius:20px; margin-left:5px; }

    .form-grid     { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1.2rem; }
    .form-grid-col { display:flex; flex-direction:column; gap:1.2rem; }
    .field-full    { grid-column:1/-1; }

    .field { display:flex; flex-direction:column; gap:5px; }
    .field label { font-size:.83rem; font-weight:600; color:#334155; }
    .req  { color:#ef4444; }
    .err  { display:flex; align-items:center; gap:4px; color:#ef4444; font-size:.78rem; }

    :deep(.p-divider-content) { background:white; }
    .div-lbl { display:flex; align-items:center; gap:6px; font-size:.85rem; font-weight:700; color:#334155; }
    .div-lbl .pi { color:#0fb8ad; }

    .imc-box  { display:flex; align-items:center; gap:8px; padding:.6rem 1rem; border-radius:10px; border:2px solid #e2e8f0; }
    .imc-normal    { border-color:#16a34a; background:#f0fdf4; }
    .imc-bajo      { border-color:#2563eb; background:#eff6ff; }
    .imc-sobrepeso { border-color:#d97706; background:#fffbeb; }
    .imc-obesidad  { border-color:#dc2626; background:#fef2f2; }
    .imc-v { font-size:1.4rem; font-weight:800; color:#0a2342; }
    .imc-l { font-size:.78rem; color:#64748b; }

    :deep(.upload-cust) { width:100%; margin-bottom:1rem; }
    .upload-ph { display:flex; flex-direction:column; align-items:center; padding:2rem; color:#94a3b8; text-align:center; }
    .upload-ph .pi { font-size:2.5rem; margin-bottom:.5rem; color:#cbd5e1; }
    .upload-ph p { margin:0 0 4px; font-size:.9rem; }
    .upload-ph small { font-size:.78rem; }

    .upload-actions { display:flex; align-items:flex-end; gap:1rem; flex-wrap:wrap; }

    :deep(textarea.p-inputtextarea) { border-radius:10px !important; resize:vertical; }
    :deep(.p-inputnumber) { width:100%; }
    :deep(.p-inputnumber-input) { width:100%; border-radius:10px !important; }

    .form-actions { display:flex; justify-content:flex-end; gap:1rem; padding:0 2rem; flex-wrap:wrap; }
  `]
})
export class HistoriaFormComponent implements OnInit {

  private fb      = inject(FormBuilder);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private hSvc    = inject(HistoriaClinicaService);
  private toast   = inject(MessageService);

  esEdicion             = signal(false);
  guardando             = signal(false);
  subiendo              = signal(false);
  consultaId            = signal<number | null>(null);
  historiaId            = signal<number | null>(null);
  archivosSeleccionados = signal<File[]>([]);
  archivosSubidos       = signal(0);
  tipoArchivo           = 'OTRO';
  imc                   = signal<number | null>(null);
  hoy                   = new Date();

  opTipos = [
    { label:'Imagen',               value:'IMAGEN' },
    { label:'Documento',            value:'DOCUMENTO' },
    { label:'Receta',               value:'RECETA' },
    { label:'Resultado laboratorio',value:'RESULTADO_LABORATORIO' },
    { label:'Ecografía',            value:'ECOGRAFIA' },
    { label:'Otro',                 value:'OTRO' },
  ];

  form: FormGroup = this.fb.group({
    fechaConsulta:        [new Date(), Validators.required],
    motivoConsulta:       ['',         Validators.required],
    peso:                 [null], talla:              [null],
    presionArterial:      [''],   frecuenciaCardiaca: [null],
    temperatura:          [null], saturacionOxigeno:  [null],
    semanasGestacion:     [null],
    examenFisico:         [''],
    diagnosticoPrincipal: ['',   Validators.required],
    diagnosticoSecundario:[''],  codigoCie10:        [''],
    tratamiento:          [''],  medicacion:         [''],
    indicaciones:         [''],  proximaCita:        [null],
    observaciones:        [''],
  });

  ngOnInit(): void {
    // Edición: /historias/consultas/:id/editar
    const cId = this.route.snapshot.paramMap.get('consultaId');
    // Creación: /historias/consultas/nueva?historiaId=X
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

    // IMC reactivo
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
        this.form.patchValue({
          ...r.data,
          fechaConsulta: r.data.fechaConsulta ? new Date(r.data.fechaConsulta+'T00:00:00') : null,
          proximaCita:   r.data.proximaCita   ? new Date(r.data.proximaCita+'T00:00:00')   : null,
        });
        this.calcImc();
      },
      error: () => { this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo cargar la consulta' }); this.volver(); }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);

    const raw = this.form.getRawValue();
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
          this.toast.add({ severity:'success', summary:'Registrada', detail:'Consulta registrada exitosamente' });
          setTimeout(() => this.router.navigate(['/historias/consultas', r.data.id]), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error', detail: err.error?.mensaje ?? 'Error al registrar' });
          this.guardando.set(false);
        }
      });
    }
  }

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
            this.toast.add({ severity:'success', summary:'Archivos subidos', detail:`${done} archivo(s) subido(s)` });
          }
        },
        error: () => { this.subiendo.set(false); this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo subir: ' + f.name }); }
      });
    });
  }

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
    } else {
      this.router.navigate(['/historias']);
    }
  }
}