import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <!-- ── Hero ─────────────────────────────────────────────────────────── -->
    <section class="hero-gradient text-white" style="padding:5.5rem 0 4.5rem; min-height:92vh; display:flex; align-items:center">
      <div class="container-xl position-relative" style="z-index:1">
        <div class="row align-items-center g-5">

          <!-- Copy -->
          <div class="col-lg-6">
            <div class="animate-fade-up">
              <span class="d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 mb-4 fw-semibold"
                    style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);font-size:.82rem;backdrop-filter:blur(8px)">
                <span class="rounded-circle d-inline-block" style="width:7px;height:7px;background:#22d3ee;box-shadow:0 0 8px #22d3ee;animation:neon-pulse-gold 2s infinite"></span>
                Plataforma 100% digital · SSL · Tiempo real
              </span>

              <h1 class="display-3 fw-black mb-4 lh-tight" style="letter-spacing:-0.04em">
                Organizá rifas online<br>
                de forma
                <span class="text-gradient-gold">profesional</span>
              </h1>

              <p class="lead mb-5 opacity-80" style="max-width:480px;line-height:1.7">
                Creá tu rifa en minutos, vendé números digitales y sorteá con total transparencia.
                Mercado Pago, transferencia o efectivo.
              </p>

              <div class="d-flex flex-wrap gap-3">
                @if (auth.isLoggedIn()) {
                  <a routerLink="/dashboard"
                     class="btn btn-lg btn-neon fw-bold px-5 py-3 rounded-3 d-inline-flex align-items-center gap-2">
                    <i class="bi bi-speedometer2"></i>Ir al Dashboard
                  </a>
                } @else {
                  <a routerLink="/auth/register"
                     class="btn btn-lg btn-neon fw-bold px-5 py-3 rounded-3 d-inline-flex align-items-center gap-2">
                    <i class="bi bi-rocket-takeoff-fill"></i>Empezar gratis
                  </a>
                  <a routerLink="/auth/login"
                     class="btn btn-lg fw-semibold px-4 py-3 rounded-3 d-inline-flex align-items-center gap-2"
                     style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;backdrop-filter:blur(8px)">
                    Iniciar sesión <i class="bi bi-arrow-right"></i>
                  </a>
                }
              </div>

              <!-- Trust badges -->
              <div class="d-flex flex-wrap align-items-center gap-4 mt-5 opacity-60" style="font-size:.8rem">
                @for (t of trustBadges; track t.icon) {
                  <span class="d-flex align-items-center gap-1">
                    <i [class]="'bi ' + t.icon" style="color:#22d3ee"></i>{{ t.label }}
                  </span>
                }
              </div>
            </div>
          </div>

          <!-- Dashboard preview card -->
          <div class="col-lg-6 text-center">
            <div class="animate-float" style="animation-delay:.3s">
              <div class="card-glass-dark p-4 text-start position-relative overflow-hidden"
                   style="border-radius:1.75rem;max-width:400px;margin:0 auto">

                <!-- Card inner glow -->
                <div class="orb orb--primary" style="width:200px;height:200px;top:-60px;right:-60px;opacity:.5"></div>
                <div class="orb orb--pink" style="width:150px;height:150px;bottom:-40px;left:-40px;opacity:.4"></div>

                <div class="position-relative" style="z-index:1">
                  <div class="d-flex align-items-center justify-content-between mb-4">
                    <span class="fw-bold text-white" style="font-size:.85rem">Toyota Corolla 2026</span>
                    <span class="badge rounded-pill text-white fw-semibold"
                          style="background:rgba(34,211,238,0.2);border:1px solid rgba(34,211,238,0.3);font-size:.7rem">
                      <span class="me-1" style="display:inline-block;width:6px;height:6px;background:#22d3ee;border-radius:50%;animation:neon-pulse-gold 1.5s infinite"></span>
                      EN VIVO
                    </span>
                  </div>

                  <!-- Stat row -->
                  <div class="row g-2 mb-4">
                    @for (stat of heroStats; track stat.label) {
                      <div class="col-6">
                        <div class="p-3 rounded-3 text-center" [style]="stat.style">
                          <div class="fw-black mb-0" style="font-size:1.5rem;letter-spacing:-0.03em">{{ stat.value }}</div>
                          <div class="small fw-semibold" style="font-size:.72rem;opacity:.75">{{ stat.label }}</div>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Mini number grid preview -->
                  <div class="mb-3">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="text-white opacity-60 fw-semibold" style="font-size:.72rem">Números disponibles</span>
                      <span class="text-white opacity-40" style="font-size:.65rem">74 / 100</span>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px">
                      @for (n of miniGrid; track n.v) {
                        <div class="d-flex align-items-center justify-content-center fw-bold rounded-1"
                             style="aspect-ratio:1;font-size:.6rem"
                             [style.background]="n.bg"
                             [style.color]="n.c">{{ n.v }}</div>
                      }
                    </div>
                  </div>

                  <div class="p-3 rounded-3 d-flex align-items-center gap-2"
                       style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.2)">
                    <i class="bi bi-check-circle-fill" style="color:#10b981;font-size:1rem"></i>
                    <span class="text-white fw-semibold" style="font-size:.8rem">26 números confirmados · $52.000</span>
                  </div>
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
    <section class="py-4" style="background:#fff;border-bottom:1px solid #ebebf5">
      <div class="container-xl">
        <div class="row g-3 text-center">
          @for (s of platformStats; track s.label) {
            <div class="col-6 col-md-3">
              <div class="fw-black text-gradient" style="font-size:1.9rem">{{ s.value }}</div>
              <div class="text-muted small fw-medium">{{ s.label }}</div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Cómo funciona ─────────────────────────────────────────────────── -->
    <section class="py-5 bg-gradient-mesh">
      <div class="container-xl py-4">
        <div class="text-center mb-5">
          <span class="badge rounded-pill px-3 py-2 mb-3 fw-semibold"
                style="background:rgba(99,102,241,0.1);color:#6366f1;border:1px solid rgba(99,102,241,0.15);font-size:.8rem">
            Proceso simple
          </span>
          <h2 class="fw-black mb-2" style="font-size:2.2rem">¿Cómo funciona?</h2>
          <p class="text-muted">Tres pasos y ya estás sorteando</p>
        </div>
        <div class="row g-4 justify-content-center">
          @for (step of steps; track step.num) {
            <div class="col-md-4">
              <div class="card border-0 h-100 card-3d p-4 position-relative overflow-hidden"
                   style="border-radius:1.5rem">
                <!-- Step bg orb -->
                <div class="orb" [style]="step.orb + ';width:120px;height:120px;top:-30px;right:-30px;opacity:.4'"></div>

                <div class="position-relative" style="z-index:1">
                  <div class="d-flex align-items-center gap-3 mb-4">
                    <div class="d-flex align-items-center justify-content-center rounded-3 fw-black text-white"
                         style="width:48px;height:48px;font-size:1.2rem;flex-shrink:0"
                         [style.background]="step.color">{{ step.num }}</div>
                    <h5 class="fw-bold mb-0" style="letter-spacing:-0.02em">{{ step.title }}</h5>
                  </div>
                  <p class="text-muted mb-0" style="line-height:1.65;font-size:.93rem">{{ step.desc }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Features ──────────────────────────────────────────────────────── -->
    <section class="py-5" style="background:#fff">
      <div class="container-xl py-4">
        <div class="text-center mb-5">
          <h2 class="fw-black mb-2" style="font-size:2.2rem">Todo lo que necesitás</h2>
          <p class="text-muted">Una plataforma completa para organizar rifas como un profesional</p>
        </div>
        <div class="row g-4">
          @for (f of features; track f.icon) {
            <div class="col-md-6 col-lg-4">
              <div class="d-flex gap-3 p-4 rounded-4 card-hover h-100 position-relative overflow-hidden"
                   style="background:#fff;border:1px solid #f0f0fb;transition:.25s">
                <div class="orb" [style]="f.orb + ';width:80px;height:80px;top:-15px;right:-15px;opacity:.35'"></div>
                <div class="feature-icon flex-shrink-0 position-relative" [style.background]="f.bg">
                  <i [class]="'bi ' + f.icon" [style.color]="f.color" style="font-size:1.35rem"></i>
                </div>
                <div class="position-relative">
                  <h6 class="fw-bold mb-1" style="letter-spacing:-0.015em">{{ f.title }}</h6>
                  <p class="text-muted small mb-0" style="line-height:1.6">{{ f.desc }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── CTA Final ──────────────────────────────────────────────────────── -->
    <section class="hero-gradient text-white py-5" style="padding:5rem 0 !important">
      <div class="container-xl text-center py-4 position-relative" style="z-index:1">
        <span class="badge rounded-pill px-3 py-2 mb-4 d-inline-block fw-semibold"
              style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18);font-size:.8rem;backdrop-filter:blur(8px)">
          Sin costos fijos · Sin contratos
        </span>
        <h2 class="fw-black mb-3" style="font-size:2.8rem;letter-spacing:-0.04em;line-height:1.1">
          ¿Listo para tu<br>
          <span class="text-gradient-gold">próxima rifa?</span>
        </h2>
        <p class="mb-5 mx-auto opacity-75" style="max-width:520px;font-size:1.08rem;line-height:1.7">
          Creá tu cuenta gratis y publicá tu primera rifa en minutos.
        </p>
        <a routerLink="/auth/register"
           class="btn btn-lg btn-neon fw-bold px-5 py-3 rounded-3 d-inline-flex align-items-center gap-2">
          <i class="bi bi-arrow-right-circle-fill"></i>Comenzar ahora — es gratis
        </a>
      </div>
    </section>
  `
})
export class Home {
  protected readonly auth = inject(AuthService);

  protected readonly trustBadges = [
    { icon: 'bi-shield-check-fill', label: 'SSL Seguro' },
    { icon: 'bi-lightning-charge-fill', label: 'Tiempo real' },
    { icon: 'bi-people-fill', label: '+500 organizadores' },
    { icon: 'bi-star-fill', label: 'Sorteos transparentes' },
  ];

  protected readonly heroStats = [
    { value: '100%', label: 'Digital', style: 'background:rgba(99,102,241,0.18);color:#c7d2fe' },
    { value: 'Gratis', label: 'Para empezar', style: 'background:rgba(16,185,129,0.18);color:#a7f3d0' },
    { value: '⚡ Live', label: 'Tiempo real', style: 'background:rgba(251,191,36,0.18);color:#fde68a' },
    { value: '🔒 SSL', label: 'Seguro', style: 'background:rgba(236,72,153,0.18);color:#fbcfe8' },
  ];

  protected readonly miniGrid = [
    { v: '01', bg: 'rgba(99,102,241,0.2)',  c: '#c7d2fe' },
    { v: '02', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '03', bg: 'rgba(16,185,129,0.25)', c: '#a7f3d0' },
    { v: '04', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '05', bg: 'rgba(251,191,36,0.22)',  c: '#fde68a' },
    { v: '06', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '07', bg: 'rgba(16,185,129,0.25)', c: '#a7f3d0' },
    { v: '08', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '09', bg: 'rgba(99,102,241,0.2)',  c: '#c7d2fe' },
    { v: '10', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '11', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '12', bg: 'rgba(236,72,153,0.22)', c: '#fbcfe8' },
    { v: '13', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '14', bg: 'rgba(16,185,129,0.25)', c: '#a7f3d0' },
    { v: '15', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '16', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '17', bg: 'rgba(251,191,36,0.22)',  c: '#fde68a' },
    { v: '18', bg: 'rgba(255,255,255,0.08)', c: 'rgba(255,255,255,0.5)' },
    { v: '19', bg: 'rgba(16,185,129,0.25)', c: '#a7f3d0' },
    { v: '20', bg: 'rgba(99,102,241,0.2)',  c: '#c7d2fe' },
  ];

  protected readonly platformStats = [
    { value: '+500', label: 'Rifas creadas' },
    { value: '+10k', label: 'Números vendidos' },
    { value: '100%', label: 'Sorteos transparentes' },
    { value: '24hs', label: 'Soporte disponible' },
  ];

  protected readonly steps = [
    {
      num: '1', title: 'Creá tu rifa',
      color: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      orb: 'background:radial-gradient(circle,rgba(99,102,241,0.4),transparent)',
      desc: 'Configurá el título, el premio, el precio por número y la fecha del sorteo en minutos.'
    },
    {
      num: '2', title: 'Publicá y vendé',
      color: 'linear-gradient(135deg,#10b981,#059669)',
      orb: 'background:radial-gradient(circle,rgba(16,185,129,0.4),transparent)',
      desc: 'Compartí el link. Tus participantes eligen y reservan sus números directamente.'
    },
    {
      num: '3', title: 'Sorteá en vivo',
      color: 'linear-gradient(135deg,#ec4899,#f43f5e)',
      orb: 'background:radial-gradient(circle,rgba(236,72,153,0.4),transparent)',
      desc: 'Ejecutá el sorteo. El ganador se anuncia en tiempo real para todos los participantes.'
    },
  ];

  protected readonly features = [
    { icon: 'bi-grid-3x3-gap-fill', title: 'Grilla interactiva', desc: 'Tus participantes eligen sus números con una experiencia visual moderna y en tiempo real.', bg: '#eef2ff', color: '#6366f1', orb: 'background:radial-gradient(circle,rgba(99,102,241,0.3),transparent)' },
    { icon: 'bi-credit-card-2-front-fill', title: 'Múltiples pagos', desc: 'Mercado Pago, transferencia, alias CBU/CVU o efectivo. Vos decidís qué aceptar.', bg: '#d1fae5', color: '#059669', orb: 'background:radial-gradient(circle,rgba(16,185,129,0.3),transparent)' },
    { icon: 'bi-lightning-charge-fill', title: 'Tiempo real', desc: 'Los números reservados se actualizan instantáneamente para todos los participantes.', bg: '#fef9c3', color: '#d97706', orb: 'background:radial-gradient(circle,rgba(251,191,36,0.3),transparent)' },
    { icon: 'bi-stars', title: 'Sorteo transparente', desc: 'Ejecutá el sorteo manual, automático o con proveedor externo certificado.', bg: '#fce7f3', color: '#be185d', orb: 'background:radial-gradient(circle,rgba(236,72,153,0.3),transparent)' },
    { icon: 'bi-shield-check-fill', title: 'Seguro y auditable', desc: 'Cada acción queda registrada con log de auditoría. Total trazabilidad.', bg: '#ecfeff', color: '#0891b2', orb: 'background:radial-gradient(circle,rgba(34,211,238,0.3),transparent)' },
    { icon: 'bi-graph-up-arrow', title: 'Dashboard completo', desc: 'Gestioná reservas, pagos y participantes desde un panel intuitivo y moderno.', bg: '#fef3c7', color: '#d97706', orb: 'background:radial-gradient(circle,rgba(251,191,36,0.3),transparent)' },
  ];
}
