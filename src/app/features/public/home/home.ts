import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <!-- ── Hero ─────────────────────────────────────────────────────────── -->
    <section class="hero-gradient text-white" style="padding: 5rem 0 4rem">
      <div class="container-xl">
        <div class="row align-items-center g-5">
          <div class="col-lg-6 animate-fade-up">
            <span class="badge text-white mb-4 px-3 py-2 rounded-pill fw-medium"
                  style="background:rgba(255,255,255,0.15);font-size:.8rem">
              <i class="bi bi-shield-check-fill me-2 text-success"></i>Plataforma segura y transparente
            </span>
            <h1 class="display-4 fw-black mb-4 lh-sm">
              Organizá rifas online de forma<br>
              <span class="text-gradient-gold">profesional</span>
            </h1>
            <p class="lead mb-5" style="opacity:.82; max-width:480px">
              Creá tu rifa en minutos, vendé números digitales y sorteá con total transparencia.
              Mercado Pago, transferencia o efectivo.
            </p>
            <div class="d-flex flex-wrap gap-3">
              @if (auth.isLoggedIn()) {
                <a routerLink="/dashboard" class="btn btn-lg fw-bold px-5 py-3 rounded-3"
                   style="background:#f59e0b;color:#0f172a;border:none;font-size:1rem">
                  <i class="bi bi-speedometer2 me-2"></i>Ir al Dashboard
                </a>
              } @else {
                <a routerLink="/auth/register" class="btn btn-lg fw-bold px-5 py-3 rounded-3"
                   style="background:#f59e0b;color:#0f172a;border:none;font-size:1rem">
                  <i class="bi bi-rocket-takeoff me-2"></i>Empezar gratis
                </a>
                <a routerLink="/auth/login" class="btn btn-lg btn-outline-light px-4 py-3 rounded-3">
                  Iniciar sesión
                </a>
              }
            </div>
          </div>

          <div class="col-lg-6 text-center">
            <div class="card-glass p-4 d-inline-block animate-float" style="max-width:360px;width:100%">
              <div class="row g-3">
                @for (stat of heroStats; track stat.label) {
                  <div class="col-6">
                    <div class="rounded-3 p-3 text-start" [style]="stat.style">
                      <div class="fw-black mb-1" style="font-size:1.6rem;color:#0f172a">{{ stat.value }}</div>
                      <div class="small fw-medium" style="color:#475569">{{ stat.label }}</div>
                    </div>
                  </div>
                }
              </div>
              <div class="mt-3 p-3 rounded-3 text-start" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7)">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <i class="bi bi-award-fill text-success"></i>
                  <span class="fw-semibold small" style="color:#166534">Premio: Toyota Corolla 2026</span>
                </div>
                <div class="d-flex gap-1 flex-wrap">
                  @for (n of sampleNumbers; track n.v) {
                    <span class="rounded-2 px-2 py-1 fw-bold"
                          style="font-size:.65rem"
                          [style.background]="n.bg"
                          [style.color]="n.c">{{ n.v }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Divider ── -->
    <div class="section-divider"></div>

    <!-- ── Stats strip ──────────────────────────────────────────────────── -->
    <section class="bg-white py-4 border-bottom">
      <div class="container-xl">
        <div class="row g-3 text-center">
          @for (s of platformStats; track s.label) {
            <div class="col-6 col-md-3">
              <div class="fw-black" style="font-size:1.75rem;color:#4f46e5">{{ s.value }}</div>
              <div class="text-muted small">{{ s.label }}</div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Cómo funciona ─────────────────────────────────────────────────── -->
    <section class="py-5 bg-gradient-mesh">
      <div class="container-xl py-3">
        <div class="text-center mb-5">
          <span class="badge rounded-pill px-3 py-2 mb-3" style="background:#ede9fe;color:#4f46e5;font-size:.8rem">
            Proceso simple
          </span>
          <h2 class="fw-black mb-2">¿Cómo funciona?</h2>
          <p class="text-muted">Tres pasos y ya estás sorteando</p>
        </div>
        <div class="row g-4 justify-content-center">
          @for (step of steps; track step.num) {
            <div class="col-md-4">
              <div class="card border-0 shadow-sm h-100 card-hover p-4">
                <div class="d-flex align-items-center gap-3 mb-3">
                  <div class="d-flex align-items-center justify-content-center rounded-3 fw-black text-white"
                       style="width:44px;height:44px;font-size:1.1rem"
                       [style.background]="step.color">{{ step.num }}</div>
                  <h5 class="fw-bold mb-0">{{ step.title }}</h5>
                </div>
                <p class="text-muted mb-0 small">{{ step.desc }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Features ──────────────────────────────────────────────────────── -->
    <section class="py-5 bg-white">
      <div class="container-xl py-3">
        <div class="text-center mb-5">
          <h2 class="fw-black mb-2">Todo lo que necesitás</h2>
          <p class="text-muted">Una plataforma completa para organizar rifas como un profesional</p>
        </div>
        <div class="row g-4">
          @for (f of features; track f.icon) {
            <div class="col-md-6 col-lg-4">
              <div class="d-flex gap-3 p-3 rounded-3 card-hover" style="transition:.2s">
                <div class="feature-icon flex-shrink-0" [style.background]="f.bg">
                  <i [class]="'bi ' + f.icon" [style.color]="f.color"></i>
                </div>
                <div>
                  <h6 class="fw-bold mb-1">{{ f.title }}</h6>
                  <p class="text-muted small mb-0">{{ f.desc }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── CTA Final ──────────────────────────────────────────────────────── -->
    <section class="hero-gradient text-white py-5">
      <div class="container-xl text-center py-4">
        <h2 class="fw-black display-6 mb-3">¿Listo para tu próxima rifa?</h2>
        <p class="mb-5 mx-auto" style="opacity:.8;max-width:520px;font-size:1.05rem">
          Creá tu cuenta gratis y publicá tu primera rifa en minutos. Sin costos fijos ni contratos.
        </p>
        <a routerLink="/auth/register" class="btn btn-lg fw-bold px-5 py-3 rounded-3"
           style="background:#f59e0b;color:#0f172a;border:none;font-size:1rem">
          <i class="bi bi-arrow-right-circle-fill me-2"></i>Comenzar ahora — es gratis
        </a>
      </div>
    </section>
  `
})
export class Home {
  protected readonly auth = inject(AuthService);

  protected readonly heroStats = [
    { value: '100%', label: 'Digital', style: 'background:linear-gradient(135deg,#ede9fe,#ddd6fe)' },
    { value: 'Gratis', label: 'Para empezar', style: 'background:linear-gradient(135deg,#d1fae5,#a7f3d0)' },
    { value: '⚡ Live', label: 'Tiempo real', style: 'background:linear-gradient(135deg,#fef9c3,#fde047)' },
    { value: '🔒 SSL', label: 'Seguro', style: 'background:linear-gradient(135deg,#fee2e2,#fca5a5)' },
  ];

  protected readonly sampleNumbers = [
    { v: '07', bg: '#d1fae5', c: '#065f46' },
    { v: '23', bg: '#ede9fe', c: '#4f46e5' },
    { v: '41', bg: '#fef9c3', c: '#713f12' },
    { v: '55', bg: '#ede9fe', c: '#4f46e5' },
    { v: '88', bg: '#fef9c3', c: '#713f12' },
    { v: '99', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', c: '#fff' },
  ];

  protected readonly platformStats = [
    { value: '+500', label: 'Rifas creadas' },
    { value: '+10k', label: 'Números vendidos' },
    { value: '100%', label: 'Sorteos transparentes' },
    { value: '24hs', label: 'Soporte disponible' },
  ];

  protected readonly steps = [
    { num: '1', title: 'Creá tu rifa', color: 'linear-gradient(135deg,#4f46e5,#7c3aed)', desc: 'Configurá el título, el premio, el precio por número y la fecha del sorteo en minutos.' },
    { num: '2', title: 'Publicá y vendé', color: 'linear-gradient(135deg,#10b981,#059669)', desc: 'Compartí el link. Tus participantes eligen y reservan sus números directamente.' },
    { num: '3', title: 'Sorteá en vivo', color: 'linear-gradient(135deg,#ec4899,#be185d)', desc: 'Ejecutá el sorteo. El ganador se anuncia en tiempo real para todos los participantes.' },
  ];

  protected readonly features = [
    { icon: 'bi-grid-3x3-gap-fill', title: 'Grilla interactiva', desc: 'Tus participantes eligen sus números con una experiencia visual moderna y en tiempo real.', bg: '#ede9fe', color: '#4f46e5' },
    { icon: 'bi-credit-card-2-front-fill', title: 'Múltiples pagos', desc: 'Mercado Pago, transferencia, alias CBU/CVU o efectivo. Vos decidís qué aceptar.', bg: '#d1fae5', color: '#059669' },
    { icon: 'bi-lightning-charge-fill', title: 'Tiempo real', desc: 'Los números reservados se actualizan instantáneamente para todos los participantes.', bg: '#fef9c3', color: '#d97706' },
    { icon: 'bi-stars', title: 'Sorteo transparente', desc: 'Ejecutá el sorteo manual, automático o con proveedor externo certificado.', bg: '#fce7f3', color: '#be185d' },
    { icon: 'bi-shield-check-fill', title: 'Seguro y auditable', desc: 'Cada acción queda registrada con log de auditoría. Total trazabilidad.', bg: '#ecfeff', color: '#0891b2' },
    { icon: 'bi-graph-up-arrow', title: 'Dashboard completo', desc: 'Gestioná reservas, pagos y participantes desde un panel intuitivo y moderno.', bg: '#fef3c7', color: '#d97706' },
  ];
}
