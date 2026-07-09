import {
  Component, inject, signal, Input, OnInit, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { ButtonModule }        from 'primeng/button';
import { DialogModule }        from 'primeng/dialog';
import { TabViewModule }       from 'primeng/tabview';
import { InputTextModule }     from 'primeng/inputtext';
import { CheckboxModule }      from 'primeng/checkbox';
import { ToastModule }         from 'primeng/toast';
import { DividerModule }       from 'primeng/divider';
import { TooltipModule }       from 'primeng/tooltip';
import { MessageService }      from 'primeng/api';
import {InputTextarea} from 'primeng/inputtextarea';
import {DocumentoService, PedidoPayload} from '../../../core/services/documento.service';

// ── Estructura de un grupo de exámenes ───────────────────────────────────
interface GrupoExamen {
  clave:    string;
  titulo:   string;
  items:    string[];
}

@Component({
  selector: 'app-dialogo-laboratorio',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DialogModule, TabViewModule,
    InputTextModule, InputTextarea,
    CheckboxModule, ToastModule, DividerModule, TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- Botón disparador -->
    <p-button
      label="Pedido Laboratorio"
      icon="pi pi-clipboard"
      styleClass="btn-lab"
      pTooltip="Generar pedido de exámenes"
      tooltipPosition="bottom"
      (onClick)="abrir()"
    />

    <!-- ══ Diálogo ═════════════════════════════════════════════════════ -->
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '900px', maxWidth: '98vw' }"
      styleClass="dlg-lab"
    >
      <ng-template pTemplate="header">
        <div class="dlg-header">
          <i class="pi pi-clipboard"></i>
          <span>Pedido de Exámenes</span>
          @if (guardado()) {
            <span class="badge-guardada">
              <i class="pi pi-check"></i> Guardado
            </span>
          }
        </div>
      </ng-template>

      <!-- ══ Tabs: Laboratorio / Imagenología ════════════════════════ -->
      <p-tabView styleClass="tabs-lab" [(activeIndex)]="tabActivo">

        <!-- ── TAB LABORATORIO ──────────────────────────────────────── -->
        <p-tabPanel>
          <ng-template pTemplate="header">
            <span><i class="pi pi-flask tab-i"></i>Laboratorio</span>
          </ng-template>

          <!-- Datos paciente / embarazo -->
          <div class="datos-top">
            <div class="field-inline">
              <span class="campo-label">Embarazo:</span>
              <label class="chk-label">
                <p-checkbox [(ngModel)]="embarazoSi" [binary]="true" /> Sí
              </label>
              <label class="chk-label">
                <p-checkbox [(ngModel)]="embarazoNo" [binary]="true" /> No
              </label>
            </div>
            <div class="field-inline">
              <span class="campo-label">Sem/Gestación:</span>
              <input pInputText [(ngModel)]="semGestacion"
                     placeholder="XX semanas" style="width:120px" />
            </div>
          </div>

          <!-- Grid 3 columnas de exámenes -->
          <div class="examenes-grid">

            <!-- COLUMNA 1 -->
            <div class="exam-col">
              @for (grupo of gruposCol1; track grupo.clave) {
                <div class="grupo-examen">
                  <div class="grupo-titulo">{{ grupo.titulo }}</div>
                  @for (item of grupo.items; track item) {
                    <label class="exam-item">
                      <p-checkbox
                        [ngModel]="isChecked(grupo.clave, item)"
                        [binary]="true"
                        (onChange)="toggleExamen(grupo.clave, item, $event.checked)" />
                      <span>{{ item }}</span>
                    </label>
                  }
                </div>
              }
            </div>

            <!-- COLUMNA 2 -->
            <div class="exam-col border-col">
              @for (grupo of gruposCol2; track grupo.clave) {
                <div class="grupo-examen">
                  <div class="grupo-titulo">{{ grupo.titulo }}</div>
                  @for (item of grupo.items; track item) {
                    <label class="exam-item">
                      <p-checkbox
                        [ngModel]="isChecked(grupo.clave, item)"
                        [binary]="true"
                        (onChange)="toggleExamen(grupo.clave, item, $event.checked)" />
                      <span>{{ item }}</span>
                    </label>
                  }
                </div>
              }
            </div>

            <!-- COLUMNA 3 -->
            <div class="exam-col">
              @for (grupo of gruposCol3; track grupo.clave) {
                <div class="grupo-examen">
                  <div class="grupo-titulo">{{ grupo.titulo }}</div>
                  @for (item of grupo.items; track item) {
                    <label class="exam-item">
                      <p-checkbox
                        [ngModel]="isChecked(grupo.clave, item)"
                        [binary]="true"
                        (onChange)="toggleExamen(grupo.clave, item, $event.checked)" />
                      <span>{{ item }}</span>
                    </label>
                  }
                </div>
              }
              <!-- OTROS -->
              <div class="grupo-examen">
                <div class="grupo-titulo">OTROS</div>
                <textarea pInputTextarea [(ngModel)]="otrosLab"
                          rows="3" class="w-full"
                          placeholder="Especifique otros exámenes...">
                </textarea>
              </div>
            </div>

          </div>

          <!-- Campos clínicos -->
          <div class="campos-clinicos">
            <div class="field">
              <label>Resumen Clínico</label>
              <textarea pInputTextarea [(ngModel)]="resumenClinLab"
                        rows="2" class="w-full"
                        placeholder="Resumen del estado clínico del paciente...">
              </textarea>
            </div>
            <div class="field">
              <label>Diagnóstico</label>
              <input pInputText [(ngModel)]="diagnosticoLab" class="w-full"
                     placeholder="Diagnóstico principal..." />
            </div>
            <div class="field" style="max-width:180px">
              <label>CIE-10</label>
              <input pInputText [(ngModel)]="cieLab" placeholder="O80" class="w-full" />
            </div>
          </div>
        </p-tabPanel>

        <!-- ── TAB IMAGENOLOGÍA ──────────────────────────────────────── -->
        <p-tabPanel>
          <ng-template pTemplate="header">
            <span><i class="pi pi-image tab-i"></i>Imagenología</span>
          </ng-template>

          <!-- Tipo de estudio — multi-selección -->
          <div class="seccion-titulo">
            Tipo de Estudio
            <span class="sec-sub">Puede seleccionar uno o varios</span>
          </div>
          <div class="tipo-estudios">
            @for (tipo of tiposEstudio; track tipo) {
              <label class="tipo-card" [class.seleccionado]="tieneEstudio(tipo)"
                     (click)="toggleEstudio(tipo)">
                @if (tieneEstudio(tipo)) {
                  <i class="pi pi-check-circle check-activo"></i>
                } @else {
                  <i [class]="'pi ' + getTipoIcon(tipo)"></i>
                }
                <span>{{ tipo }}</span>
              </label>
            }
          </div>

          <div class="campos-imag">
            <div class="field field-full">
              <label>Descripción / Región anatómica</label>
              <input pInputText [(ngModel)]="descripcionImag" class="w-full"
                     placeholder="Ej: Ecografía obstétrica, Abdomen superior..." />
            </div>
            <div class="field field-full">
              <label>Motivo de Solicitud</label>
              <textarea pInputTextarea [(ngModel)]="motivoImag"
                        rows="3" class="w-full"
                        placeholder="Motivo clínico de la solicitud...">
              </textarea>
            </div>

            <!-- Monitoreo Fetal -->
            <div class="monitoreo-row">
              <label class="chk-label monitoreo">
                <p-checkbox [(ngModel)]="monitoreoFetal" [binary]="true" />
                <strong>MONITOREO FETAL ELECTRÓNICO</strong>
              </label>
              <div class="field-inline">
                <span class="campo-label">FUM:</span>
                <input pInputText [(ngModel)]="fum" placeholder="dd/mm/aaaa"
                       style="width:120px" />
              </div>
              <div class="field-inline">
                <span class="campo-label">EG:</span>
                <input pInputText [(ngModel)]="eg" placeholder="XX semanas"
                       style="width:100px" />
              </div>
            </div>

            <!-- Tabla Resumen Clínico -->
            <div class="field field-full">
              <label>Resumen Clínico</label>
              <textarea pInputTextarea [(ngModel)]="resumenClinImag"
                        rows="3" class="w-full"
                        placeholder="Resumen clínico del paciente...">
              </textarea>
            </div>
            <div class="field">
              <label>Diagnóstico</label>
              <input pInputText [(ngModel)]="diagnosticoImag" class="w-full"
                     placeholder="Diagnóstico..." />
            </div>
            <div class="field" style="max-width:180px">
              <label>CIE-10</label>
              <input pInputText [(ngModel)]="cieImag" placeholder="O80" class="w-full" />
            </div>
            <div class="field field-full">
              <label>Observaciones</label>
              <textarea pInputTextarea [(ngModel)]="observacionesImag"
                        rows="2" class="w-full" placeholder="Observaciones adicionales...">
              </textarea>
            </div>
          </div>
        </p-tabPanel>

      </p-tabView>

      <!-- ══ Footer ════════════════════════════════════════════════════ -->
      <ng-template pTemplate="footer">
        <div class="dlg-footer">
          <p-button label="Cancelar" [text]="true" severity="secondary"
                    (onClick)="visible = false" />
          <div class="footer-acciones">
            <p-button
              label="Guardar"
              icon="pi pi-save"
              severity="secondary" [outlined]="true"
              [loading]="guardando()"
              (onClick)="guardar()" />
            <p-button
              label="Previsualizar PDF"
              icon="pi pi-eye"
              severity="secondary" [outlined]="true"
              [loading]="generando()"
              (onClick)="previsualizar()" />
            <p-button
              label="Descargar PDF"
              icon="pi pi-file-pdf"
              styleClass="btn-lab"
              [loading]="generando()"
              (onClick)="descargar()" />
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :deep(.btn-lab) {
      background: linear-gradient(135deg, #7c3aed, #5b21b6) !important;
      border-color: #5b21b6 !important; color: white !important;
    }

    :deep(.dlg-lab .p-dialog-header) {
      background: linear-gradient(135deg, #0a2342, #1a4a7a);
      color: white; border-radius: 12px 12px 0 0;
    }
    :deep(.dlg-lab .p-dialog-header .p-dialog-title) { color: white; }
    :deep(.dlg-lab .p-dialog-header-close) { color: white !important; }

    .dlg-header {
      display: flex; align-items: center; gap: 10px; font-weight: 700;
    }
    .dlg-header .pi { color: #7c3aed; font-size: 1.1rem; }
    .badge-guardada {
      background: #16a34a; color: white; font-size: .72rem; font-weight: 700;
      padding: 2px 10px; border-radius: 20px;
      display: flex; align-items: center; gap: 4px;
    }

    /* ── Tabs ─────────────────────────────────────────────────────────── */
    :deep(.tabs-lab .p-tabview-nav) {
      background: #f8f4ff; padding: 0 1rem;
    }
    :deep(.tabs-lab .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
      color: #7c3aed; border-color: #7c3aed;
    }
    :deep(.tabs-lab .p-tabview-panels) { padding: 1rem; }
    .tab-i { margin-right: 6px; }

    /* ── Datos paciente ───────────────────────────────────────────────── */
    .datos-top {
      display: flex; gap: 1.5rem; flex-wrap: wrap;
      background: #f8f4ff; border-radius: 10px;
      padding: .75rem 1rem; margin-bottom: 1rem;
    }
    .field-inline {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    }
    .campo-label { font-size: .82rem; font-weight: 700; color: #334155; }
    .chk-label {
      display: flex; align-items: center; gap: 5px;
      font-size: .82rem; cursor: pointer; color: #334155;
    }

    /* ── Grid exámenes ────────────────────────────────────────────────── */
    .examenes-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      gap: 0; max-height: 400px; overflow-y: auto;
      border: 1px solid #e2e8f0; border-radius: 10px;
      margin-bottom: 1rem;
    }
    .exam-col { padding: .75rem; }
    .border-col {
      border-left: 1.5px solid #e9d5ff;
      border-right: 1.5px solid #e9d5ff;
    }

    .grupo-examen { margin-bottom: .75rem; }
    .grupo-titulo {
      background: #7c3aed; color: white;
      font-size: .7rem; font-weight: 800; letter-spacing: .5px;
      padding: 4px 8px; border-radius: 4px;
      margin-bottom: .4rem; text-transform: uppercase;
    }
    .exam-item {
      display: flex; align-items: center; gap: 6px;
      font-size: .75rem; color: #334155;
      padding: 1px 0; cursor: pointer; line-height: 1.4;
    }
    .exam-item:hover { color: #7c3aed; }

    /* ── Campos clínicos ──────────────────────────────────────────────── */
    .campos-clinicos {
      display: flex; gap: 1rem; flex-wrap: wrap;
      background: #f8fafc; border-radius: 10px; padding: .75rem 1rem;
    }
    .campos-clinicos .field { flex: 1; min-width: 200px; }
    .seccion-titulo {
      font-size: .85rem; font-weight: 800; color: #334155;
      margin-bottom: .75rem; padding-bottom: .4rem;
      border-bottom: 2px solid #e9d5ff;
    }

    /* ── Imagenología ─────────────────────────────────────────────────── */
    .tipo-estudios {
      display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem;
    }
    .tipo-card {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: .6rem .9rem; border: 1.5px solid #e2e8f0;
      border-radius: 10px; cursor: pointer; min-width: 90px;
      font-size: .78rem; font-weight: 600; color: #64748b;
      transition: all .15s;
    }
    .tipo-card .pi { font-size: 1.2rem; color: #94a3b8; }
    .tipo-card:hover {
      border-color: #7c3aed; color: #7c3aed; background: #f5f3ff;
    }
    .sec-sub {
      font-size: .72rem; font-weight: 400;
      color: #94a3b8; margin-left: 8px;
    }
    .check-activo {
      color: #16a34a !important;
      font-size: 1.1rem;
    }
    .tipo-card.seleccionado {
      border-color: #7c3aed; color: #7c3aed;
      background: #f5f3ff;
    }
    .tipo-card.seleccionado .pi { color: #7c3aed; }

    .campos-imag {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: .75rem;
    }
    .field-full { grid-column: 1 / -1; }

    .monitoreo-row {
      grid-column: 1 / -1; display: flex; align-items: center;
      gap: 1.5rem; flex-wrap: wrap;
      background: #fdf2f8; border: 1px solid #fce4ec;
      border-radius: 10px; padding: .6rem 1rem;
    }
    .monitoreo { font-size: .85rem; gap: 8px; }

    /* ── Footer ───────────────────────────────────────────────────────── */
    .dlg-footer {
      display: flex; justify-content: space-between;
      align-items: center; flex-wrap: wrap; gap: .75rem;
    }
    .footer-acciones { display: flex; gap: .6rem; flex-wrap: wrap; }

    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: .82rem; font-weight: 600; color: #334155; }

    :deep(textarea.p-inputtextarea) { border-radius: 8px !important; resize: vertical; }
    :deep(.p-inputtext) { border-radius: 8px !important; }
  `]
})
export class DialogoLaboratorioComponent implements OnInit, OnChanges {

  private docSvc = inject(DocumentoService);
  private toast  = inject(MessageService);

  @Input() consultaId!: number;

  // ── Estado ───────────────────────────────────────────────────────────────
  visible    = false;
  tabActivo  = 0;
  guardando  = signal(false);
  generando  = signal(false);
  guardado   = signal(false);

  // Mapa de exámenes seleccionados: { clave: [item1, item2, ...] }
  seleccionados: Record<string, string[]> = {};

  // Campos laboratorio
  embarazoSi    = false;
  embarazoNo    = false;
  semGestacion  = '';
  resumenClinLab = '';
  diagnosticoLab = '';
  cieLab        = '';
  otrosLab      = '';

  // Campos imagenología
  tiposEstudioSel: string[] = [];   // multi-selección de tipos de estudio
  descripcionImag    = '';
  motivoImag         = '';
  monitoreoFetal     = false;
  fum                = '';
  eg                 = '';
  resumenClinImag    = '';
  diagnosticoImag    = '';
  cieImag            = '';
  observacionesImag  = '';

  // ── Definición de todos los grupos ───────────────────────────────────────
  readonly tiposEstudio = ['RX CONVENCIONAL','ECOGRAFÍA','TOMOGRAFÍA','RMN','OTROS'];

  readonly gruposCol1: GrupoExamen[] = [
    { clave: 'hematologia', titulo: 'HEMATOLOGÍA', items: [
        'Biometría Hemática','Hematocrito','Hemoglobina',
        'Plaquetas','Reticulocitos','VSG.'
      ]},
    { clave: 'inmunohematologia', titulo: 'INMUNOHEMATOLOGÍA', items: [
        'Grupo Sanguíneo','Coombs Directo','Coombs Indirecto'
      ]},
    { clave: 'coagulacion', titulo: 'COAGULACIÓN / FIBRINÓLISIS', items: [
        'TP','TTP','INR','Tiempo de Coagulación','Tiempo de Sangría',
        'Anticoagulante Lúpico','Dímero D.','Proteína CyS',
        'Antitrombina III','Factor de Von-Willebrand'
      ]},
    { clave: 'quimicaSanguinea', titulo: 'QUÍMICA SANGUÍNEA', items: [
        'Glucosa Basal','Glucosa 2H Post Prandial','Glucosa / Creatinina',
        'Ácido Úrico','Colesterol Total','Triglicéridos',
        'Bilirrubina Total Directa Indirecta',
        'Proteínas Totales','Albúmina / Globulina','Test de Sullivan',
        'Curva de tolerancia de la glucosa Hrs.','Hemoglobina Glicosilada',
        'Ferritina / Transferrina','Hierro Sérico'
      ]},
    { clave: 'serologia', titulo: 'SEROLOGÍA', items: [
        'VIH','VDRL','FTA-ABS','Hepatitis B (HBsAg)','Hepatitis C (Anti HVC)'
      ]}
  ];

  readonly gruposCol2: GrupoExamen[] = [
    { clave: 'electrolitos', titulo: 'ELECTROLITOS', items: [
        'Sodio - Potasio - Cloro','Calcio Total','Magnesio'
      ]},
    { clave: 'enzimas', titulo: 'ENZIMAS', items: [
        'TGO / AST','TGP / ALT','Lactato Deshidrogenasa LDH',
        'Fosfatasa Alcalina','Fosfatasa Ácida Total','Amilasa','Gamma GT'
      ]},
    { clave: 'reactantes', titulo: 'REACTANTES DE FASE AGUDA', items: [
        'PCR Cuantitativo','Procalcitonina PCT','Interleucina 6 (IL-6)'
      ]},
    { clave: 'inmunologia', titulo: 'INMUNOLOGÍA', items: [
        'Anti Nucleares','Anti DNA',
        'Anti Fosfolípidos IgG IgM IgA',
        'Anti Cardiolipinas IgG IgM IgA',
        'B2 Glicoproteína IgG IgM IgA'
      ]},
    { clave: 'orina', titulo: 'ORINA', items: [
        'EMO','Cultivo / Antibiograma','Gram / Gota fresca',
        'Microalbumina','Índice Proteinuria / Creatinuria'
      ]},
    { clave: 'heces', titulo: 'HECES', items: [
        'Coproparasitario','PMN','Sangre Oculta','Rotavirus'
      ]},
    { clave: 'marcadoresTumorales', titulo: 'MARCADORES TUMORALES', items: [
        'CA 125','HE-4','Alfafetoproteína',
        'Índice ROMA','CA 15-3','CEA','CA 19-9'
      ]}
  ];

  readonly gruposCol3: GrupoExamen[] = [
    { clave: 'microbiologia', titulo: 'MICROBIOLOGÍA', items: [
        'Gram','Fresco','KOH','Cultivo'
      ]},
    { clave: 'hormonas', titulo: 'HORMONAS', items: [
        'Luteinizante LH','FSH','Prolactina','Estradiol (E2)',
        'Progesterona (P4)','Testosterona Total','Testosterona Libre',
        'DHEAS','Cortisol','Insulina','Índice Homa','Vitamina D',
        'BHCG Cualitativa','BHCG Cuantitativa',
        'TSH','T3','FT4','17 OH-Progesterona','H. Antimulleriana'
      ]},
    { clave: 'estudiosEspeciales', titulo: 'ESTUDIOS ESPECIALES', items: [
        'TORCH IgG','TORCH IgM','Toxoplasma - Test de avidez',
        'Clamydia Trachomatis IgG-IgM','Proteinuria en 24 horas',
        'Paptest / Citología','Genotipificación de HPV',
        'Capacitación Espermática','Cristalografía','Screening Prenatal'
      ]}
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['consultaId'] && this.consultaId) {
      this.cargarExistente('LABORATORIO');
    }
  }

  abrir(): void {
    this.cargarExistente(this.tabActivo === 0 ? 'LABORATORIO' : 'IMAGENOLOGIA');
    this.visible = true;
  }

  private cargarExistente(tipo: string): void {
    if (!this.consultaId) return;
    this.docSvc.obtenerPedido(this.consultaId, tipo).subscribe({
      next: r => {
        if (!r.data) return;
        this.seleccionados = r.data.examenesSeleccionados ?? {};
        if (tipo === 'LABORATORIO') {
          this.embarazoSi     = r.data.embarazo === true;
          this.embarazoNo     = r.data.embarazo === false;
          this.semGestacion   = r.data.semGestacion ?? '';
          this.resumenClinLab = r.data.resumenClinico ?? '';
          this.diagnosticoLab = r.data.diagnostico ?? '';
          this.cieLab         = r.data.codigoCie10 ?? '';
        } else {
          // Cargar tipos de estudio (puede venir como string o array)
          const te = r.data.tipoEstudio;
          if (Array.isArray(te)) {
            this.tiposEstudioSel = te;
          } else if (te) {
            this.tiposEstudioSel = [te];
          } else {
            this.tiposEstudioSel = [];
          }
          this.descripcionImag   = r.data.descripcion ?? '';
          this.motivoImag        = r.data.motivoSolicitud ?? '';
          this.monitoreoFetal    = r.data.monitoreoFetal ?? false;
          this.fum               = r.data.fum ?? '';
          this.eg                = r.data.eg ?? '';
          this.resumenClinImag   = r.data.resumenClinico ?? '';
          this.diagnosticoImag   = r.data.diagnostico ?? '';
          this.cieImag           = r.data.codigoCie10 ?? '';
          this.observacionesImag = r.data.observaciones ?? '';
        }
        this.guardado.set(true);
      },
      error: () => { /* sin pedido previo */ }
    });
  }

  // ── Checkboxes ────────────────────────────────────────────────────────────
  isChecked(clave: string, item: string): boolean {
    return (this.seleccionados[clave] ?? []).includes(item);
  }

  tieneEstudio(tipo: string): boolean {
    return this.tiposEstudioSel.includes(tipo);
  }

  toggleEstudio(tipo: string): void {
    if (this.tiposEstudioSel.includes(tipo)) {
      this.tiposEstudioSel = this.tiposEstudioSel.filter(t => t !== tipo);
    } else {
      this.tiposEstudioSel = [...this.tiposEstudioSel, tipo];
    }
  }

  toggleExamen(clave: string, item: string, checked: boolean): void {
    const actual = [...(this.seleccionados[clave] ?? [])];
    if (checked) {
      if (!actual.includes(item)) actual.push(item);
    } else {
      const idx = actual.indexOf(item);
      if (idx > -1) actual.splice(idx, 1);
    }
    this.seleccionados = { ...this.seleccionados, [clave]: actual };
  }

  getTipoIcon(tipo: string): string {
    const m: Record<string,string> = {
      'RX CONVENCIONAL': 'pi-sun', 'ECOGRAFÍA': 'pi-wave-pulse',
      'TOMOGRAFÍA': 'pi-sync', 'RMN': 'pi-circle',
      'OTROS': 'pi-list'
    };
    return m[tipo] ?? 'pi-list';
  }

  // ── Acciones ──────────────────────────────────────────────────────────────
  guardar(): void {
    this.guardando.set(true);
    this.docSvc.guardarPedido(this.consultaId, this.buildPayload()).subscribe({
      next: () => {
        this.guardado.set(true);
        this.guardando.set(false);
        this.toast.add({ severity: 'success', summary: 'Guardado',
          detail: 'Pedido guardado en la historia clínica' });
      },
      error: () => {
        this.guardando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo guardar el pedido' });
      }
    });
  }

  previsualizar(): void {
    this.generando.set(true);
    this.docSvc.generarPdfPedido(this.consultaId, this.buildPayload()).subscribe({
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
    const tipo = this.tabActivo === 0 ? 'laboratorio' : 'imagenologia';
    this.docSvc.generarPdfPedido(this.consultaId, this.buildPayload()).subscribe({
      next: blob => {
        this.docSvc.descargarPdf(blob,
          `pedido_${tipo}_consulta_${this.consultaId}.pdf`);
        this.generando.set(false);
      },
      error: () => {
        this.generando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo descargar el PDF' });
      }
    });
  }

  private buildPayload(): PedidoPayload {
    const esLab = this.tabActivo === 0;
    return {
      tipo: esLab ? 'LABORATORIO' : 'IMAGENOLOGIA',
      examenesSeleccionados: this.seleccionados,
      tipoEstudio: esLab ? undefined
        : (this.tiposEstudioSel.length === 1
          ? this.tiposEstudioSel[0]
          : this.tiposEstudioSel.join(', ')),
      descripcion:     esLab ? undefined : this.descripcionImag,
      motivoSolicitud: esLab ? undefined : this.motivoImag,
      monitoreoFetal:  esLab ? undefined : this.monitoreoFetal,
      fum:             esLab ? undefined : this.fum,
      eg:              esLab ? undefined : this.eg,
      embarazo:        esLab ? this.embarazoSi : undefined,
      semGestacion:    esLab ? this.semGestacion : undefined,
      resumenClinico:  esLab ? this.resumenClinLab  : this.resumenClinImag,
      diagnostico:     esLab ? this.diagnosticoLab  : this.diagnosticoImag,
      codigoCie10:     esLab ? this.cieLab          : this.cieImag,
      observaciones:   esLab ? undefined            : this.observacionesImag,
    };
  }
}
