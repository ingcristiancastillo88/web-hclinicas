import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule }     from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule }   from 'primeng/inputnumber';
import { ButtonModule }        from 'primeng/button';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { MessageService }      from 'primeng/api';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { Paciente } from '../../../core/models';


@Component({
  selector: 'app-historia-antecedentes',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    InputTextModule, TextareaModule, InputNumberModule,
    ButtonModule, ToastModule, DividerModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="page-header">
      <div class="page-title">
        <div class="page-icon"><i class="pi pi-file-plus"></i></div>
        <div>
          <h2>{{ esEdicion() ? 'Editar Antecedentes' : 'Crear Historia Clínica' }}</h2>
          @if (paciente()) {
            <p>Paciente: <strong>{{ paciente()!.nombreCompleto }}</strong>
               · C.I. {{ paciente()!.cedula }}</p>
          }
        </div>
      </div>
      <p-button label="Cancelar" icon="pi pi-arrow-left"
                [text]="true" severity="secondary" (onClick)="volver()" />
    </div>

    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <div class="section-title">
          <i class="pi pi-heart"></i> Antecedentes Gineco-Obstétricos
        </div>
        <p class="section-desc">
          Todos los campos son opcionales y pueden editarse en cualquier momento.
        </p>

        <div class="form-grid">
          <div class="field">
            <label>Menarquia</label>
            <input pInputText formControlName="menarquia"
                   placeholder="ej. 13 años" class="w-full" />
          </div>
          <div class="field">
            <label>Ciclo Menstrual</label>
            <input pInputText formControlName="cicloMenstrual"
                   placeholder="ej. Regular, 28 días" class="w-full" />
          </div>
          <div class="field">
            <label>Fecha Última Menstruación</label>
            <input pInputText formControlName="fechaUltimaMenstruacion"
                   placeholder="dd/mm/aaaa" class="w-full" />
          </div>
          <div class="field">
            <label>Método Anticonceptivo</label>
            <input pInputText formControlName="metodoAnticonceptivo"
                   placeholder="ej. DIU, Píldora, Ninguno" class="w-full" />
          </div>
          <div class="field">
            <label>Último Papanicolau</label>
            <input pInputText formControlName="ultimoPapanicolau"
                   placeholder="ej. Enero 2025 — Normal" class="w-full" />
          </div>
          <div class="field">
            <label>Última Mamografía</label>
            <input pInputText formControlName="ultimaMamografia"
                   placeholder="ej. Marzo 2024 — Normal" class="w-full" />
          </div>
        </div>

        <p-divider align="left">
          <span class="div-label">
            <i class="pi pi-users"></i> Fórmula Obstétrica (G P C A HV)
          </span>
        </p-divider>

        <div class="formula-grid">
          <div class="formula-item">
            <span class="letra">G</span>
            <div class="field">
              <label>Gestas</label>
              <p-inputNumber formControlName="gestas" [min]="0"
                             placeholder="0" styleClass="w-full" />
            </div>
          </div>
          <div class="formula-item">
            <span class="letra">P</span>
            <div class="field">
              <label>Partos</label>
              <p-inputNumber formControlName="partos" [min]="0"
                             placeholder="0" styleClass="w-full" />
            </div>
          </div>
          <div class="formula-item">
            <span class="letra">C</span>
            <div class="field">
              <label>Cesáreas</label>
              <p-inputNumber formControlName="cesareas" [min]="0"
                             placeholder="0" styleClass="w-full" />
            </div>
          </div>
          <div class="formula-item">
            <span class="letra">A</span>
            <div class="field">
              <label>Abortos</label>
              <p-inputNumber formControlName="abortos" [min]="0"
                             placeholder="0" styleClass="w-full" />
            </div>
          </div>
          <div class="formula-item">
            <span class="letra">HV</span>
            <div class="field">
              <label>Hijos Vivos</label>
              <p-inputNumber formControlName="hijosVivos" [min]="0"
                             placeholder="0" styleClass="w-full" />
            </div>
          </div>
        </div>

        @if (tieneFormula()) {
          <div class="formula-badge">
            <span class="fl">Fórmula:</span>
            <span class="fv">
              G{{ form.get('gestas')?.value ?? 0 }}
              P{{ form.get('partos')?.value ?? 0 }}
              C{{ form.get('cesareas')?.value ?? 0 }}
              A{{ form.get('abortos')?.value ?? 0 }}
              HV{{ form.get('hijosVivos')?.value ?? 0 }}
            </span>
          </div>
        }

        <p-divider />

        <div class="field">
          <label>Observaciones Generales</label>
          <textarea pInputTextarea formControlName="observacionesGenerales"
                    rows="3" class="w-full"
                    placeholder="Información adicional relevante...">
          </textarea>
        </div>

        <div class="form-actions">
          <p-button label="Cancelar" icon="pi pi-times"
                    severity="secondary" [outlined]="true" (onClick)="volver()" />
          <p-button type="submit"
                    [label]="esEdicion() ? 'Guardar Cambios' : 'Crear Historia Clínica'"
                    icon="pi pi-check"
                    [loading]="guardando()"
                    [disabled]="guardando()"
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

    .form-card { background:white; border-radius:16px; padding:2rem; box-shadow:0 2px 12px rgba(0,0,0,.07); }

    .section-title { display:flex; align-items:center; gap:8px; font-size:1rem; font-weight:700; color:#0a2342; margin-bottom:6px; }
    .section-title .pi { color:#0fb8ad; }
    .section-desc { margin:0 0 1.5rem; color:#64748b; font-size:.85rem; }

    .form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.2rem; margin-bottom:1rem; }
    .field { display:flex; flex-direction:column; gap:5px; }
    .field label { font-size:.83rem; font-weight:600; color:#334155; }

    .formula-grid { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; }
    .formula-item { display:flex; align-items:flex-end; gap:8px; flex:1; min-width:100px; }
    .letra { font-size:1.4rem; font-weight:800; color:#be185d; margin-bottom:.6rem; }

    .formula-badge { display:inline-flex; align-items:center; gap:10px; background:#fdf2f8; border:1px solid #f9a8d4; border-radius:10px; padding:10px 16px; margin-bottom:1rem; }
    .fl { font-size:.82rem; color:#9d174d; font-weight:600; }
    .fv { font-size:1.1rem; font-weight:800; color:#be185d; letter-spacing:2px; font-family:monospace; }

    :deep(.p-divider-content) { background:white; }
    .div-label { display:flex; align-items:center; gap:6px; font-size:.85rem; font-weight:700; color:#334155; }
    .div-label .pi { color:#0fb8ad; }

    :deep(textarea.p-inputtextarea) { border-radius:10px !important; resize:vertical; }
    :deep(.p-inputnumber) { width:100%; }
    :deep(.p-inputnumber-input) { width:100%; border-radius:10px !important; }

    .form-actions { display:flex; justify-content:flex-end; gap:1rem; margin-top:1.5rem; flex-wrap:wrap; }
  `]
})
export class HistoriaAntecedentesComponent implements OnInit {

  private fb              = inject(FormBuilder);
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private historiaService = inject(HistoriaClinicaService);
  private pacienteService = inject(PacienteService);
  private toast           = inject(MessageService);

  guardando  = signal(false);
  paciente   = signal<Paciente | null>(null);
  pacienteId = signal<number | null>(null);
  historiaId = signal<number | null>(null);
  esEdicion  = signal(false);

  form: FormGroup = this.fb.group({
    menarquia:               [''],
    cicloMenstrual:          [''],
    fechaUltimaMenstruacion: [''],
    metodoAnticonceptivo:    [''],
    ultimoPapanicolau:       [''],
    ultimaMamografia:        [''],
    gestas:    [null], partos:    [null],
    cesareas:  [null], abortos:   [null],
    hijosVivos:[null],
    observacionesGenerales:  [''],
  });

  tieneFormula(): boolean {
    const f = this.form.value;
    return ['gestas','partos','cesareas','abortos','hijosVivos']
      .some(k => f[k] != null && f[k] >= 0);
  }

  ngOnInit(): void {
    // Modo edición: viene con ?historiaId=X
    const hId = this.route.snapshot.queryParamMap.get('historiaId');
    // Modo creación: viene con ?pacienteId=X
    const pId = this.route.snapshot.queryParamMap.get('pacienteId');

    if (hId) {
      this.esEdicion.set(true);
      this.historiaId.set(Number(hId));
      this.historiaService.obtenerPorId(Number(hId)).subscribe({
        next: r => {
          if (!r.data) return;
          this.pacienteId.set(r.data.pacienteId);
          this.cargarPaciente(r.data.pacienteId);
          this.form.patchValue(r.data);
        }
      });
    } else if (pId) {
      this.pacienteId.set(Number(pId));
      this.cargarPaciente(Number(pId));
    } else {
      this.router.navigate(['/historias']);
    }
  }

  cargarPaciente(id: number): void {
    this.pacienteService.obtener(id).subscribe({
      next: r => this.paciente.set(r.data)
    });
  }

  onSubmit(): void {
    this.guardando.set(true);
    const req = { pacienteId: this.pacienteId()!, ...this.form.value };

    this.historiaService.crearOActualizar(req).subscribe({
      next: r => {
        this.toast.add({ severity:'success', summary:'Historia guardada',
          detail: this.esEdicion() ? 'Antecedentes actualizados' : 'Historia clínica creada' });
        setTimeout(() =>
          this.router.navigate(['/historias/paciente', this.pacienteId()]), 900);
        this.guardando.set(false);
      },
      error: err => {
        this.toast.add({ severity:'error', summary:'Error',
          detail: err.error?.mensaje ?? 'No se pudo guardar' });
        this.guardando.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/historias/paciente', this.pacienteId()]);
  }
}
