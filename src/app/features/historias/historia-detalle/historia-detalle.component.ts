import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule }        from 'primeng/button';
import { ToastModule }         from 'primeng/toast';
import { SkeletonModule }      from 'primeng/skeleton';
import { DividerModule }       from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';
import { ArchivoAdjunto, ConsultaDetalle } from '../../../core/models/historia.models';


@Component({
  selector: 'app-historia-detalle',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule, ToastModule, SkeletonModule,
    DividerModule, ConfirmDialogModule, TooltipModule
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
          <h2>Detalle de Consulta</h2>
          @if (consulta()) {
            <p>
              {{ consulta()!.fechaConsulta | date:'dd/MM/yyyy' }}
              · Registrada por <strong>{{ consulta()!.creadoPor }}</strong>
            </p>
          }
        </div>
      </div>
      <div class="header-actions">
        @if (consulta()) {
          <p-button label="Editar" icon="pi pi-pencil"
                    severity="info" [outlined]="true"
                    (onClick)="editar()" />
          <p-button label="Eliminar" icon="pi pi-trash"
                    severity="danger" [outlined]="true"
                    (onClick)="confirmarEliminar()" />
        }
        <p-button label="Volver" icon="pi pi-arrow-left"
                  [text]="true" severity="secondary" (onClick)="volver()" />
      </div>
    </div>

    @if (cargando()) {
      <div class="detail-card">
        @for (i of [1,2,3,4,5]; track i) {
          <p-skeleton height="2.5rem" styleClass="mb-3" />
        }
      </div>
    } @else if (consulta()) {
      <div class="detail-card">

        <!-- Signos vitales -->
        @if (tieneSignos()) {
          <div class="signos-grid">
            @if (consulta()!.peso) {
              <div class="signo">
                <i class="pi pi-chart-bar"></i>
                <span class="sv">{{ consulta()!.peso }} kg</span>
                <span class="sl">Peso</span>
              </div>
            }
            @if (consulta()!.talla) {
              <div class="signo">
                <i class="pi pi-arrows-v"></i>
                <span class="sv">{{ consulta()!.talla }} cm</span>
                <span class="sl">Talla</span>
              </div>
            }
            @if (consulta()!.imc) {
              <div class="signo" [class]="'imc-'+imcClase()">
                <i class="pi pi-calculator"></i>
                <span class="sv">{{ consulta()!.imc }}</span>
                <span class="sl">IMC · {{ imcLabel() }}</span>
              </div>
            }
            @if (consulta()!.presionArterial) {
              <div class="signo">
                <i class="pi pi-heart"></i>
                <span class="sv">{{ consulta()!.presionArterial }}</span>
                <span class="sl">P. Arterial</span>
              </div>
            }
            @if (consulta()!.frecuenciaCardiaca) {
              <div class="signo">
                <i class="pi pi-heart-fill"></i>
                <span class="sv">{{ consulta()!.frecuenciaCardiaca }}</span>
                <span class="sl">F. Cardíaca</span>
              </div>
            }
            @if (consulta()!.temperatura) {
              <div class="signo">
                <i class="pi pi-sun"></i>
                <span class="sv">{{ consulta()!.temperatura }} °C</span>
                <span class="sl">Temperatura</span>
              </div>
            }
            @if (consulta()!.saturacionOxigeno) {
              <div class="signo">
                <i class="pi pi-circle-fill"></i>
                <span class="sv">{{ consulta()!.saturacionOxigeno }}%</span>
                <span class="sl">SpO₂</span>
              </div>
            }
            @if (consulta()!.semanasGestacion) {
              <div class="signo gest">
                <i class="pi pi-heart-fill"></i>
                <span class="sv">{{ consulta()!.semanasGestacion }} sem</span>
                <span class="sl">Gestación</span>
              </div>
            }
          </div>
          <p-divider />
        }

        <!-- Motivo -->
        <div class="bloque">
          <div class="blq-titulo"><i class="pi pi-comment"></i> Motivo de Consulta</div>
          <p class="blq-texto">{{ consulta()!.motivoConsulta }}</p>
        </div>

        @if (consulta()!.examenFisico) {
          <div class="bloque">
            <div class="blq-titulo"><i class="pi pi-search"></i> Examen Físico</div>
            <p class="blq-texto">{{ consulta()!.examenFisico }}</p>
          </div>
        }

        <p-divider />

        <!-- Diagnóstico -->
        <div class="grid-2col">
          <div class="bloque">
            <div class="blq-titulo">
              <i class="pi pi-check-circle"></i> Diagnóstico Principal
              @if (consulta()!.codigoCie10) {
                <code class="cie">{{ consulta()!.codigoCie10 }}</code>
              }
            </div>
            <p class="blq-texto">{{ consulta()!.diagnosticoPrincipal }}</p>
          </div>
          @if (consulta()!.diagnosticoSecundario) {
            <div class="bloque">
              <div class="blq-titulo"><i class="pi pi-info-circle"></i> Diagnóstico Secundario</div>
              <p class="blq-texto">{{ consulta()!.diagnosticoSecundario }}</p>
            </div>
          }
        </div>

        <p-divider />

        <!-- Tratamiento -->
        <div class="grid-3col">
          @if (consulta()!.tratamiento) {
            <div class="bloque">
              <div class="blq-titulo"><i class="pi pi-heart"></i> Tratamiento</div>
              <p class="blq-texto">{{ consulta()!.tratamiento }}</p>
            </div>
          }
          @if (consulta()!.medicacion) {
            <div class="bloque">
              <div class="blq-titulo"><i class="pi pi-tablet"></i> Medicación</div>
              <p class="blq-texto">{{ consulta()!.medicacion }}</p>
            </div>
          }
          @if (consulta()!.indicaciones) {
            <div class="bloque">
              <div class="blq-titulo"><i class="pi pi-list"></i> Indicaciones</div>
              <p class="blq-texto">{{ consulta()!.indicaciones }}</p>
            </div>
          }
        </div>

        @if (consulta()!.proximaCita) {
          <div class="proxima">
            <i class="pi pi-calendar"></i>
            Próxima cita:
            <strong>{{ consulta()!.proximaCita | date:'dd/MM/yyyy' }}</strong>
          </div>
        }

        @if (consulta()!.observaciones) {
          <p-divider />
          <div class="bloque">
            <div class="blq-titulo"><i class="pi pi-comment"></i> Observaciones</div>
            <p class="blq-texto">{{ consulta()!.observaciones }}</p>
          </div>
        }

        <!-- Archivos -->
        @if (consulta()!.archivos?.length) {
          <p-divider />
          <div class="blq-titulo" style="margin-bottom:1rem">
            <i class="pi pi-paperclip"></i>
            Archivos Adjuntos ({{ consulta()!.archivos.length }})
          </div>
          <div class="archivos-list">
            @for (a of consulta()!.archivos; track a.id) {
              <div class="archivo">
                <div class="a-icon"><i [class]="'pi '+getIcon(a)"></i></div>
                <div class="a-info">
                  <span class="a-nombre" [pTooltip]="a.nombreOriginal" tooltipPosition="top">
                    {{ a.nombreOriginal | slice:0:35 }}{{ a.nombreOriginal.length > 35 ? '...' : '' }}
                  </span>
                  <span class="a-meta">{{ formatBytes(a.tamanoBytes) }} · {{ a.tipoArchivo }}</span>
                </div>
                <div class="a-actions">
                  <a [href]="a.urlDescarga + '?inline=true'" target="_blank">
                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true"
                              severity="secondary" pTooltip="Ver" tooltipPosition="top" />
                  </a>
                  <a [href]="a.urlDescarga" download>
                    <p-button icon="pi pi-download" [rounded]="true" [text]="true"
                              severity="info" pTooltip="Descargar" tooltipPosition="top" />
                  </a>
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true"
                            severity="danger" pTooltip="Eliminar" tooltipPosition="top"
                            (onClick)="confirmarEliminarArchivo(a)" />
                </div>
              </div>
            }
          </div>
        }

      </div>
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .page-title  { display:flex; align-items:center; gap:1rem; }
    .page-icon   { width:52px; height:52px; background:linear-gradient(135deg,#0fb8ad,#2d7dd2); border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 4px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }
    .header-actions { display:flex; gap:8px; flex-wrap:wrap; }

    .detail-card { background:white; border-radius:16px; padding:2rem; box-shadow:0 2px 12px rgba(0,0,0,.07); }

    /* Signos vitales */
    .signos-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:1rem; margin-bottom:1.5rem; }
    .signo { display:flex; flex-direction:column; align-items:center; gap:4px; background:#f8fafc; border-radius:12px; padding:1rem .5rem; border:1px solid #e2e8f0; }
    .signo .pi { font-size:1.2rem; color:#2d7dd2; }
    .sv { font-size:1.1rem; font-weight:700; color:#0a2342; }
    .sl { font-size:.72rem; color:#94a3b8; text-align:center; }
    .signo.gest { background:#fdf2f8; border-color:#f9a8d4; }
    .signo.gest .pi { color:#ec4899; }
    .imc-normal    { background:#f0fdf4; border-color:#86efac; }
    .imc-bajo      { background:#eff6ff; border-color:#93c5fd; }
    .imc-sobrepeso { background:#fffbeb; border-color:#fcd34d; }
    .imc-obesidad  { background:#fef2f2; border-color:#fca5a5; }

    /* Bloques */
    .bloque { margin-bottom:1rem; }
    .blq-titulo { display:flex; align-items:center; gap:6px; font-size:.85rem; font-weight:700; color:#334155; margin-bottom:6px; }
    .blq-titulo .pi { color:#2d7dd2; }
    .blq-texto { margin:0; font-size:.92rem; color:#475569; line-height:1.7; white-space:pre-wrap; }

    .cie { background:#f1f5f9; padding:2px 8px; border-radius:6px; font-size:.75rem; color:#64748b; font-family:monospace; }

    .grid-2col { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1.5rem; }
    .grid-3col { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1.5rem; }

    .proxima { display:inline-flex; align-items:center; gap:6px; background:#ecfdf5; border:1px solid #6ee7b7; color:#065f46; padding:8px 16px; border-radius:10px; font-size:.88rem; margin-top:.5rem; }
    .proxima .pi { color:#059669; }

    /* Archivos */
    .archivos-list { display:flex; flex-direction:column; gap:8px; }
    .archivo { display:flex; align-items:center; gap:1rem; padding:.8rem 1rem; border-radius:10px; background:#f8fafc; border:1px solid #e2e8f0; }
    .a-icon  { width:40px; height:40px; border-radius:10px; background:#e0f2fe; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .a-icon .pi { font-size:1.2rem; color:#0369a1; }
    .a-info  { flex:1; display:flex; flex-direction:column; gap:2px; min-width:0; }
    .a-nombre { font-size:.88rem; font-weight:600; color:#334155; }
    .a-meta   { font-size:.75rem; color:#94a3b8; }
    .a-actions { display:flex; gap:2px; flex-shrink:0; }
  `]
})
export class HistoriaDetalleComponent implements OnInit {

  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private hSvc    = inject(HistoriaClinicaService);
  private toast   = inject(MessageService);
  private confirm = inject(ConfirmationService);

  consulta = signal<ConsultaDetalle | null>(null);
  cargando = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('consultaId');
    if (id) this.cargar(Number(id));
    else this.router.navigate(['/historias']);
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.hSvc.obtenerConsulta(id).subscribe({
      next: r => { this.consulta.set(r.data); this.cargando.set(false); },
      error: () => {
        this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo cargar la consulta' });
        this.router.navigate(['/historias']);
      }
    });
  }

  tieneSignos(): boolean {
    const c = this.consulta();
    if (!c) return false;
    return !!(c.peso || c.talla || c.presionArterial || c.frecuenciaCardiaca
           || c.temperatura || c.saturacionOxigeno || c.semanasGestacion);
  }

  editar(): void {
    this.router.navigate(['/historias/consultas', this.consulta()!.id, 'editar']);
  }

  confirmarEliminar(): void {
    this.confirm.confirm({
      message: 'Esta acción no se puede deshacer. ¿Desea eliminar la consulta?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hSvc.eliminarConsulta(this.consulta()!.id).subscribe({
          next: () => {
            this.toast.add({ severity:'warn', summary:'Eliminado', detail:'Consulta eliminada' });
            this.volver();
          }
        });
      }
    });
  }

  confirmarEliminarArchivo(a: ArchivoAdjunto): void {
    this.confirm.confirm({
      message: `¿Eliminar <strong>${a.nombreOriginal}</strong>?`,
      header: 'Eliminar archivo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hSvc.eliminarArchivo(a.id).subscribe({
          next: () => {
            this.toast.add({ severity:'warn', summary:'Eliminado', detail:'Archivo eliminado' });
            this.cargar(this.consulta()!.id);
          }
        });
      }
    });
  }

  volver(): void {
    const hId = this.consulta()?.historiaClinicaId;
    if (hId) {
      this.hSvc.obtenerPorId(hId).subscribe({
        next: r => this.router.navigate(['/historias/paciente', r.data?.pacienteId]),
        error: () => this.router.navigate(['/historias'])
      });
    } else {
      this.router.navigate(['/historias']);
    }
  }

  imcClase(): string {
    const v = this.consulta()?.imc;
    if (!v) return '';
    if (v < 18.5) return 'bajo';
    if (v < 25)   return 'normal';
    if (v < 30)   return 'sobrepeso';
    return 'obesidad';
  }

  imcLabel(): string {
    const v = this.consulta()?.imc;
    if (!v) return '';
    if (v < 18.5) return 'Bajo peso';
    if (v < 25)   return 'Normal';
    if (v < 30)   return 'Sobrepeso';
    return 'Obesidad';
  }

  getIcon(a: ArchivoAdjunto): string {
    const m = a.tipoMime ?? '';
    if (m.includes('image')) return 'pi-image';
    if (m.includes('pdf'))   return 'pi-file-pdf';
    if (m.includes('word') || m.includes('docx')) return 'pi-file-word';
    return 'pi-file';
  }

  formatBytes(b: number): string {
    if (b < 1024)     return b + ' B';
    if (b < 1048576)  return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }
}