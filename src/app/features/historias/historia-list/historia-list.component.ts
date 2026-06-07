import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule }        from 'primeng/button';
import { ToastModule }         from 'primeng/toast';
import { SkeletonModule }      from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { ConsultaResumen, HistoriaClinica } from '../../../core/models/historia.models';
import { Paciente } from '../../../core/models';


@Component({
  selector: 'app-historia-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule, ToastModule, SkeletonModule,
    ConfirmDialogModule, TooltipModule
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
          @if (cargando()) {
            <p-skeleton width="18rem" height="1.4rem" />
            <p-skeleton width="12rem" height="1rem" styleClass="mt-1" />
          } @else if (paciente()) {
            <h2>Historia Clínica</h2>
            <p>
              <strong>{{ paciente()!.nombreCompleto }}</strong>
              · C.I. {{ paciente()!.cedula }}
              @if (paciente()!.edad) { · {{ paciente()!.edad }} años }
              @if (historia()) {
                · <strong>{{ historia()!.totalConsultas }}</strong> consultas
              }
            </p>
          }
        </div>
      </div>

      <div class="header-actions">
        @if (historia()) {
          <p-button label="Nueva Consulta" icon="pi pi-plus"
                    styleClass="btn-primary"
                    (onClick)="nuevaConsulta()" />
          <p-button label="Editar Antecedentes" icon="pi pi-heart"
                    [outlined]="true" severity="info"
                    (onClick)="editarAntecedentes()" />
        }
        <p-button label="Volver" icon="pi pi-arrow-left"
                  [text]="true" severity="secondary"
                  (onClick)="router.navigate(['/historias'])" />
      </div>
    </div>

    <!-- Banner antecedentes -->
    @if (historia() && tieneAntecedentes()) {
      <div class="ant-banner">
        <span class="ant-titulo">
          <i class="pi pi-heart"></i> Antecedentes
        </span>
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
          @if (historia()!.hijosVivos != null) {
            <span class="ant-chip">HV{{ historia()!.hijosVivos }}</span>
          }
          @if (historia()!.metodoAnticonceptivo) {
            <span class="ant-chip info">MAC: {{ historia()!.metodoAnticonceptivo }}</span>
          }
          @if (historia()!.fechaUltimaMenstruacion) {
            <span class="ant-chip info">FUM: {{ historia()!.fechaUltimaMenstruacion }}</span>
          }
        </div>
      </div>
    }

    <!-- Sin historia -->
    @if (!cargando() && sinHistoria()) {
      <div class="crear-card">
        <div class="crear-icon"><i class="pi pi-file-plus"></i></div>
        <h3>Esta paciente aún no tiene historia clínica</h3>
        <p>Crea la historia clínica con los antecedentes gineco-obstétricos para poder registrar consultas.</p>
        <p-button label="Crear Historia Clínica" icon="pi pi-plus"
                  styleClass="btn-primary" (onClick)="crearHistoria()" />
      </div>
    }

    <!-- Skeleton cargando -->
    @if (cargando()) {
      <div class="skeleton-list">
        @for (i of [1,2,3]; track i) {
          <div class="skeleton-card">
            <p-skeleton width="7rem" height=".9rem" />
            <p-skeleton height="1.2rem" styleClass="mt-2" />
            <p-skeleton width="65%" height="1rem" styleClass="mt-1" />
          </div>
        }
      </div>
    }

    <!-- Timeline de consultas -->
    @if (!cargando() && historia() && consultas().length > 0) {
      <div class="timeline">
        @for (c of consultas(); track c.id) {
          <div class="consulta-card">

            <!-- Fecha lateral -->
            <div class="fecha-col">
              <span class="f-dia">{{ c.fechaConsulta | date:'dd' }}</span>
              <span class="f-mes">{{ c.fechaConsulta | date:'MMM' | uppercase }}</span>
              <span class="f-anio">{{ c.fechaConsulta | date:'yyyy' }}</span>
            </div>

            <!-- Contenido -->
            <div class="contenido">
              <div class="c-header">
                <h3 class="motivo">{{ c.motivoConsulta }}</h3>
                <div class="badges">
                  @if (c.semanasGestacion) {
                    <span class="badge gest">
                      <i class="pi pi-heart-fill"></i> {{ c.semanasGestacion }} sem
                    </span>
                  }
                  @if (c.totalArchivos > 0) {
                    <span class="badge arch">
                      <i class="pi pi-paperclip"></i> {{ c.totalArchivos }}
                    </span>
                  }
                </div>
              </div>

              <p class="diagnostico">
                <i class="pi pi-check-circle"></i>
                {{ c.diagnosticoPrincipal }}
                @if (c.codigoCie10) {
                  <code class="cie">{{ c.codigoCie10 }}</code>
                }
              </p>

              <div class="vitales">
                @if (c.peso) {
                  <span class="vital"><i class="pi pi-chart-bar"></i> {{ c.peso }} kg</span>
                }
                @if (c.presionArterial) {
                  <span class="vital"><i class="pi pi-heart"></i> {{ c.presionArterial }}</span>
                }
              </div>

              <div class="c-footer">
                <span class="por">
                  <i class="pi pi-user"></i> {{ c.creadoPor }}
                </span>
                <div class="acciones">
                  <p-button icon="pi pi-eye" [rounded]="true" [text]="true"
                            severity="secondary" pTooltip="Ver detalle" tooltipPosition="top"
                            (onClick)="verConsulta(c)" />
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                            severity="info" pTooltip="Editar" tooltipPosition="top"
                            (onClick)="editarConsulta(c)" />
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true"
                            severity="danger" pTooltip="Eliminar" tooltipPosition="top"
                            (onClick)="confirmarEliminar(c)" />
                </div>
              </div>
            </div>

          </div>
        }

        @if (!ultima()) {
          <div class="load-more">
            <p-button label="Cargar más consultas" icon="pi pi-chevron-down"
                      [outlined]="true" severity="secondary"
                      [loading]="cargandoMas()"
                      (onClick)="cargarMas()" />
          </div>
        }
      </div>
    }

    <!-- Sin consultas pero con historia -->
    @if (!cargando() && historia() && consultas().length === 0) {
      <div class="empty-consultas">
        <div class="ec-icon"><i class="pi pi-file-edit"></i></div>
        <h3>Sin consultas registradas</h3>
        <p>Esta paciente tiene historia clínica pero aún no se han registrado consultas.</p>
        <p-button label="Registrar Primera Consulta" icon="pi pi-plus"
                  styleClass="btn-primary" (onClick)="nuevaConsulta()" />
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .page-title  { display:flex; align-items:center; gap:1rem; }
    .page-icon   { width:52px; height:52px; background:linear-gradient(135deg,#0fb8ad,#2d7dd2); border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 4px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }
    .header-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:flex-start; }

    /* Antecedentes banner */
    .ant-banner { background:linear-gradient(135deg,#fdf2f8,#fce7f3); border:1px solid #f9a8d4; border-radius:14px; padding:1rem 1.5rem; margin-bottom:1.5rem; display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap; }
    .ant-titulo { display:flex; align-items:center; gap:6px; font-size:.85rem; font-weight:700; color:#9d174d; white-space:nowrap; }
    .ant-titulo .pi { color:#ec4899; }
    .ant-chips { display:flex; flex-wrap:wrap; gap:6px; }
    .ant-chip { background:white; border:1px solid #f9a8d4; color:#9d174d; padding:3px 10px; border-radius:20px; font-size:.78rem; font-weight:700; }
    .ant-chip.info { background:#eff6ff; border-color:#bfdbfe; color:#1e40af; }

    /* Crear historia */
    .crear-card { background:white; border-radius:16px; padding:3rem 2rem; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,.06); border:2px dashed #e2e8f0; }
    .crear-icon { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,#e0f7f6,#dbeafe); display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; }
    .crear-icon .pi { font-size:2rem; color:#0fb8ad; }
    .crear-card h3 { margin:0 0 .75rem; color:#0a2342; font-size:1.1rem; font-weight:700; }
    .crear-card p  { margin:0 0 1.5rem; color:#64748b; max-width:400px; margin-inline:auto; line-height:1.7; font-size:.9rem; }

    /* Skeleton */
    .skeleton-list { display:flex; flex-direction:column; gap:1rem; }
    .skeleton-card { background:white; border-radius:14px; padding:1.5rem; box-shadow:0 2px 10px rgba(0,0,0,.06); }

    /* Timeline */
    .timeline { display:flex; flex-direction:column; gap:1rem; }

    .consulta-card { background:white; border-radius:14px; box-shadow:0 2px 10px rgba(0,0,0,.06); display:flex; overflow:hidden; transition:box-shadow .18s, transform .18s; }
    .consulta-card:hover { box-shadow:0 6px 24px rgba(0,0,0,.1); transform:translateY(-1px); }

    .fecha-col { width:72px; flex-shrink:0; background:linear-gradient(180deg,#0a2342,#1a4a7a); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1rem .5rem; gap:2px; }
    .f-dia  { font-size:1.8rem; font-weight:800; color:white; line-height:1; }
    .f-mes  { font-size:.65rem; font-weight:700; color:#0fb8ad; letter-spacing:1px; }
    .f-anio { font-size:.7rem; color:rgba(255,255,255,.5); }

    .contenido { flex:1; padding:1.2rem 1.5rem; display:flex; flex-direction:column; gap:.6rem; }

    .c-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
    .motivo   { margin:0; font-size:1rem; font-weight:700; color:#0a2342; flex:1; }
    .badges   { display:flex; gap:6px; flex-shrink:0; }
    .badge    { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:.75rem; font-weight:700; }
    .gest     { background:#fdf2f8; color:#be185d; }
    .arch     { background:#eff6ff; color:#1d4ed8; }

    .diagnostico { margin:0; font-size:.88rem; color:#334155; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
    .diagnostico .pi { color:#16a34a; font-size:.8rem; }
    .cie { background:#f1f5f9; padding:1px 6px; border-radius:4px; font-size:.75rem; color:#64748b; font-family:monospace; }

    .vitales { display:flex; gap:1rem; flex-wrap:wrap; }
    .vital   { display:flex; align-items:center; gap:5px; font-size:.78rem; color:#64748b; }
    .vital .pi { font-size:.72rem; color:#2d7dd2; }

    .c-footer { display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-top:.4rem; flex-wrap:wrap; gap:.5rem; }
    .por      { font-size:.75rem; color:#94a3b8; display:flex; align-items:center; gap:4px; }
    .por .pi  { font-size:.7rem; }
    .acciones { display:flex; gap:2px; }

    .load-more { text-align:center; padding:1rem 0; }

    .empty-consultas { background:white; border-radius:16px; padding:3rem 2rem; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,.06); }
    .ec-icon { width:70px; height:70px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; }
    .ec-icon .pi { font-size:1.8rem; color:#94a3b8; }
    .empty-consultas h3 { margin:0 0 .5rem; color:#334155; }
    .empty-consultas p  { margin:0 0 1.5rem; color:#94a3b8; font-size:.9rem; }
  `]
})
export class HistoriaListComponent implements OnInit {

  router          = inject(Router);
  private route   = inject(ActivatedRoute);
  private hSvc    = inject(HistoriaClinicaService);
  private pSvc    = inject(PacienteService);
  private toast   = inject(MessageService);
  private confirm = inject(ConfirmationService);

  historia    = signal<HistoriaClinica | null>(null);
  paciente    = signal<Paciente | null>(null);
  consultas   = signal<ConsultaResumen[]>([]);
  cargando    = signal(false);
  cargandoMas = signal(false);
  sinHistoria = signal(false);
  ultima      = signal(true);
  pagina      = 0;

  tieneAntecedentes = computed(() => {
    const h = this.historia();
    if (!h) return false;
    return !!(h.gestas != null || h.partos != null || h.cesareas != null
           || h.metodoAnticonceptivo || h.fechaUltimaMenstruacion);
  });

  ngOnInit(): void {
    const pId = Number(this.route.snapshot.paramMap.get('pacienteId'));
    if (!pId) { this.router.navigate(['/historias']); return; }
    this.pSvc.obtener(pId).subscribe({ next: r => this.paciente.set(r.data) });
    this.cargarHistoria(pId);
  }

  cargarHistoria(pacienteId: number): void {
    this.cargando.set(true);
    this.sinHistoria.set(false);
    this.hSvc.obtenerPorPaciente(pacienteId).subscribe({
      next: r => {
        this.historia.set(r.data);
        if (r.data) this.cargarConsultas(r.data.id, false);
        else this.cargando.set(false);
      },
      error: err => {
        if (err.status === 404) this.sinHistoria.set(true);
        else this.toast.add({ severity:'error', summary:'Error',
          detail:'No se pudo cargar la historia' });
        this.cargando.set(false);
      }
    });
  }

  cargarConsultas(historiaId: number, acumular: boolean): void {
    this.hSvc.listarConsultas(historiaId, this.pagina, 10).subscribe({
      next: r => {
        const items = r.data?.contenido ?? [];
        acumular ? this.consultas.update(p => [...p, ...items])
                 : this.consultas.set(items);
        this.ultima.set(r.data?.ultima ?? true);
        this.cargando.set(false);
        this.cargandoMas.set(false);
      },
      error: () => { this.cargando.set(false); this.cargandoMas.set(false); }
    });
  }

  cargarMas(): void {
    const h = this.historia();
    if (!h) return;
    this.pagina++;
    this.cargandoMas.set(true);
    this.cargarConsultas(h.id, true);
  }

  crearHistoria(): void {
    this.router.navigate(['/historias/antecedentes'], {
      queryParams: { pacienteId: this.paciente()?.id }
    });
  }

  editarAntecedentes(): void {
    this.router.navigate(['/historias/antecedentes'], {
      queryParams: { historiaId: this.historia()?.id }
    });
  }

  nuevaConsulta(): void {
    this.router.navigate(['/historias/consultas/nueva'], {
      queryParams: { historiaId: this.historia()?.id }
    });
  }

  verConsulta(c: ConsultaResumen): void {
    this.router.navigate(['/historias/consultas', c.id]);
  }

  editarConsulta(c: ConsultaResumen): void {
    this.router.navigate(['/historias/consultas', c.id, 'editar']);
  }

  confirmarEliminar(c: ConsultaResumen): void {
    const fecha = new Date(c.fechaConsulta + 'T00:00:00')
      .toLocaleDateString('es-EC', { day:'2-digit', month:'long', year:'numeric' });
    this.confirm.confirm({
      message: `¿Eliminar la consulta del <strong>${fecha}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hSvc.eliminarConsulta(c.id).subscribe({
          next: () => {
            this.toast.add({ severity:'warn', summary:'Eliminado',
              detail:'Consulta eliminada exitosamente' });
            this.pagina = 0;
            const h = this.historia();
            if (h) this.cargarConsultas(h.id, false);
          }
        });
      }
    });
  }
}