import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ButtonModule }  from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { TagModule }     from 'primeng/tag';
import { ToastModule }   from 'primeng/toast';
import { SkeletonModule }from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PacienteService } from '../../../core/services/paciente.service';
import { Paciente } from '../../../core/models';

@Component({
  selector: 'app-paciente-detalle',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    ButtonModule, TabViewModule, TagModule,
    ToastModule, SkeletonModule, DividerModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        @if (cargando()) {
          <p-skeleton width="3rem" height="3rem" borderRadius="14px" />
          <div>
            <p-skeleton width="16rem" height="1.4rem" />
            <p-skeleton width="10rem" height="1rem" styleClass="mt-1" />
          </div>
        } @else if (paciente()) {
          <div class="pac-avatar">
            {{ getInitials(paciente()!) }}
          </div>
          <div>
            <h2>{{ paciente()!.nombreCompleto }}</h2>
            <p>
              Cédula: <strong>{{ paciente()!.cedula }}</strong>
              @if (paciente()!.historiaNumero) {
                · Historia: <strong>{{ paciente()!.historiaNumero }}</strong>
              }
              @if (paciente()!.edad != null) {
                · <strong>{{ paciente()!.edad }} años</strong>
              }
            </p>
          </div>
        }
      </div>
      <div class="header-actions">
        @if (paciente()) {
          <a [routerLink]="['/pacientes/editar', paciente()!.id]">
            <p-button label="Editar" icon="pi pi-pencil" severity="info" [outlined]="true" />
          </a>
          @if (paciente()!.estado === 'ACTIVO') {
            <p-button label="Desactivar" icon="pi pi-ban"
                      severity="warn" [outlined]="true"
                      (onClick)="confirmarDesactivar()" />
          } @else {
            <p-button label="Activar" icon="pi pi-check"
                      severity="success" [outlined]="true"
                      (onClick)="activar()" />
          }
        }
        <a routerLink="/pacientes">
          <p-button label="Volver" icon="pi pi-arrow-left"
                    [text]="true" severity="secondary" />
        </a>
      </div>
    </div>

    <!-- Detalle -->
    @if (cargando()) {
      <div class="detail-card">
        @for (i of [1,2,3,4,5,6]; track i) {
          <p-skeleton height="2rem" styleClass="mb-3" />
        }
      </div>
    } @else if (paciente()) {
      <div class="detail-card">

        <!-- Estado badge -->
        <div class="estado-header">
          <span class="estado-badge" [class]="'estado-' + paciente()!.estado.toLowerCase()">
            <i [class]="'pi ' + (paciente()!.estado === 'ACTIVO'
                ? 'pi-check-circle' : 'pi-times-circle')"></i>
            {{ paciente()!.estado }}
          </span>
          @if (paciente()!.grupoSanguineo) {
            <span class="sangre-badge">
              🩸 {{ formatGrupoSanguineo(paciente()!.grupoSanguineo!) }}
            </span>
          }
          <span class="audit-info">
            Registrado por <strong>{{ paciente()!.creadoPor }}</strong>
            el {{ paciente()!.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}
          </span>
        </div>

        <p-divider />

        <p-tabView>

          <!-- Pestaña 1: Datos Personales -->
          <p-tabPanel header="Datos Personales">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label"><i class="pi pi-id-card"></i> Cédula</span>
                <span class="info-value code">{{ paciente()!.cedula }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-file"></i> N° Historia</span>
                <span class="info-value code">{{ paciente()!.historiaNumero ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-calendar"></i> Fecha de Nacimiento</span>
                <span class="info-value">
                  {{ paciente()!.fechaNacimiento
                    ? (paciente()!.fechaNacimiento | date:'dd/MM/yyyy') + ' (' + paciente()!.edad + ' años)'
                    : '—' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-map-marker"></i> Lugar de Nacimiento</span>
                <span class="info-value">{{ paciente()!.lugarNacimiento ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-globe"></i> Nacionalidad</span>
                <span class="info-value">{{ paciente()!.nacionalidad ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-heart"></i> Estado Civil</span>
                <span class="info-value">{{ formatEstadoCivil(paciente()!.estadoCivil) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-book"></i> Instrucción</span>
                <span class="info-value">{{ paciente()!.instruccion ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-briefcase"></i> Ocupación</span>
                <span class="info-value">{{ paciente()!.ocupacion ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-star"></i> Religión</span>
                <span class="info-value">{{ paciente()!.religion ?? '—' }}</span>
              </div>
            </div>
          </p-tabPanel>

          <!-- Pestaña 2: Contacto -->
          <p-tabPanel header="Contacto">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label"><i class="pi pi-envelope"></i> Correo</span>
                <span class="info-value">{{ paciente()!.correo ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-mobile"></i> Celular</span>
                <span class="info-value">{{ paciente()!.celular ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-phone"></i> Teléfono</span>
                <span class="info-value">{{ paciente()!.telefono ?? '—' }}</span>
              </div>
              <div class="info-item info-full">
                <span class="info-label"><i class="pi pi-map"></i> Dirección</span>
                <span class="info-value">{{ paciente()!.direccion ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-building"></i> Ciudad</span>
                <span class="info-value">{{ paciente()!.ciudad ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label"><i class="pi pi-map-marker"></i> Provincia</span>
                <span class="info-value">{{ paciente()!.provincia ?? '—' }}</span>
              </div>
            </div>

            <p-divider />

            <div class="section-sub">
              <i class="pi pi-exclamation-triangle"></i> Contacto de Emergencia
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nombre</span>
                <span class="info-value">
                  {{ paciente()!.contactoEmergenciaNombre ?? '—' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Parentesco</span>
                <span class="info-value">
                  {{ paciente()!.contactoEmergenciaParentesco ?? '—' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Teléfono</span>
                <span class="info-value">
                  {{ paciente()!.contactoEmergenciaTelefono ?? '—' }}
                </span>
              </div>
            </div>
          </p-tabPanel>

          <!-- Pestaña 3: Antecedentes -->
          <p-tabPanel header="Antecedentes Médicos">
            <div class="antecedentes-grid">

              <div class="antecedente-card alergias">
                <div class="ant-header">
                  <i class="pi pi-exclamation-circle"></i> Alergias
                </div>
                <p>{{ paciente()!.alergias || 'Sin alergias registradas' }}</p>
              </div>

              <div class="antecedente-card personales">
                <div class="ant-header">
                  <i class="pi pi-user"></i> Antecedentes Personales
                </div>
                <p>{{ paciente()!.antecedentesPersonales || 'Sin antecedentes registrados' }}</p>
              </div>

              <div class="antecedente-card familiares">
                <div class="ant-header">
                  <i class="pi pi-users"></i> Antecedentes Familiares
                </div>
                <p>{{ paciente()!.antecedentesFamiliares || 'Sin antecedentes registrados' }}</p>
              </div>

              <div class="antecedente-card medicacion">
                <div class="ant-header">
                  <i class="pi pi-heart"></i> Medicación Actual
                </div>
                <p>{{ paciente()!.medicacionActual || 'Sin medicación registrada' }}</p>
              </div>

              @if (paciente()!.observacionesGenerales) {
                <div class="antecedente-card observaciones">
                  <div class="ant-header">
                    <i class="pi pi-comment"></i> Observaciones Generales
                  </div>
                  <p>{{ paciente()!.observacionesGenerales }}</p>
                </div>
              }

            </div>
          </p-tabPanel>

        </p-tabView>
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .page-title { display: flex; align-items: center; gap: 1rem; }

    .pac-avatar {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      color: white; font-size: 1.3rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .page-title h2 { margin: 0 0 4px; font-size: 1.4rem; font-weight: 700; color: #0a2342; }
    .page-title p  { margin: 0; color: #64748b; font-size: 0.85rem; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .detail-card {
      background: white; border-radius: 16px;
      padding: 1.5rem 2rem; box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    }

    /* Estado header */
    .estado-header {
      display: flex; align-items: center; gap: 1rem;
      flex-wrap: wrap; margin-bottom: 1rem;
    }

    .estado-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 20px;
      font-size: 0.82rem; font-weight: 700;
    }
    .estado-activo   { background: #dcfce7; color: #166534; }
    .estado-inactivo { background: #fef3c7; color: #92400e; }

    .sangre-badge {
      background: #fee2e2; color: #991b1b;
      padding: 5px 12px; border-radius: 20px;
      font-size: 0.82rem; font-weight: 700;
    }

    .audit-info {
      margin-left: auto; font-size: 0.75rem; color: #94a3b8;
    }

    /* Info grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.2rem; padding: 0.5rem 0;
    }

    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-full { grid-column: 1 / -1; }

    .info-label {
      font-size: 0.75rem; font-weight: 600;
      color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
      display: flex; align-items: center; gap: 5px;
    }
    .info-label .pi { font-size: 0.72rem; }

    .info-value {
      font-size: 0.92rem; color: #1e293b; font-weight: 500;
    }
    .info-value.code {
      font-family: monospace; background: #f1f5f9;
      padding: 2px 8px; border-radius: 6px; display: inline-block;
    }

    /* Section sub */
    .section-sub {
      font-size: 0.9rem; font-weight: 700; color: #0a2342;
      margin-bottom: 1rem; display: flex; align-items: center; gap: 6px;
    }
    .section-sub .pi { color: #f59e0b; }

    /* Antecedentes */
    .antecedentes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .antecedente-card {
      border-radius: 12px; padding: 1.2rem;
      border-left: 4px solid #e2e8f0;
    }

    .antecedente-card p {
      margin: 0.5rem 0 0; font-size: 0.88rem;
      color: #475569; line-height: 1.6; white-space: pre-wrap;
    }

    .ant-header {
      font-size: 0.85rem; font-weight: 700;
      display: flex; align-items: center; gap: 6px;
    }

    .alergias   { background: #fff7ed; border-color: #f97316; }
    .alergias .ant-header { color: #c2410c; }
    .personales { background: #eff6ff; border-color: #3b82f6; }
    .personales .ant-header { color: #1d4ed8; }
    .familiares { background: #f5f3ff; border-color: #8b5cf6; }
    .familiares .ant-header { color: #5b21b6; }
    .medicacion { background: #f0fdf4; border-color: #22c55e; }
    .medicacion .ant-header { color: #15803d; }
    .observaciones { background: #f8fafc; border-color: #64748b; }
    .observaciones .ant-header { color: #334155; }
  `]
})
export class PacienteDetalleComponent implements OnInit {

  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private pacienteService = inject(PacienteService);
  private toast          = inject(MessageService);
  private confirmService = inject(ConfirmationService);

  paciente = signal<Paciente | null>(null);
  cargando = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.cargar(Number(id));
    else this.router.navigate(['/pacientes']);
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.pacienteService.obtener(id).subscribe({
      next: res => { this.paciente.set(res.data); this.cargando.set(false); },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar el paciente' });
        this.router.navigate(['/pacientes']);
      }
    });
  }

  confirmarDesactivar(): void {
    const p = this.paciente();
    if (!p) return;
    this.confirmService.confirm({
      message: `¿Desea desactivar a <strong>${p.nombreCompleto}</strong>?`,
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.pacienteService.desactivar(p.id).subscribe({
          next: () => {
            this.toast.add({ severity: 'warn', summary: 'Desactivado',
              detail: `${p.nombreCompleto} fue desactivado` });
            this.cargar(p.id);
          }
        });
      }
    });
  }

  activar(): void {
    const p = this.paciente();
    if (!p) return;
    this.pacienteService.activar(p.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Activado',
          detail: `${p.nombreCompleto} fue activado` });
        this.cargar(p.id);
      }
    });
  }

  getInitials(p: Paciente): string {
    return p.nombreCompleto.split(' ').map(n => n[0])
      .slice(0, 2).join('').toUpperCase();
  }

  formatGrupoSanguineo(g: string): string {
    return g.replace('_POSITIVO', '+').replace('_NEGATIVO', '-');
  }

  formatEstadoCivil(e?: string): string {
    const m: Record<string, string> = {
      SOLTERO: 'Soltero/a', CASADO: 'Casado/a',
      DIVORCIADO: 'Divorciado/a', VIUDO: 'Viudo/a',
      UNION_LIBRE: 'Unión Libre'
    };
    return e ? (m[e] ?? e) : '—';
  }
}
