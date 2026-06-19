import {
  Component, inject, signal, Input, OnInit, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { ButtonModule }        from 'primeng/button';
import { DialogModule }        from 'primeng/dialog';
import { InputTextModule }     from 'primeng/inputtext';
import { Textarea } from 'primeng/inputtextarea';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { TooltipModule }       from 'primeng/tooltip';
import { MessageService }      from 'primeng/api';
import {DocumentoService, MedicamentoDto, RecetaPayload} from '../../../core/services/documento.service';

@Component({
  selector: 'app-dialogo-receta',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DialogModule, InputTextModule,
    Textarea, ToastModule, DividerModule, TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- Botón disparador — se incluye en el padre -->
    <p-button
      label="Receta Médica"
      icon="pi pi-file-edit"
      styleClass="btn-receta"
      pTooltip="Generar receta médica"
      tooltipPosition="bottom"
      (onClick)="abrir()"
    />

    <!-- ══ Diálogo ═════════════════════════════════════════════════════ -->
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '820px', maxWidth: '96vw' }"
      styleClass="dlg-receta"
    >
      <ng-template pTemplate="header">
        <div class="dlg-header">
          <i class="pi pi-file-edit"></i>
          <span>Receta Médica</span>
          @if (guardada()) {
            <span class="badge-guardada">
              <i class="pi pi-check"></i> Guardada
            </span>
          }
        </div>
      </ng-template>

      <div class="receta-body">

        <!-- ══ COLUMNA IZQUIERDA: Medicamentos ══════════════════════════ -->
        <div class="receta-col">
          <div class="col-titulo rp">
            <span class="rp-script">Rp:</span>
            <span class="col-sub">Medicamentos prescritos</span>
          </div>

          <!-- Lista de medicamentos agregados -->
          @if (medicamentos().length > 0) {
            <div class="med-lista">
              @for (med of medicamentos(); track $index; let i = $index) {
                <div class="med-item">
                  <div class="med-item-body">
                    <span class="med-nombre">{{ med.nombre }}</span>
                    <span class="med-detalle">
                      {{ med.dosis }}
                      @if (med.cantidad) { · {{ med.cantidad }} }
                    </span>
                    @if (med.indicaciones) {
                      <span class="med-ind">{{ med.indicaciones }}</span>
                    }
                  </div>
                  <p-button
                    icon="pi pi-trash" [rounded]="true" [text]="true"
                    severity="danger" pTooltip="Eliminar"
                    (onClick)="eliminarMed(i)" />
                </div>
              }
            </div>
          }

          <!-- Formulario agregar medicamento -->
          <div class="med-form">
            <div class="med-form-titulo">
              <i class="pi pi-plus-circle"></i> Agregar medicamento
            </div>
            <div class="med-grid">
              <div class="field">
                <label>Medicamento *</label>
                <input pInputText [(ngModel)]="nuevoNombre"
                       placeholder="Nombre del medicamento" class="w-full" />
              </div>
              <div class="field">
                <label>Dosis *</label>
                <input pInputText [(ngModel)]="nuevaDosis"
                       placeholder="Ej: 500 mg, 1 tableta" class="w-full" />
              </div>
              <div class="field">
                <label>Cantidad</label>
                <input pInputText [(ngModel)]="nuevaCantidad"
                       placeholder="Ej: 21 tabletas" class="w-full" />
              </div>
              <div class="field field-full">
                <label>Indicaciones de administración</label>
                <input pInputText [(ngModel)]="nuevasIndicaciones"
                       placeholder="Ej: 1 tableta cada 8 horas por 7 días" class="w-full" />
              </div>
            </div>
            <p-button
              label="Agregar" icon="pi pi-plus"
              styleClass="btn-agregar"
              [disabled]="!nuevoNombre || !nuevaDosis"
              (onClick)="agregarMed()" />
          </div>
        </div>

        <!-- Línea divisora vertical -->
        <div class="receta-divider"></div>

        <!-- ══ COLUMNA DERECHA: Indicaciones ════════════════════════════ -->
        <div class="receta-col">
          <div class="col-titulo indicaciones">
            <i class="pi pi-list-check"></i>
            INDICACIONES
          </div>

          <div class="field" style="margin-bottom:1rem">
            <label>Prescripción e indicaciones generales</label>
            <textarea pInputTextarea [(ngModel)]="prescripcion"
                      rows="8" class="w-full"
                      placeholder="Escriba las indicaciones para la paciente...
&#10;Ejemplo:
&#10;- Reposo relativo
&#10;- Dieta blanda
&#10;- Abundante hidratación
&#10;- Evitar esfuerzos físicos">
            </textarea>
          </div>

          <div class="field">
            <label>Próxima cita / Control</label>
            <input pInputText [(ngModel)]="proximaCita"
                   placeholder="Ej: Regresar en 15 días para control"
                   class="w-full" />
          </div>

          <!-- Vista previa del formato recetario -->
          <div class="preview-box">
            <div class="preview-titulo">Vista previa del formato</div>
            <div class="preview-cuerpo">
              <span class="preview-rp">Rp:</span>
              @for (med of medicamentos(); track $index) {
                <div class="preview-med">
                  <strong>{{ med.nombre }}</strong>
                  <span>{{ med.dosis }}
                    @if (med.cantidad) { · {{ med.cantidad }} }
                  </span>
                  @if (med.indicaciones) {
                    <em>{{ med.indicaciones }}</em>
                  }
                </div>
              }
              @if (medicamentos().length === 0) {
                <span class="preview-vacio">Sin medicamentos</span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- ══ Footer ════════════════════════════════════════════════════ -->
      <ng-template pTemplate="footer">
        <div class="dlg-footer">
          <p-button label="Cancelar" [text]="true" severity="secondary"
                    (onClick)="visible = false" />
          <div class="footer-acciones">
            <p-button
              label="Guardar"
              icon="pi pi-save"
              severity="secondary"
              [outlined]="true"
              [loading]="guardando()"
              [disabled]="!puedeGuardar()"
              pTooltip="Guarda la receta en la historia clínica"
              (onClick)="guardar()" />
            <p-button
              label="Previsualizar PDF"
              icon="pi pi-eye"
              severity="secondary"
              [outlined]="true"
              [loading]="generando()"
              [disabled]="!puedeGuardar()"
              (onClick)="previsualizar()" />
            <p-button
              label="Descargar PDF"
              icon="pi pi-file-pdf"
              styleClass="btn-receta"
              [loading]="generando()"
              [disabled]="!puedeGuardar()"
              (onClick)="descargar()" />
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* ── Botón disparador ─────────────────────────────────────────────── */
    :deep(.btn-receta) {
      background: linear-gradient(135deg, #e91e8c, #c2185b) !important;
      border-color: #c2185b !important; color: white !important;
    }

    /* ── Header del diálogo ───────────────────────────────────────────── */
    :deep(.dlg-receta .p-dialog-header) {
      background: linear-gradient(135deg, #0a2342, #1a4a7a);
      color: white; border-radius: 12px 12px 0 0;
    }
    :deep(.dlg-receta .p-dialog-header .p-dialog-title) { color: white; }
    :deep(.dlg-receta .p-dialog-header-close) { color: white !important; }

    .dlg-header {
      display: flex; align-items: center; gap: 10px; font-weight: 700;
    }
    .dlg-header .pi { color: #e91e8c; font-size: 1.1rem; }
    .badge-guardada {
      background: #16a34a; color: white;
      font-size: .72rem; font-weight: 700;
      padding: 2px 10px; border-radius: 20px;
      display: flex; align-items: center; gap: 4px;
    }

    /* ── Cuerpo: dos columnas ─────────────────────────────────────────── */
    .receta-body {
      display: flex; gap: 0; min-height: 480px;
    }
    .receta-col {
      flex: 1; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;
    }
    .receta-divider {
      width: 1.5px; background: linear-gradient(180deg, #fce4ec, #e91e8c, #fce4ec);
      flex-shrink: 0; margin: 0.5rem 0;
    }

    /* ── Títulos de columna ───────────────────────────────────────────── */
    .col-titulo {
      display: flex; align-items: center; gap: 8px;
      padding-bottom: .75rem; border-bottom: 2px solid #fce4ec;
      margin-bottom: .25rem;
    }
    .rp-script {
      font-family: Georgia, serif; font-style: italic;
      font-size: 1.6rem; font-weight: 700; color: #e91e8c; line-height: 1;
    }
    .col-sub { font-size: .78rem; color: #94a3b8; margin-top: 4px; }
    .col-titulo.indicaciones {
      font-size: 1rem; font-weight: 800; color: #0a2342;
      letter-spacing: .5px;
    }
    .col-titulo.indicaciones .pi { color: #e91e8c; }

    /* ── Lista medicamentos ───────────────────────────────────────────── */
    .med-lista {
      display: flex; flex-direction: column; gap: .5rem; max-height: 180px;
      overflow-y: auto;
    }
    .med-item {
      display: flex; align-items: flex-start; gap: .5rem;
      background: #fdf2f8; border: 1px solid #f8bbd0;
      border-radius: 10px; padding: .6rem .8rem;
    }
    .med-item-body {
      display: flex; flex-direction: column; gap: 2px; flex: 1;
    }
    .med-nombre  { font-weight: 700; color: #0a2342; font-size: .9rem; }
    .med-detalle { font-size: .78rem; color: #c2185b; font-weight: 600; }
    .med-ind     { font-size: .75rem; color: #64748b; font-style: italic; }

    /* ── Formulario agregar ───────────────────────────────────────────── */
    .med-form {
      background: #f8fafc; border: 1.5px dashed #e2e8f0;
      border-radius: 12px; padding: 1rem;
    }
    .med-form-titulo {
      font-size: .82rem; font-weight: 700; color: #334155;
      display: flex; align-items: center; gap: 6px;
      margin-bottom: .75rem;
    }
    .med-form-titulo .pi { color: #e91e8c; }
    .med-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: .65rem; margin-bottom: .75rem;
    }
    .field-full { grid-column: 1 / -1; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: .78rem; font-weight: 600; color: #334155; }

    :deep(.btn-agregar) {
      background: #fce4ec !important; color: #c2185b !important;
      border: 1px solid #f8bbd0 !important; font-weight: 700 !important;
    }

    /* ── Vista previa ─────────────────────────────────────────────────── */
    .preview-box {
      background: #fffbeb; border: 1px solid #fde68a;
      border-radius: 10px; padding: .75rem 1rem;
    }
    .preview-titulo {
      font-size: .72rem; font-weight: 700; color: #92400e;
      text-transform: uppercase; letter-spacing: .5px; margin-bottom: .5rem;
    }
    .preview-cuerpo { display: flex; flex-direction: column; gap: 4px; }
    .preview-rp {
      font-family: Georgia, serif; font-style: italic;
      font-size: 1.1rem; color: #e91e8c; font-weight: 700;
    }
    .preview-med {
      display: flex; flex-direction: column; margin-left: 1rem;
    }
    .preview-med strong { font-size: .82rem; color: #0a2342; }
    .preview-med span   { font-size: .75rem; color: #64748b; }
    .preview-med em     { font-size: .72rem; color: #94a3b8; font-style: normal; }
    .preview-vacio      { font-size: .78rem; color: #94a3b8; font-style: italic; }

    /* ── Footer ───────────────────────────────────────────────────────── */
    .dlg-footer {
      display: flex; justify-content: space-between;
      align-items: center; flex-wrap: wrap; gap: .75rem;
    }
    .footer-acciones { display: flex; gap: .6rem; flex-wrap: wrap; }

    :deep(textarea.p-inputtextarea) {
      border-radius: 10px !important; resize: vertical;
    }
    :deep(.p-inputtext) { border-radius: 8px !important; }
  `]
})
export class DialogoRecetaComponent implements OnInit, OnChanges {

  private docSvc = inject(DocumentoService);
  private toast  = inject(MessageService);

  /** ID de la consulta actual */
  @Input() consultaId!: number;

  // ── Estado ──────────────────────────────────────────────────────────────
  visible   = false;
  guardando = signal(false);
  generando = signal(false);
  guardada  = signal(false);

  medicamentos = signal<MedicamentoDto[]>([]);
  prescripcion  = '';
  proximaCita   = '';

  // Campos del formulario agregar
  nuevoNombre        = '';
  nuevaDosis         = '';
  nuevaCantidad      = '';
  nuevasIndicaciones = '';

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['consultaId'] && this.consultaId) {
      this.cargarRecetaExistente();
    }
  }

  // ── Acciones ─────────────────────────────────────────────────────────────
  abrir(): void {
    this.cargarRecetaExistente();
    this.visible = true;
  }

  private cargarRecetaExistente(): void {
    if (!this.consultaId) return;
    this.docSvc.obtenerReceta(this.consultaId).subscribe({
      next: r => {
        if (r.data) {
          this.medicamentos.set(r.data.medicamentos ?? []);
          this.prescripcion  = r.data.prescripcion  ?? '';
          this.proximaCita   = r.data.proximaCita   ?? '';
          this.guardada.set(true);
        }
      },
      error: () => { /* sin receta previa — no pasa nada */ }
    });
  }

  agregarMed(): void {
    if (!this.nuevoNombre || !this.nuevaDosis) return;
    this.medicamentos.update(list => [...list, {
      nombre:       this.nuevoNombre,
      dosis:        this.nuevaDosis,
      cantidad:     this.nuevaCantidad,
      indicaciones: this.nuevasIndicaciones
    }]);
    this.nuevoNombre = '';
    this.nuevaDosis  = '';
    this.nuevaCantidad      = '';
    this.nuevasIndicaciones = '';
  }

  eliminarMed(idx: number): void {
    this.medicamentos.update(list => list.filter((_, i) => i !== idx));
  }

  guardar(): void {
    this.guardando.set(true);
    this.docSvc.guardarReceta(this.consultaId, this.buildPayload()).subscribe({
      next: () => {
        this.guardada.set(true);
        this.guardando.set(false);
        this.toast.add({ severity: 'success', summary: 'Guardada',
          detail: 'Receta guardada en la historia clínica' });
      },
      error: () => {
        this.guardando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo guardar la receta' });
      }
    });
  }

  previsualizar(): void {
    this.generando.set(true);
    this.docSvc.generarPdfReceta(this.consultaId, this.buildPayload()).subscribe({
      next: blob => {
        this.docSvc.previsualizarPdf(blob);
        this.generando.set(false);
      },
      error: () => {
        this.generando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo generar el PDF' });
      }
    });
  }

  descargar(): void {
    this.generando.set(true);
    this.docSvc.generarPdfReceta(this.consultaId, this.buildPayload()).subscribe({
      next: blob => {
        this.docSvc.descargarPdf(blob, `receta_consulta_${this.consultaId}.pdf`);
        this.generando.set(false);
      },
      error: () => {
        this.generando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo descargar el PDF' });
      }
    });
  }

  puedeGuardar(): boolean {
    return this.medicamentos().length > 0 || !!this.prescripcion.trim();
  }

  private buildPayload(): RecetaPayload {
    return {
      medicamentos: this.medicamentos(),
      prescripcion: this.prescripcion,
      proximaCita:  this.proximaCita
    };
  }
}
