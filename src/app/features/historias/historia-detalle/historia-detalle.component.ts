import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ButtonModule }   from 'primeng/button';
import { TagModule }      from 'primeng/tag';
import { ToastModule }    from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule }  from 'primeng/divider';
import { BadgeModule }    from 'primeng/badge';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }  from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';
import { ArchivoAdjunto, ConsultaDetalle } from '../../../core/models/historias.models';


@Component({
  selector: 'app-historia-detalle',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    ButtonModule, TagModule, ToastModule,
    SkeletonModule, DividerModule, BadgeModule,
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
          <h2>Detalle de Consulta</h2>
          @if (consulta()) {
            <p>
              {{ consulta()!.fechaConsulta | date:'EEEE d, MMMM yyyy' }}
              · Registrada por <strong>{{ consulta()!.creadoPor }}</strong>
            </p>
          }
        </div>
      </div>
      <div class="header-actions">
        @if (consulta()) {
          <a [routerLink]="['/historias/consultas', consulta()!.id, 'editar']">
            <p-button label="Editar" icon="pi pi-pencil"
                      severity="info" [outlined]="true" />
          </a>
          <p-button label="Eliminar" icon="pi pi-trash"
                    severity="danger" [outlined]="true"
                    (onClick)="confirmarEliminar()" />
        }
        <p-button label="Volver" icon="pi pi-arrow-left"
                  [text]="true" severity="secondary"
                  (onClick)="volver()" />
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

        <!-- Signos Vitales -->
        @if (tieneSignosVitales()) {
          <div class="signos-grid">
            @if (consulta()!.peso) {
              <div class="signo-card">
                <i class="pi pi-chart-bar"></i>
                <span class="signo-valor">{{ consulta()!.peso }} kg</span>
                <span class="signo-label">Peso</span>
              </div>
            }
            @if (consulta()!.talla) {
              <div class="signo-card">
                <i class="pi pi-arrows-v"></i>
                <span class="signo-valor">{{ consulta()!.talla }} cm</span>
                <span class="signo-label">Talla</span>
              </div>
            }
            @if (consulta()!.imc) {
              <div class="signo-card" [class]="'imc-' + getImcClase()">
                <i class="pi pi-calculator"></i>
                <span class="signo-valor">{{ consulta()!.imc }}</span>
                <span class="signo-label">IMC · {{ getImcLabel() }}</span>
              </div>
            }
            @if (consulta()!.presionArterial) {
              <div class="signo-card">
                <i class="pi pi-heart"></i>
                <span class="signo-valor">{{ consulta()!.presionArterial }}</span>
                <span class="signo-label">P. Arterial</span>
              </div>
            }
            @if (consulta()!.frecuenciaCardiaca) {
              <div class="signo-card">
                <i class="pi pi-heart-fill"></i>
                <span class="signo-valor">{{ consulta()!.frecuenciaCardiaca }}</span>
                <span class="signo-label">F. Cardíaca</span>
              </div>
            }
            @if (consulta()!.temperatura) {
              <div class="signo-card">
                <i class="pi pi-sun"></i>
                <span class="signo-valor">{{ consulta()!.temperatura }} °C</span>
                <span class="signo-label">Temperatura</span>
              </div>
            }
            @if (consulta()!.saturacionOxigeno) {
              <div class="signo-card">
                <i class="pi pi-circle-fill"></i>
                <span class="signo-valor">{{ consulta()!.saturacionOxigeno }}%</span>
                <span class="signo-label">SpO₂</span>
              </div>
            }
            @if (consulta()!.semanasGestacion) {
              <div class="signo-card gestacion">
                <i class="pi pi-heart-fill"></i>
                <span class="signo-valor">{{ consulta()!.semanasGestacion }} sem</span>
                <span class="signo-label">Gestación</span>
              </div>
            }
          </div>
          <p-divider />
        }

        <!-- Motivo y Examen -->
        <div class="section-block">
          <div class="section-title">
            <i class="pi pi-comment"></i> Motivo de Consulta
          </div>
          <p class="section-text">{{ consulta()!.motivoConsulta }}</p>
        </div>

        @if (consulta()!.examenFisico) {
          <div class="section-block">
            <div class="section-title">
              <i class="pi pi-search"></i> Examen Físico
            </div>
            <p class="section-text">{{ consulta()!.examenFisico }}</p>
          </div>
        }

        <p-divider />

        <!-- Diagnóstico -->
        <div class="diagnostico-grid">
          <div class="diag-principal">
            <div class="section-title">
              <i class="pi pi-check-circle"></i> Diagnóstico Principal
              @if (consulta()!.codigoCie10) {
                <code class="cie10">{{ consulta()!.codigoCie10 }}</code>
              }
            </div>
            <p class="section-text">{{ consulta()!.diagnosticoPrincipal }}</p>
          </div>
          @if (consulta()!.diagnosticoSecundario) {
            <div>
              <div class="section-title">
                <i class="pi pi-info-circle"></i> Diagnóstico Secundario
              </div>
              <p class="section-text">{{ consulta()!.diagnosticoSecundario }}</p>
            </div>
          }
        </div>

        <p-divider />

        <!-- Tratamiento -->
        <div class="tratamiento-grid">
          @if (consulta()!.tratamiento) {
            <div class="section-block">
              <div class="section-title">
                <i class="pi pi-heart"></i> Tratamiento
              </div>
              <p class="section-text">{{ consulta()!.tratamiento }}</p>
            </div>
          }
          @if (consulta()!.medicacion) {
            <div class="section-block">
              <div class="section-title">
                <i class="pi pi-tablet"></i> Medicación
              </div>
              <p class="section-text">{{ consulta()!.medicacion }}</p>
            </div>
          }
          @if (consulta()!.indicaciones) {
            <div class="section-block">
              <div class="section-title">
                <i class="pi pi-list"></i> Indicaciones
              </div>
              <p class="section-text">{{ consulta()!.indicaciones }}</p>
            </div>
          }
        </div>

        @if (consulta()!.proximaCita) {
          <div class="proxima-cita">
            <i class="pi pi-calendar"></i>
            Próxima cita:
            <strong>{{ consulta()!.proximaCita | date:'dd/MM/yyyy' }}</strong>
          </div>
        }

        @if (consulta()!.observaciones) {
          <p-divider />
          <div class="section-block">
            <div class="section-title">
              <i class="pi pi-comment"></i> Observaciones
            </div>
            <p class="section-text">{{ consulta()!.observaciones }}</p>
          </div>
        }

        <!-- Archivos adjuntos -->
        @if (consulta()!.archivos && consulta()!.archivos.length > 0) {
          <p-divider />
          <div class="section-title">
            <i class="pi pi-paperclip"></i>
            Archivos Adjuntos ({{ consulta()!.archivos.length }})
          </div>
          <div class="archivos-grid">
            @for (archivo of consulta()!.archivos; track archivo.id) {
              <div class="archivo-card">
                <div class="archivo-icon">
                  <i [class]="'pi ' + getArchivoIcon(archivo)"></i>
                </div>
                <div class="archivo-info">
                  <span class="archivo-nombre"
                        [pTooltip]="archivo.nombreOriginal"
                        tooltipPosition="top">
                    {{ archivo.nombreOriginal | slice:0:30 }}
                    {{ archivo.nombreOriginal.length > 30 ? '...' : '' }}
                  </span>
                  <span class="archivo-meta">
                    {{ formatTamano(archivo.tamanoBytes) }} ·
                    {{ archivo.tipoArchivo }}
                  </span>
                </div>
                <div class="archivo-actions">
                  <a [href]="archivo.urlDescarga + '?inline=true'" target="_blank">
                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true"
                              severity="secondary" pTooltip="Ver" tooltipPosition="top" />
                  </a>
                  <a [href]="archivo.urlDescarga" download>
                    <p-button icon="pi pi-download" [rounded]="true" [text]="true"
                              severity="info" pTooltip="Descargar" tooltipPosition="top" />
                  </a>
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true"
                            severity="danger" pTooltip="Eliminar" tooltipPosition="top"
                            (onClick)="confirmarEliminarArchivo(archivo)" />
                </div>
              </div>
            }
          </div>
        }

      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; margin-bottom: 1.5rem;
      flex-wrap: wrap; gap: 1rem;
    }
    .page-title { display: flex; align-items: center; gap: 1rem; }
    .page-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #0fb8ad, #2d7dd2);
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
    }
    .page-icon .pi { font-size: 1.4rem; color: white; }
    .page-title h2 { margin: 0 0 4px; font-size: 1.4rem; font-weight: 700; color: #0a2342; }
    .page-title p  { margin: 0; color: #64748b; font-size: 0.85rem; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .detail-card {
      background: white; border-radius: 16px;
      padding: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    }

    /* Signos vitales */
    .signos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 1rem; margin-bottom: 1.5rem;
    }
    .signo-card {
      display: flex; flex-direction: column;
      align-items: center; gap: 4px;
      background: #f8fafc; border-radius: 12px;
      padding: 1rem 0.5rem; border: 1px solid #e2e8f0;
    }
    .signo-card .pi { font-size: 1.2rem; color: #2d7dd2; }
    .signo-valor { font-size: 1.1rem; font-weight: 700; color: #0a2342; }
    .signo-label { font-size: 0.72rem; color: #94a3b8; text-align: center; }
    .signo-card.gestacion { background: #fdf2f8; border-color: #f9a8d4; }
    .signo-card.gestacion .pi { color: #ec4899; }
    .imc-normal    { background: #f0fdf4; border-color: #86efac; }
    .imc-bajo      { background: #eff6ff; border-color: #93c5fd; }
    .imc-sobrepeso { background: #fffbeb; border-color: #fcd34d; }
    .imc-obesidad  { background: #fef2f2; border-color: #fca5a5; }

    /* Secciones */
    .section-block { margin-bottom: 1rem; }
    .section-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.85rem; font-weight: 700;
      color: #334155; margin-bottom: 6px;
    }
    .section-title .pi { color: #2d7dd2; }
    .section-text {
      margin: 0; font-size: 0.92rem; color: #475569;
      line-height: 1.7; white-space: pre-wrap;
    }

    .cie10 {
      background: #f1f5f9; padding: 2px 8px;
      border-radius: 6px; font-size: 0.75rem;
      color: #64748b; font-family: monospace;
    }

    .diagnostico-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .tratamiento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    /* Próxima cita */
    .proxima-cita {
      display: inline-flex; align-items: center; gap: 6px;
      background: #ecfdf5; border: 1px solid #6ee7b7;
      color: #065f46; padding: 8px 16px; border-radius: 10px;
      font-size: 0.88rem; margin-top: 0.5rem;
    }
    .proxima-cita .pi { color: #059669; }

    /* Archivos */
    .archivos-grid {
      display: flex; flex-direction: column; gap: 8px; margin-top: 1rem;
    }
    .archivo-card {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.8rem 1rem; border-radius: 10px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      transition: background 0.15s;
    }
    .archivo-card:hover { background: #f1f5f9; }
    .archivo-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: #e0f2fe; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .archivo-icon .pi { font-size: 1.2rem; color: #0369a1; }
    .archivo-info {
      flex: 1; display: flex; flex-direction: column; gap: 2px;
      min-width: 0;
    }
    .archivo-nombre { font-size: 0.88rem; font-weight: 600; color: #334155; }
    .archivo-meta   { font-size: 0.75rem; color: #94a3b8; }
    .archivo-actions { display: flex; gap: 2px; flex-shrink: 0; }
  `]
})
export class HistoriaDetalleComponent implements OnInit {

  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private historiaService = inject(HistoriaClinicaService);
  private toast           = inject(MessageService);
  private confirmService  = inject(ConfirmationService);

  consulta = signal<ConsultaDetalle | null>(null);
  cargando = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('consultaId');
    if (id) this.cargar(Number(id));
    else this.router.navigate(['/pacientes']);
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.historiaService.obtenerConsulta(id).subscribe({
      next: res => { this.consulta.set(res.data); this.cargando.set(false); },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar la consulta' });
        this.router.navigate(['/pacientes']);
      }
    });
  }

  tieneSignosVitales(): boolean {
    const c = this.consulta();
    if (!c) return false;
    return !!(c.peso || c.talla || c.presionArterial || c.frecuenciaCardiaca
           || c.temperatura || c.saturacionOxigeno || c.semanasGestacion);
  }

  confirmarEliminar(): void {
    this.confirmService.confirm({
      message: '¿Desea eliminar esta consulta? La acción no se puede deshacer.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const c = this.consulta();
        if (!c) return;
        this.historiaService.eliminarConsulta(c.id).subscribe({
          next: () => {
            this.toast.add({ severity: 'warn', summary: 'Eliminado',
              detail: 'Consulta eliminada' });
            this.volver();
          }
        });
      }
    });
  }

  confirmarEliminarArchivo(archivo: ArchivoAdjunto): void {
    this.confirmService.confirm({
      message: `¿Eliminar el archivo <strong>${archivo.nombreOriginal}</strong>?`,
      header: 'Eliminar archivo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.historiaService.eliminarArchivo(archivo.id).subscribe({
          next: () => {
            this.toast.add({ severity: 'warn', summary: 'Eliminado',
              detail: 'Archivo eliminado' });
            this.cargar(this.consulta()!.id);
          }
        });
      }
    });
  }

  volver(): void {
    const hId = this.consulta()?.historiaClinicaId;
    if (hId) {
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

  getImcClase(): string {
    const v = this.consulta()?.imc;
    if (!v) return '';
    if (v < 18.5) return 'bajo';
    if (v < 25)   return 'normal';
    if (v < 30)   return 'sobrepeso';
    return 'obesidad';
  }

  getImcLabel(): string {
    const v = this.consulta()?.imc;
    if (!v) return '';
    if (v < 18.5) return 'Bajo peso';
    if (v < 25)   return 'Normal';
    if (v < 30)   return 'Sobrepeso';
    return 'Obesidad';
  }

  getArchivoIcon(archivo: ArchivoAdjunto): string {
    const mime = archivo.tipoMime ?? '';
    if (mime.includes('image'))  return 'pi-image';
    if (mime.includes('pdf'))    return 'pi-file-pdf';
    if (mime.includes('word') || mime.includes('docx')) return 'pi-file-word';
    if (mime.includes('sheet') || mime.includes('xlsx')) return 'pi-file-excel';
    return 'pi-file';
  }

  formatTamano(bytes: number): string {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}