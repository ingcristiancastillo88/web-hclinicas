import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputTextModule }     from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule }   from 'primeng/inputnumber';
import { CalendarModule }      from 'primeng/calendar';
import { DropdownModule }      from 'primeng/dropdown';
import { ButtonModule }        from 'primeng/button';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { MessageService }      from 'primeng/api';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { CitaMedicaService } from '../../../core/services/cita-medica.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { Disponibilidad } from '../../../core/models/cita.models';
import { PacienteResumen } from '../../../core/models';

@Component({
  selector: 'app-cita-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterLink,
    InputTextModule, InputTextareaModule, InputNumberModule,
    CalendarModule, DropdownModule, ButtonModule,
    ToastModule, DividerModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon">
          <i [class]="'pi ' + (esEdicion() ? 'pi-pencil' : 'pi-calendar-plus')"></i>
        </div>
        <div>
          <h2>{{ esEdicion() ? 'Editar Cita' : 'Nueva Cita' }}</h2>
          <p>{{ esEdicion()
                ? 'Modifica los datos de la cita médica'
                : 'Registra una nueva cita en el consultorio' }}</p>
        </div>
      </div>
      <a routerLink="/citas">
        <p-button label="Volver" icon="pi pi-arrow-left"
                  [text]="true" severity="secondary" />
      </a>
    </div>

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <!-- Sección 1: Paciente -->
        <div class="section-title">
          <i class="pi pi-user"></i> Paciente
        </div>

        @if (!esEdicion()) {
          <!-- Buscador de paciente -->
          <div class="field" style="max-width:600px; margin-bottom:1.5rem">
            <label>Buscar Paciente <span class="req">*</span></label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input pInputText type="text"
                     placeholder="Nombre o cédula del paciente..."
                     [(ngModel)]="busquedaPaciente"
                     [ngModelOptions]="{standalone:true}"
                     (ngModelChange)="onBuscaPaciente($event)"
                     class="w-full" />
            </span>

            @if (resultadosPacientes().length > 0) {
              <div class="pac-dropdown">
                @for (p of resultadosPacientes(); track p.id) {
                  <div class="pac-option" (click)="seleccionarPaciente(p)">
                    <span class="pac-opt-nombre">{{ p.nombreCompleto }}</span>
                    <span class="pac-opt-cedula">{{ p.cedula }}</span>
                  </div>
                }
              </div>
            }
          </div>

          @if (pacienteSeleccionado()) {
            <div class="pac-seleccionado">
              <i class="pi pi-user-edit"></i>
              <div class="pac-sel-info">
                <span class="pac-sel-nombre">{{ pacienteSeleccionado()!.nombreCompleto }}</span>
                <span class="pac-sel-cedula">C.I. {{ pacienteSeleccionado()!.cedula }}</span>
              </div>
              <p-button icon="pi pi-times" [rounded]="true" [text]="true"
                        severity="secondary" (onClick)="limpiarPaciente()" />
            </div>
          }
        } @else {
          <!-- En edición mostramos el paciente como solo lectura -->
          <div class="pac-seleccionado readonly">
            <i class="pi pi-user"></i>
            <div class="pac-sel-info">
              <span class="pac-sel-nombre">{{ pacienteEdicion() }}</span>
              <small style="color:#94a3b8">No se puede cambiar el paciente en edición</small>
            </div>
          </div>
        }

        <p-divider />

        <!-- Sección 2: Fecha, hora y duración -->
        <div class="section-title">
          <i class="pi pi-clock"></i> Fecha y Horario
        </div>

        <div class="form-grid">

          <div class="field">
            <label>Fecha de la Cita <span class="req">*</span></label>
            <p-calendar formControlName="fechaCita"
                        [minDate]="manana"
                        [showIcon]="true"
                        dateFormat="dd/mm/yy"
                        placeholder="dd/mm/aaaa"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                        (onSelect)="onFechaCambio()" />
            @if (isInvalid('fechaCita')) {
              <small class="err">
                <i class="pi pi-exclamation-circle"></i> La fecha es obligatoria
              </small>
            }
          </div>

          <div class="field">
            <label>Hora de Inicio <span class="req">*</span></label>
            <p-calendar formControlName="horaInicio"
                        [timeOnly]="true"
                        hourFormat="24"
                        placeholder="HH:mm"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                        (onSelect)="onHoraCambio()" />
            @if (isInvalid('horaInicio')) {
              <small class="err">
                <i class="pi pi-exclamation-circle"></i> La hora es obligatoria
              </small>
            }
          </div>

          <div class="field">
            <label>Duración (minutos)</label>
            <p-dropdown formControlName="duracionMinutos"
                        [options]="opDuracion"
                        optionLabel="label" optionValue="value"
                        styleClass="w-full"
                        (onChange)="onHoraCambio()" />
          </div>

        </div>

        <!-- Verificador de disponibilidad -->
        @if (disponibilidad()) {
          <div class="disponibilidad-box" [class.disponible]="disponibilidad()!.disponible"
               [class.ocupado]="!disponibilidad()!.disponible">
            <i [class]="'pi ' + (disponibilidad()!.disponible ? 'pi-check-circle' : 'pi-times-circle')"></i>
            <div class="disp-info">
              <span class="disp-msg">{{ disponibilidad()!.mensaje }}</span>
              @if (!disponibilidad()!.disponible && disponibilidad()!.slotsOcupados?.length) {
                <div class="slots-ocupados">
                  <span class="slots-titulo">Citas del día:</span>
                  @for (s of disponibilidad()!.slotsOcupados; track s.horaInicio) {
                    <span class="slot">
                      {{ s.horaInicio }} — {{ s.horaFin }} ·
                      {{ s.pacienteNombre }}
                    </span>
                  }
                </div>
              }
            </div>
          </div>
        }

        @if (verificando()) {
          <div class="verificando">
            <i class="pi pi-spin pi-spinner"></i>
            Verificando disponibilidad...
          </div>
        }

        <p-divider />

        <!-- Sección 3: Detalles -->
        <div class="section-title">
          <i class="pi pi-info-circle"></i> Detalles de la Cita
        </div>

        <div class="form-grid">

          <div class="field">
            <label>Tipo de Cita</label>
            <p-dropdown formControlName="tipoCita"
                        [options]="opTipos"
                        optionLabel="label" optionValue="value"
                        styleClass="w-full" />
          </div>

          <div class="field field-full">
            <label>Motivo de la Cita</label>
            <textarea pInputTextarea formControlName="motivoCita"
                      rows="2" class="w-full"
                      placeholder="Motivo principal de la consulta...">
            </textarea>
          </div>

          <div class="field field-full">
            <label>Notas Adicionales</label>
            <textarea pInputTextarea formControlName="notasAdicionales"
                      rows="2" class="w-full"
                      placeholder="Información adicional para la consulta...">
            </textarea>
          </div>

        </div>

        <!-- Botones -->
        <div class="form-actions">
          <a routerLink="/citas">
            <p-button label="Cancelar" icon="pi pi-times"
                      severity="secondary" [outlined]="true" />
          </a>
          <p-button
            type="submit"
            [label]="esEdicion() ? 'Guardar Cambios' : 'Agendar Cita'"
            [icon]="esEdicion() ? 'pi pi-save' : 'pi pi-check'"
            [loading]="guardando()"
            [disabled]="!puedeGuardar()"
            styleClass="btn-primary"
          />
        </div>

      </form>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .page-title  { display:flex; align-items:center; gap:1rem; }
    .page-icon   { width:52px; height:52px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 2px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }

    .form-card { background:white; border-radius:16px; padding:2rem; box-shadow:0 2px 12px rgba(0,0,0,.07); }

    .section-title { display:flex; align-items:center; gap:8px; font-size:1rem; font-weight:700; color:#0a2342; margin-bottom:1.2rem; }
    .section-title .pi { color:#6366f1; }

    /* Buscador paciente */
    .pac-dropdown { position:absolute; z-index:999; background:white; border:1px solid #e2e8f0; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.12); width:100%; max-height:220px; overflow-y:auto; margin-top:4px; }
    .pac-option   { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; cursor:pointer; transition:background .15s; border-bottom:1px solid #f1f5f9; }
    .pac-option:hover { background:#f8fafc; }
    .pac-option:last-child { border-bottom:none; }
    .pac-opt-nombre { font-weight:600; color:#0a2342; font-size:.9rem; }
    .pac-opt-cedula { font-size:.78rem; color:#94a3b8; font-family:monospace; }

    /* Paciente seleccionado */
    .pac-seleccionado { display:flex; align-items:center; gap:1rem; background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:12px 16px; margin-bottom:1rem; }
    .pac-seleccionado .pi-user, .pac-seleccionado .pi-user-edit { font-size:1.4rem; color:#2563eb; }
    .pac-sel-info  { display:flex; flex-direction:column; gap:2px; flex:1; }
    .pac-sel-nombre { font-weight:700; color:#1e40af; font-size:.95rem; }
    .pac-sel-cedula { font-size:.78rem; color:#3b82f6; font-family:monospace; }
    .pac-seleccionado.readonly { background:#f8fafc; border-color:#e2e8f0; }
    .pac-seleccionado.readonly .pi { color:#94a3b8; }

    /* Formulario */
    .form-grid  { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1.2rem; position:relative; }
    .field-full { grid-column:1/-1; }
    .field { display:flex; flex-direction:column; gap:5px; }
    .field label { font-size:.83rem; font-weight:600; color:#334155; }
    .req  { color:#ef4444; }
    .err  { display:flex; align-items:center; gap:4px; color:#ef4444; font-size:.78rem; }

    /* Disponibilidad */
    .disponibilidad-box { display:flex; align-items:flex-start; gap:10px; padding:12px 16px; border-radius:12px; margin:1rem 0; border:2px solid; }
    .disponibilidad-box.disponible { background:#f0fdf4; border-color:#86efac; }
    .disponibilidad-box.disponible .pi { color:#16a34a; font-size:1.2rem; }
    .disponibilidad-box.ocupado { background:#fef2f2; border-color:#fca5a5; }
    .disponibilidad-box.ocupado .pi { color:#dc2626; font-size:1.2rem; }
    .disp-info { display:flex; flex-direction:column; gap:6px; }
    .disp-msg  { font-weight:600; font-size:.9rem; }
    .disponibilidad-box.disponible .disp-msg { color:#166534; }
    .disponibilidad-box.ocupado    .disp-msg { color:#991b1b; }
    .slots-ocupados { display:flex; flex-direction:column; gap:3px; }
    .slots-titulo   { font-size:.75rem; font-weight:700; color:#64748b; }
    .slot           { font-size:.78rem; color:#475569; }

    .verificando { display:flex; align-items:center; gap:6px; color:#6366f1; font-size:.85rem; padding:.5rem 0; }

    :deep(.p-divider-content) { background:white; }
    :deep(textarea.p-inputtextarea) { border-radius:10px !important; resize:vertical; }

    .form-actions { display:flex; justify-content:flex-end; gap:1rem; margin-top:1.5rem; flex-wrap:wrap; }
  `]
})
export class CitaFormComponent implements OnInit {

  private fb          = inject(FormBuilder);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private citaSvc     = inject(CitaMedicaService);
  private pacSvc      = inject(PacienteService);
  private toast       = inject(MessageService);

  esEdicion           = signal(false);
  guardando           = signal(false);
  verificando         = signal(false);
  citaId              = signal<number | null>(null);
  disponibilidad      = signal<Disponibilidad | null>(null);
  pacienteSeleccionado = signal<PacienteResumen | null>(null);
  pacienteEdicion     = signal('');
  resultadosPacientes = signal<PacienteResumen[]>([]);
  busquedaPaciente    = '';
  manana              = new Date(Date.now() + 86400000);

  private busquedaPac$ = new Subject<string>();
  private verificar$   = new Subject<void>();

  opDuracion = [
    { label:'15 minutos', value:15 },
    { label:'30 minutos', value:30 },
    { label:'45 minutos', value:45 },
    { label:'60 minutos', value:60 },
    { label:'90 minutos', value:90 },
  ];

  opTipos = [
    { label:'Primera vez', value:'PRIMERA_VEZ' },
    { label:'Control',     value:'CONTROL' },
    { label:'Urgencia',    value:'URGENCIA' },
    { label:'Prenatal',    value:'PRENATAL' },
    { label:'Postparto',   value:'POSTPARTO' },
    { label:'Resultado',   value:'RESULTADO' },
    { label:'Otro',        value:'OTRO' },
  ];

  form: FormGroup = this.fb.group({
    fechaCita:       [null, Validators.required],
    horaInicio:      [null, Validators.required],
    duracionMinutos: [30,   Validators.required],
    tipoCita:        ['CONTROL'],
    motivoCita:      [''],
    notasAdicionales:[''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('citaId');
    if (id) {
      this.esEdicion.set(true);
      this.citaId.set(Number(id));
      this.cargarCita(Number(id));
    }

    // Búsqueda reactiva de pacientes
    this.busquedaPac$.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(t => t.length >= 2 ? this.buscarPacientes(t)
                                     : this.resultadosPacientes.set([]));

    // Verificación de disponibilidad
    this.verificar$.pipe(debounceTime(500))
      .subscribe(() => this.verificarDisponibilidad());
  }

  cargarCita(id: number): void {
    this.citaSvc.obtener(id).subscribe({
      next: r => {
        if (!r.data) return;
        const c = r.data;
        this.pacienteEdicion.set(c.pacienteNombreCompleto);
        this.form.patchValue({
          fechaCita:       new Date(c.fechaCita + 'T00:00:00'),
          horaInicio:      c.horaInicio ? this.strToDate(c.horaInicio) : null,
          duracionMinutos: c.duracionMinutos,
          tipoCita:        c.tipoCita,
          motivoCita:      c.motivoCita ?? '',
          notasAdicionales:c.notasAdicionales ?? '',
        });
      },
      error: () => {
        this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo cargar la cita' });
        this.router.navigate(['/citas']);
      }
    });
  }

  onBuscaPaciente(t: string): void { this.busquedaPac$.next(t); }

  buscarPacientes(t: string): void {
    this.pacSvc.listar(t, 0, 8, true).subscribe({
      next: r => this.resultadosPacientes.set(r.data?.contenido ?? [])
    });
  }

  seleccionarPaciente(p: PacienteResumen): void {
    this.pacienteSeleccionado.set(p);
    this.busquedaPaciente = '';
    this.resultadosPacientes.set([]);
  }

  limpiarPaciente(): void {
    this.pacienteSeleccionado.set(null);
    this.busquedaPaciente = '';
  }

  onFechaCambio(): void  { this.disponibilidad.set(null); this.verificar$.next(); }
  onHoraCambio(): void   { this.disponibilidad.set(null); this.verificar$.next(); }

  verificarDisponibilidad(): void {
    const fecha   = this.form.get('fechaCita')?.value;
    const hora    = this.form.get('horaInicio')?.value;
    const duracion = this.form.get('duracionMinutos')?.value ?? 30;
    if (!fecha || !hora) return;

    const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : fecha;
    const horaStr  = hora instanceof Date
      ? hora.toTimeString().slice(0,5)
      : hora;

    this.verificando.set(true);
    this.citaSvc.verificarDisponibilidad(fechaStr, horaStr, duracion).subscribe({
      next: r => { this.disponibilidad.set(r.data); this.verificando.set(false); },
      error: () => this.verificando.set(false)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.esEdicion() && !this.pacienteSeleccionado()) {
      this.toast.add({ severity:'warn', summary:'Paciente requerido',
        detail:'Selecciona un paciente para agendar la cita' });
      return;
    }

    this.guardando.set(true);
    const v = this.form.value;

    const fechaStr = v.fechaCita instanceof Date
      ? v.fechaCita.toISOString().split('T')[0]
      : v.fechaCita;

    const horaStr = v.horaInicio instanceof Date
      ? v.horaInicio.toTimeString().slice(0,5)
      : v.horaInicio;

    if (this.esEdicion()) {
      this.citaSvc.actualizar(this.citaId()!, {
        fechaCita:        fechaStr,
        horaInicio:       horaStr,
        duracionMinutos:  v.duracionMinutos,
        tipoCita:         v.tipoCita,
        motivoCita:       v.motivoCita,
        notasAdicionales: v.notasAdicionales,
      }).subscribe({
        next: r => {
          this.toast.add({ severity:'success', summary:'Guardado', detail:'Cita actualizada exitosamente' });
          setTimeout(() => this.router.navigate(['/citas', r.data.id]), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error',
            detail: err.error?.mensaje ?? 'No se pudo actualizar' });
          this.guardando.set(false);
        }
      });
    } else {
      this.citaSvc.crear({
        pacienteId:       this.pacienteSeleccionado()!.id,
        fechaCita:        fechaStr,
        horaInicio:       horaStr,
        duracionMinutos:  v.duracionMinutos,
        tipoCita:         v.tipoCita,
        motivoCita:       v.motivoCita,
        notasAdicionales: v.notasAdicionales,
      }).subscribe({
        next: r => {
          this.toast.add({ severity:'success', summary:'Agendada', detail:'Cita agendada exitosamente' });
          setTimeout(() => this.router.navigate(['/citas', r.data.id]), 900);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error',
            detail: err.error?.mensaje ?? 'No se pudo agendar' });
          this.guardando.set(false);
        }
      });
    }
  }

  puedeGuardar(): boolean {
    if (this.form.invalid || this.guardando()) return false;
    if (!this.esEdicion() && !this.pacienteSeleccionado()) return false;
    if (this.disponibilidad() && !this.disponibilidad()!.disponible) return false;
    return true;
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c?.touched);
  }

  private strToDate(time: string): Date {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
}