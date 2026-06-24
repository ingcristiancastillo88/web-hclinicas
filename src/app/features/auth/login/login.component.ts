import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule }   from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule }  from 'primeng/password';
import { CheckboxModule }  from 'primeng/checkbox';
import { ToastModule }     from 'primeng/toast';
import { RippleModule }    from 'primeng/ripple';
import { AuthService }     from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, PasswordModule,
    CheckboxModule, ToastModule, RippleModule
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-right" />

    <div class="login-wrapper">

      <!-- Panel izquierdo — branding médico -->
      <aside class="login-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <span class="logo-icon"><i class="pi pi-heart-fill"></i></span>
            <span class="logo-pulse"></span>
          </div>
          <h1 class="brand-title">Clínica<br/><strong>San Juan</strong></h1>
          <p class="brand-subtitle">
            Sistema Integral de Gestión de<br/>
            Historias Clínicas en Ginecología<br/>y Obstetricia
          </p>
          <div class="brand-stats">
            <div class="stat"><span class="stat-num">100%</span><span class="stat-lbl">Digital</span></div>
            <div class="stat-div"></div>
            <div class="stat"><span class="stat-num">24/7</span><span class="stat-lbl">Disponible</span></div>
            <div class="stat-div"></div>
            <div class="stat"><span class="stat-num">SSL</span><span class="stat-lbl">Seguro</span></div>
          </div>
          <div class="brand-deco">
            <div class="deco-circle c1"></div>
            <div class="deco-circle c2"></div>
            <div class="deco-circle c3"></div>
            <div class="ecg-line">
              <svg viewBox="0 0 300 60" preserveAspectRatio="none">
                <polyline points="0,30 40,30 55,30 60,10 65,50 70,10 75,50 80,30 120,30 135,30 140,5 148,55 155,5 162,55 168,30 210,30 240,30 255,30 260,12 265,48 270,12 275,48 280,30 300,30" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
              </svg>
            </div>
          </div>
        </div>
      </aside>

      <!-- Panel derecho — formulario -->
      <main class="login-form-panel">
        <div class="form-container">

          <div class="form-header">
            <div class="form-icon">
              <i class="pi pi-lock"></i>
            </div>
            <h2>Iniciar Sesión</h2>
            <p>Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <!-- ── Aviso de sesión expirada por inactividad ── -->
          @if (sesionExpirada()) {
            <div class="aviso-inactividad">
              <i class="pi pi-clock"></i>
              <span>
                Tu sesión fue cerrada por <strong>inactividad</strong>.
                Por favor vuelve a ingresar tus credenciales.
              </span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" autocomplete="off">

            <!-- Correo -->
            <div class="field">
              <label for="correo">Correo electrónico</label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-envelope"></i>
                <input
                  pInputText
                  id="correo"
                  type="email"
                  formControlName="correo"
                  placeholder="usuario@clinica.com"
                  class="w-full"
                  [class.ng-invalid]="isInvalid('correo')"
                />
              </span>
              @if (isInvalid('correo')) {
                <small class="error-msg">
                  <i class="pi pi-exclamation-circle"></i>
                  {{ getError('correo') }}
                </small>
              }
            </div>

            <!-- Contraseña -->
            <div class="field">
              <label for="contrasena">Contraseña</label>
              <p-password
                id="contrasena"
                formControlName="contrasena"
                placeholder="••••••••"
                [feedback]="false"
                [toggleMask]="true"
                styleClass="w-full"
                inputStyleClass="w-full"
                [class.ng-invalid]="isInvalid('contrasena')"
              />
              @if (isInvalid('contrasena')) {
                <small class="error-msg">
                  <i class="pi pi-exclamation-circle"></i>
                  {{ getError('contrasena') }}
                </small>
              }
            </div>

            <!-- Botón submit -->
            <p-button
              type="submit"
              label="Ingresar al Sistema"
              icon="pi pi-sign-in"
              iconPos="right"
              styleClass="w-full login-btn"
              [loading]="cargando()"
              [disabled]="loginForm.invalid || cargando()"
            />

          </form>

          <div class="form-footer">
            <i class="pi pi-shield"></i>
            <span>Conexión segura · Todos los accesos son registrados</span>
          </div>

        </div>
      </main>

    </div>
  `,
  styles: [`
    :host {
      --azul-oscuro:  #0a2342;
      --azul-medio:   #1a4a7a;
      --azul-claro:   #2d7dd2;
      --teal:         #0fb8ad;
      --blanco:       #ffffff;
      --gris-suave:   #f4f7fb;
      --gris-texto:   #64748b;
      --borde:        #e2e8f0;
      --error:        #ef4444;
      display: block;
      height: 100vh;
    }

    .login-wrapper {
      display: flex; height: 100vh; overflow: hidden;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* Panel izquierdo */
    .login-brand {
      width: 45%;
      background: linear-gradient(145deg,var(--azul-oscuro) 0%,var(--azul-medio) 60%,#1a6fa8 100%);
      position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }

    .brand-content {
      position: relative; z-index: 2;
      padding: 3rem; text-align: center; color: var(--blanco);
    }

    .brand-logo {
      position: relative; display: inline-flex;
      align-items: center; justify-content: center;
      width: 90px; height: 90px; margin-bottom: 1.5rem;
    }

    .logo-icon { font-size: 2.5rem; color: var(--blanco); z-index: 2; position: relative; }
    .logo-icon .pi { color: #ff6b8a; }

    .logo-pulse {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(255,255,255,0.1);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50%       { transform: scale(1.15); opacity: 0.2; }
    }

    .brand-title { font-size: 2.4rem; font-weight: 300; line-height: 1.2; margin: 0 0 1rem; }
    .brand-title strong { font-weight: 700; }
    .brand-subtitle { font-size: 0.95rem; opacity: 0.8; line-height: 1.7; margin-bottom: 2.5rem; }

    .brand-stats { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 2rem; }
    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat-num { font-size: 1.4rem; font-weight: 700; color: var(--teal); }
    .stat-lbl { font-size: 0.75rem; opacity: 0.7; margin-top: 2px; }
    .stat-div { width: 1px; height: 40px; background: rgba(255,255,255,0.2); }

    .brand-deco { position: absolute; inset: 0; pointer-events: none; }
    .deco-circle { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.08); }
    .c1 { width: 400px; height: 400px; top: -120px; right: -120px; }
    .c2 { width: 280px; height: 280px; bottom: -80px; left: -80px; }
    .c3 { width: 160px; height: 160px; top: 60%; right: 10%; }

    .ecg-line { position: absolute; bottom: 60px; left: 0; right: 0; height: 60px; opacity: 0.5; }
    .ecg-line svg { width: 100%; height: 100%; }

    /* Panel derecho */
    .login-form-panel {
      flex: 1; background: var(--gris-suave);
      display: flex; align-items: center; justify-content: center; padding: 2rem;
    }

    .form-container {
      width: 100%; max-width: 420px; background: var(--blanco);
      border-radius: 20px; padding: 3rem 2.5rem;
      box-shadow: 0 20px 60px rgba(10,35,66,0.12);
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .form-header { text-align: center; margin-bottom: 2rem; }

    .form-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 60px; height: 60px;
      background: linear-gradient(135deg,var(--azul-claro),var(--teal));
      border-radius: 16px; margin-bottom: 1.2rem;
      box-shadow: 0 8px 20px rgba(45,125,210,0.3);
    }

    .form-icon .pi { font-size: 1.5rem; color: var(--blanco); }

    .form-header h2 { margin: 0 0 0.5rem; font-size: 1.7rem; font-weight: 700; color: var(--azul-oscuro); }
    .form-header p  { margin: 0; color: var(--gris-texto); font-size: 0.9rem; }

    /* Aviso inactividad */
    .aviso-inactividad {
      display: flex; align-items: flex-start; gap: 10px;
      background: #fef3c7; border: 1px solid #fde68a;
      border-radius: 12px; padding: 1rem 1.25rem;
      margin-bottom: 1.5rem; font-size: .88rem; color: #92400e;
    }
    .aviso-inactividad .pi { font-size: 1.1rem; color: #d97706; flex-shrink: 0; margin-top: 2px; }
    .aviso-inactividad strong { color: #78350f; }

    /* Campos */
    .field { margin-bottom: 1.5rem; }
    .field label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--azul-oscuro); margin-bottom: 0.5rem; }
    .field :deep(.p-inputtext) { border-radius: 10px; border-color: var(--borde); padding: 0.75rem 1rem 0.75rem 2.5rem; transition: all 0.2s; }
    .field :deep(.p-inputtext:focus) { border-color: var(--azul-claro); box-shadow: 0 0 0 3px rgba(45,125,210,0.15); }
    .field :deep(.p-password) { display: block; }
    .field :deep(.p-password .p-inputtext) { border-radius: 10px; padding: 0.75rem 1rem; }

    .error-msg { display: flex; align-items: center; gap: 4px; color: var(--error); font-size: 0.8rem; margin-top: 0.4rem; }

    :deep(.login-btn) {
      border-radius: 10px; padding: 0.85rem; font-size: 1rem; font-weight: 600;
      background: linear-gradient(135deg,var(--azul-claro),var(--azul-medio));
      border: none; margin-top: 0.5rem;
      transition: transform 0.15s, box-shadow 0.15s;
    }

    :deep(.login-btn:not(:disabled):hover) {
      transform: translateY(-1px);
      box-shadow: 0 8px 25px rgba(45,125,210,0.4);
    }

    .form-footer {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin-top: 1.8rem; padding-top: 1.2rem; border-top: 1px solid var(--borde);
      color: var(--gris-texto); font-size: 0.78rem;
    }

    .form-footer .pi { color: var(--teal); }

    @media (max-width: 768px) {
      .login-brand { display: none; }
      .login-form-panel { background: var(--azul-oscuro); }
      .form-container { box-shadow: 0 30px 80px rgba(0,0,0,0.3); }
    }
  `]
})
export class LoginComponent implements OnInit {

  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router= inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(MessageService);

  cargando      = signal(false);
  sesionExpirada = signal(false);

  loginForm: FormGroup = this.fb.group({
    correo:     ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    // Detecta si viene de un cierre por inactividad
    const motivo = this.route.snapshot.queryParamMap.get('motivo');
    if (motivo === 'inactividad') {
      this.sesionExpirada.set(true);
    }

    // Si ya tiene sesión activa → redirigir al dashboard
    if (this.auth.sesion()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando.set(true);

    this.auth.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.exitoso) {
          // Verificar si requiere cambio de contraseña temporal
          if (res.data?.passwordTemporal) {
            this.toast.add({
              severity: 'warn',
              summary: 'Cambio de contraseña requerido',
              detail: 'Por seguridad debes cambiar tu contraseña temporal',
              life: 4000
            });
            setTimeout(() => this.router.navigate(['/auth/cambiar-password']), 800);
            return;
          }

          this.toast.add({
            severity: 'success',
            summary: '¡Bienvenido!',
            detail: `Hola, ${res.data.nombreCompleto}`
          });
          setTimeout(() => this.router.navigate(['/dashboard']), 500);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err.error?.mensaje ?? 'Credenciales incorrectas';
        this.toast.add({
          severity: 'error',
          summary: 'Acceso denegado',
          detail: msg,
          life: 4000
        });
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.loginForm.get(field);
    if (ctrl?.hasError('required'))  return 'Este campo es obligatorio';
    if (ctrl?.hasError('email'))     return 'Ingresa un correo válido';
    if (ctrl?.hasError('minlength')) return 'Mínimo 6 caracteres';
    return '';
  }
}
