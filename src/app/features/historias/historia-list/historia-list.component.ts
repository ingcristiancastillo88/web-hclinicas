import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { ConsultaResumen, HistoriaClinica } from '../../../core/models/historias.models';
import { Paciente } from '../../../core/models';


@Component({
    selector: 'app-historia-list',
    standalone: true,
    imports: [
        CommonModule, RouterLink,
        ButtonModule, TagModule, ToastModule,
        TooltipModule, ConfirmDialogModule,
        SkeletonModule, TimelineModule,
        CardModule, BadgeModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
    <p-toast />
    <p-confirmDialog />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon"><i class="pi pi-file-edit"></i></div>
        <div>
          @if (paciente()) {
            <h2>Historia Clínica</h2>
            <p>
              <strong>{{ paciente()!.nombreCompleto }}</strong> ·
              C.I. {{ paciente()!.cedula }} ·
              @if (paciente()!.edad) { {{ paciente()!.edad }} años · }
              {{ historia()?.totalConsultas ?? 0 }} consultas registradas
            </p>
          } @else {
            <p-skeleton width="20rem" height="1.4rem" />
            <p-skeleton width="14rem" height="1rem" styleClass="mt-1" />
          }
        </div>
      </div>
      <div class="header-actions">
        @if (historia()) {
          <a [routerLink]="['/historias', historia()!.id, 'nueva-consulta']">
            <p-button label="Nueva Consulta" icon="pi pi-plus"
                      styleClass="btn-primary" />
          </a>
          <a [routerLink]="['/historias', historia()!.id, 'antecedentes']">
            <p-button label="Antecedentes" icon="pi pi-heart"
                      [outlined]="true" severity="info" />
          </a>
        }
        <a routerLink="/pacientes">
          <p-button label="Volver" icon="pi pi-arrow-left"
                    [text]="true" severity="secondary" />
        </a>
      </div>
    </div>

    <!-- Antecedentes gineco-obstétricos (resumen) -->
    @if (historia() && tieneAntecedentes()) {
      <div class="antecedentes-banner">
        <div class="ant-title">
          <i class="pi pi-heart"></i> Antecedentes Gineco-Obstétricos
        </div>
        <div class="ant-chips">
          @if (historia()!.gestas != null) {
            <span class="ant-chip">G{{ historia()!.gestas }}</span>
          }
          @if (historia()!.partos != null) {
            <span class="ant-chip">P{{ historia()!.partos }}</span>
          }
          @if (historia()!.cesareas != null) {
            <span class="ant-chip">C{{ historia()!.cesareas }}</span>
          }
          @if (historia()!.abortos != null) {
            <span class="ant-chip">A{{ historia()!.abortos }}</span>
          }
          @if (historia()!.metodoAnticonceptivo) {
            <span class="ant-chip info">
              MAC: {{ historia()!.metodoAnticonceptivo }}
            </span>
          }
          @if (historia()!.cicloMenstrual) {
            <span class="ant-chip info">
              Ciclo: {{ historia()!.cicloMenstrual }}
            </span>
          }
          @if (historia()!.fechaUltimaMenstruacion) {
            <span class="ant-chip info">
              FUM: {{ historia()!.fechaUltimaMenstruacion }}
            </span>
          }
        </div>
      </div>
    }

    <!-- Timeline de consultas -->
    @if (cargando()) {
      <div class="skeleton-list">
        @for (i of [1,2,3]; track i) {
          <div class="skeleton-card">
            <p-skeleton width="8rem" height="1rem" />
            <p-skeleton height="1.2rem" styleClass="mt-2" />
            <p-skeleton width="70%" height="1rem" styleClass="mt-1" />
          </div>
        }
      </div>
    } @else if (consultas().length === 0) {
      <div class="empty-state">
        <div class="empty-icon"><i class="pi pi-file-edit"></i></div>
        <h3>Sin consultas registradas</h3>
        <p>Esta paciente aún no tiene consultas en su historia clínica.</p>
        @if (historia()) {
          <a [routerLink]="['/historias', historia()!.id, 'nueva-consulta']">
            <p-button label="Registrar Primera Consulta"
                      icon="pi pi-plus" styleClass="btn-primary" />
          </a>
        }
      </div>
    } @else {
      <!-- Lista de consultas cronológica -->
      <div class="consultas-list">
        @for (consulta of consultas(); track consulta.id) {
          <div class="consulta-card">

            <!-- Indicador lateral de fecha -->
            <div class="fecha-lateral">
              <span class="fecha-dia">
                {{ consulta.fechaConsulta | date:'dd' }}
              </span>
              <span class="fecha-mes">
                {{ consulta.fechaConsulta | date:'MMM':'':'es' | uppercase }}
              </span>
              <span class="fecha-anio">
                {{ consulta.fechaConsulta | date:'yyyy' }}
              </span>
            </div>

            <!-- Contenido -->
            <div class="consulta-content">
              <div class="consulta-header">
                <h3 class="motivo">{{ consulta.motivoConsulta }}</h3>
                <div class="consulta-badges">
                  @if (consulta.semanasGestacion) {
                    <span class="badge-semanas">
                      <i class="pi pi-heart-fill"></i>
                      {{ consulta.semanasGestacion }} sem
                    </span>
                  }
                  @if (consulta.totalArchivos > 0) {
                    <span class="badge-archivos">
                      <i class="pi pi-paperclip"></i>
                      {{ consulta.totalArchivos }}
                    </span>
                  }
                </div>
              </div>

              <p class="diagnostico">
                <i class="pi pi-check-circle"></i>
                {{ consulta.diagnosticoPrincipal }}
                @if (consulta.codigoCie10) {
                  <code class="cie10">{{ consulta.codigoCie10 }}</code>
                }
              </p>

              <div class="signos-vitales">
                @if (consulta.peso) {
                  <span class="signo">
                    <i class="pi pi-chart-bar"></i> {{ consulta.peso }} kg
                  </span>
                }
                @if (consulta.presionArterial) {
                  <span class="signo">
                    <i class="pi pi-heart"></i> {{ consulta.presionArterial }}
                  </span>
                }
              </div>

              <div class="consulta-footer">
                <span class="creado-por">
                  <i class="pi pi-user"></i> {{ consulta.creadoPor }}
                </span>
                <div class="consulta-actions">
                  <a [routerLink]="['/historias/consultas', consulta.id]">
                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true"
                              severity="secondary" pTooltip="Ver detalle"
                              tooltipPosition="top" />
                  </a>
                  <a [routerLink]="['/historias/consultas', consulta.id, 'editar']">
                    <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                              severity="info" pTooltip="Editar"
                              tooltipPosition="top" />
                  </a>
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true"
                            severity="danger" pTooltip="Eliminar"
                            tooltipPosition="top"
                            (onClick)="confirmarEliminar(consulta)" />
                </div>
              </div>
            </div>

          </div>
        }

        <!-- Paginación manual -->
        @if (!ultima()) {
          <div class="load-more">
            <p-button
              label="Cargar más consultas"
              icon="pi pi-chevron-down"
              [outlined]="true"
              severity="secondary"
              [loading]="cargandoMas()"
              (onClick)="cargarMas()"
            />
          </div>
        }

        
      </div>
    }
    
  `,
    styles: [`
    /* Header */
    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .page-title { display: flex; align-items: center; gap: 1rem; }
    .page-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #0fb8ad, #2d7dd2);
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .page-icon .pi { font-size: 1.4rem; color: white; }
    .page-title h2 { margin: 0 0 4px; font-size: 1.4rem; font-weight: 700; color: #0a2342; }
    .page-title p  { margin: 0; color: #64748b; font-size: 0.85rem; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-start; }

    /* Antecedentes banner */
    .antecedentes-banner {
      background: linear-gradient(135deg, #fdf2f8, #fce7f3);
      border: 1px solid #f9a8d4;
      border-radius: 14px;
      padding: 1rem 1.5rem;
      margin-bottom: 1.5rem;
      display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;
    }
    .ant-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.85rem; font-weight: 700; color: #9d174d;
      white-space: nowrap;
    }
    .ant-title .pi { color: #ec4899; }
    .ant-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .ant-chip {
      background: white; border: 1px solid #f9a8d4;
      color: #9d174d; padding: 3px 10px; border-radius: 20px;
      font-size: 0.78rem; font-weight: 700;
    }
    .ant-chip.info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }

    /* Consultas list */
    .consultas-list {
      display: flex; flex-direction: column; gap: 1rem;
    }

    .consulta-card {
      background: white; border-radius: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
      display: flex; overflow: hidden;
      transition: box-shadow 0.18s, transform 0.18s;
    }

    .consulta-card:hover {
      box-shadow: 0 6px 24px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }

    /* Fecha lateral */
    .fecha-lateral {
      width: 72px; flex-shrink: 0;
      background: linear-gradient(180deg, #0a2342 0%, #1a4a7a 100%);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 1rem 0.5rem; gap: 2px;
    }
    .fecha-dia {
      font-size: 1.8rem; font-weight: 800;
      color: white; line-height: 1;
    }
    .fecha-mes {
      font-size: 0.65rem; font-weight: 700;
      color: #0fb8ad; letter-spacing: 1px;
    }
    .fecha-anio {
      font-size: 0.7rem; color: rgba(255,255,255,0.5);
    }

    /* Contenido */
    .consulta-content {
      flex: 1; padding: 1.2rem 1.5rem;
      display: flex; flex-direction: column; gap: 0.6rem;
    }

    .consulta-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 1rem;
    }

    .motivo {
      margin: 0; font-size: 1rem; font-weight: 700; color: #0a2342;
      flex: 1;
    }

    .consulta-badges { display: flex; gap: 6px; flex-shrink: 0; }

    .badge-semanas {
      background: #fdf2f8; color: #be185d;
      padding: 3px 10px; border-radius: 20px;
      font-size: 0.75rem; font-weight: 700;
      display: flex; align-items: center; gap: 4px;
    }
    .badge-semanas .pi { font-size: 0.7rem; }

    .badge-archivos {
      background: #eff6ff; color: #1d4ed8;
      padding: 3px 10px; border-radius: 20px;
      font-size: 0.75rem; font-weight: 700;
      display: flex; align-items: center; gap: 4px;
    }

    .diagnostico {
      margin: 0; font-size: 0.88rem; color: #334155;
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    }
    .diagnostico .pi { color: #16a34a; font-size: 0.8rem; }

    .cie10 {
      background: #f1f5f9; padding: 1px 6px;
      border-radius: 4px; font-size: 0.75rem;
      color: #64748b; font-family: monospace;
    }

    .signos-vitales {
      display: flex; gap: 1rem; flex-wrap: wrap;
    }
    .signo {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.78rem; color: #64748b;
    }
    .signo .pi { font-size: 0.72rem; color: #2d7dd2; }

    .consulta-footer {
      display: flex; align-items: center;
      justify-content: space-between; margin-top: auto;
      padding-top: 0.4rem; flex-wrap: wrap; gap: 0.5rem;
    }

    .creado-por {
      font-size: 0.75rem; color: #94a3b8;
      display: flex; align-items: center; gap: 4px;
    }
    .creado-por .pi { font-size: 0.7rem; }

    .consulta-actions { display: flex; gap: 2px; }

    /* Skeleton */
    .skeleton-list { display: flex; flex-direction: column; gap: 1rem; }
    .skeleton-card {
      background: white; border-radius: 14px;
      padding: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    }

    /* Empty state */
    .empty-state {
      background: white; border-radius: 16px;
      padding: 4rem 2rem; text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .empty-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .empty-icon .pi { font-size: 2rem; color: #94a3b8; }
    .empty-state h3 { margin: 0 0 0.5rem; color: #334155; }
    .empty-state p  { margin: 0 0 1.5rem; color: #94a3b8; }

    /* Load more */
    .load-more { text-align: center; padding: 1rem 0; }
  `]
})
export class HistoriaListComponent implements OnInit {

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private historiaService = inject(HistoriaClinicaService);
    private pacienteService = inject(PacienteService);
    private toast = inject(MessageService);
    private confirmService = inject(ConfirmationService);

    historia = signal<HistoriaClinica | null>(null);
    paciente = signal<Paciente | null>(null);
    consultas = signal<ConsultaResumen[]>([]);
    cargando = signal(false);
    cargandoMas = signal(false);
    ultima = signal(true);
    pagina = 0;
    sinHistoria = signal(false);

    tieneAntecedentes = computed(() => {
        const h = this.historia();
        if (!h) return false;
        return !!(h.gestas != null || h.partos != null || h.cesareas != null
            || h.metodoAnticonceptivo || h.cicloMenstrual
            || h.fechaUltimaMenstruacion);
    });

    ngOnInit(): void {
        const pacienteId = Number(this.route.snapshot.paramMap.get('pacienteId'));
        if (!pacienteId) { this.router.navigate(['/pacientes']); return; }
        this.cargarPaciente(pacienteId);
        this.cargarHistoria(pacienteId);
    }

    cargarPaciente(id: number): void {
        this.pacienteService.obtener(id).subscribe({
            next: res => this.paciente.set(res.data)
        });
    }

    cargarHistoria(pacienteId: number): void {
        this.cargando.set(true);
        this.sinHistoria.set(false);

        this.historiaService.obtenerPorPaciente(pacienteId).subscribe({
            next: res => {
                this.historia.set(res.data);
                if (res.data) {
                    this.cargarConsultas(res.data.id, false);
                } else {
                    this.cargando.set(false);
                }
            },
            error: (err) => {
                if (err.status === 404) {
                    // No existe historia → mostrar opción de crear
                    this.sinHistoria.set(true);
                } else {
                    this.toast.add({
                        severity: 'error', summary: 'Error',
                        detail: 'No se pudo cargar la historia clínica'
                    });
                }
                this.cargando.set(false);
            }
        });
    }

    cargarConsultas(historiaId: number, acumular: boolean): void {
        this.historiaService.listarConsultas(historiaId, this.pagina, 10).subscribe({
            next: res => {
                const nuevas = res.data?.contenido ?? [];
                if (acumular) {
                    this.consultas.update(prev => [...prev, ...nuevas]);
                } else {
                    this.consultas.set(nuevas);
                }
                this.ultima.set(res.data?.ultima ?? true);
                this.cargando.set(false);
                this.cargandoMas.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.cargandoMas.set(false);
            }
        });
    }

    cargarMas(): void {
        const h = this.historia();
        if (!h) return;
        this.pagina++;
        this.cargandoMas.set(true);
        this.cargarConsultas(h.id, true);
    }

    confirmarEliminar(consulta: ConsultaResumen): void {
        const fechaFormateada = new Date(consulta.fechaConsulta + 'T00:00:00')
            .toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });

        this.confirmService.confirm({
            message: `¿Eliminar la consulta del <strong>${fechaFormateada}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.historiaService.eliminarConsulta(consulta.id).subscribe({
                    next: () => {
                        this.toast.add({
                            severity: 'warn', summary: 'Eliminado',
                            detail: 'Consulta eliminada exitosamente'
                        });
                        this.pagina = 0;
                        const h = this.historia();
                        if (h) this.cargarConsultas(h.id, false);
                    }
                });
            }
        });
    }
}