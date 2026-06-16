import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="al-root">

      <!-- ── Left brand panel (desktop only) ─────────────────────────── -->
      <div class="al-left d-none d-lg-flex">
        <!-- Blobs decorativos -->
        <div class="orb orb--primary"
             style="width:500px;height:500px;top:-120px;left:-120px;opacity:.4"></div>
        <div class="orb orb--pink"
             style="width:400px;height:400px;bottom:-100px;right:-80px;opacity:.35"></div>
        <div class="orb orb--cyan"
             style="width:250px;height:250px;top:40%;left:30%;opacity:.18"></div>

        <div class="al-left__content">
          <!-- Brand -->
          <a routerLink="/" class="al-brand text-decoration-none">
            <i class="bi bi-ticket-perforated-fill"></i>
            <span>SuperSorteo</span>
          </a>

          <!-- Headline -->
          <h1 class="al-left__headline">
            La plataforma de rifas<br>
            <span class="text-gradient-gold">más profesional</span>
          </h1>
          <p class="al-left__sub">
            Creá, gestioná y sorteá. Todo digital, transparente y en tiempo real. Sin costos fijos ni contratos.
          </p>

          <!-- Benefits -->
          <ul class="al-benefits">
            @for (b of benefits; track b.icon) {
              <li class="al-benefits__item">
                <span class="al-benefits__icon">
                  <i [class]="'bi ' + b.icon"></i>
                </span>
                <div>
                  <div class="al-benefits__title">{{ b.title }}</div>
                  <div class="al-benefits__desc">{{ b.desc }}</div>
                </div>
              </li>
            }
          </ul>

          <!-- Stats mini-card -->
          <div class="al-stats-card">
            <div class="orb orb--primary" style="width:150px;height:150px;top:-30px;right:-30px;opacity:.3"></div>
            @for (s of stats; track s.label) {
              <div class="al-stats-card__item">
                <div class="al-stats-card__value">{{ s.value }}</div>
                <div class="al-stats-card__label">{{ s.label }}</div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ── Right: form panel ─────────────────────────────────────────── -->
      <div class="al-right">

        <!-- Mobile header -->
        <div class="al-mobile-header d-flex d-lg-none">
          <a routerLink="/" class="al-brand text-decoration-none">
            <i class="bi bi-ticket-perforated-fill"></i>
            <span>SuperSorteo</span>
          </a>
        </div>

        <!-- Form area -->
        <div class="al-form-area">
          <div class="al-card">
            <router-outlet />
          </div>
        </div>

        <!-- Footer -->
        <div class="al-footer">
          <span>© 2026 SuperSorteo</span>
          <span class="al-footer__dot">·</span>
          <span>Plataforma segura</span>
          <i class="bi bi-shield-check-fill" style="color:#10b981;font-size:.8rem"></i>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Root ────────────────────────────────────── */
    .al-root {
      min-height: 100vh;
      display: flex;
      background: #f3f4ff;
    }

    /* ── Left panel ───────────────────────────────── */
    .al-left {
      width: 480px;
      flex-shrink: 0;
      min-height: 100vh;
      background:
        radial-gradient(ellipse at 25% 15%, rgba(99,102,241,.55) 0%, transparent 55%),
        radial-gradient(ellipse at 75% 90%, rgba(236,72,153,.45) 0%, transparent 55%),
        linear-gradient(160deg, #09090b 0%, #1e1b4b 40%, #3b0764 70%, #4c0519 100%);
      position: sticky; top: 0;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      padding: 3rem 2.5rem;
      overflow: hidden;
    }

    .al-left__content {
      position: relative; z-index: 1; width: 100%;
    }

    /* ── Brand ────────────────────────────────────── */
    .al-brand {
      display: inline-flex; align-items: center; gap: .55rem;
      color: #fff; font-weight: 800; font-size: 1.15rem;
      letter-spacing: -0.025em; margin-bottom: 2.5rem;
    }
    .al-brand i {
      font-size: 1.4rem;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── Headline ─────────────────────────────────── */
    .al-left__headline {
      color: #fff; font-size: 2.1rem; font-weight: 900;
      letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 1rem;
    }
    .al-left__sub {
      color: rgba(255,255,255,.62); font-size: .92rem;
      line-height: 1.65; margin-bottom: 2rem; max-width: 360px;
    }

    /* ── Benefits list ────────────────────────────── */
    .al-benefits {
      list-style: none; padding: 0; margin: 0 0 2rem;
      display: flex; flex-direction: column; gap: 1rem;
    }
    .al-benefits__item {
      display: flex; align-items: flex-start; gap: .85rem;
    }
    .al-benefits__icon {
      width: 36px; height: 36px; border-radius: .65rem; flex-shrink: 0;
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.12);
      display: flex; align-items: center; justify-content: center;
      font-size: .95rem; color: rgba(255,255,255,.85);
    }
    .al-benefits__title {
      color: #fff; font-weight: 700; font-size: .88rem; margin-bottom: .1rem;
    }
    .al-benefits__desc {
      color: rgba(255,255,255,.5); font-size: .78rem; line-height: 1.5;
    }

    /* ── Stats mini-card ──────────────────────────── */
    .al-stats-card {
      position: relative; overflow: hidden;
      border-radius: 1.1rem; padding: 1.1rem 1.25rem;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      backdrop-filter: blur(12px);
      display: flex; gap: 1.5rem; flex-wrap: wrap;
    }
    .al-stats-card__value {
      color: #fff; font-size: 1.5rem; font-weight: 900;
      letter-spacing: -0.04em; line-height: 1;
    }
    .al-stats-card__label {
      color: rgba(255,255,255,.5); font-size: .72rem;
      font-weight: 600; margin-top: .25rem;
      text-transform: uppercase; letter-spacing: .06em;
    }
    .al-stats-card__item { position: relative; z-index: 1; }

    /* ── Right panel ──────────────────────────────── */
    .al-right {
      flex: 1;
      display: flex; flex-direction: column;
      min-height: 100vh; overflow-y: auto;
    }

    /* Mobile header */
    .al-mobile-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(99,102,241,.1);
      background: rgba(255,255,255,.85);
      backdrop-filter: blur(8px);
      position: sticky; top: 0; z-index: 10;
    }

    /* Form area: centered */
    .al-form-area {
      flex: 1; display: flex;
      align-items: center; justify-content: center;
      padding: 2.5rem 1.25rem;
    }

    /* Card */
    .al-card {
      width: 100%; max-width: 440px;
      background: #fff;
      border-radius: 1.5rem;
      box-shadow:
        0 20px 60px rgba(99,102,241,.12),
        0 4px 16px rgba(0,0,0,.06),
        0 0 0 1px rgba(99,102,241,.08);
      padding: 2.25rem 2rem;
    }

    /* Footer */
    .al-footer {
      display: flex; align-items: center; justify-content: center;
      gap: .5rem; padding: 1rem;
      color: #a1a1aa; font-size: .78rem;
    }
    .al-footer__dot { color: #d4d4d8; }

    /* ── Mobile responsive ────────────────────────── */
    @media (max-width: 991px) {
      .al-root { background: #f3f4ff; }
      .al-right { background: #f3f4ff; }
      .al-form-area { padding: 1.5rem 1rem; }
      .al-card { padding: 1.75rem 1.25rem; border-radius: 1.25rem; }
    }
    @media (max-width: 480px) {
      .al-card { padding: 1.5rem 1rem; border-radius: 1rem; }
      .al-form-area { padding: 1rem .75rem; }
    }
  `]
})
export class AuthLayout {
  protected readonly benefits = [
    {
      icon: 'bi-rocket-takeoff-fill',
      title: 'Configurá en minutos',
      desc: 'Creá tu primera rifa y compartí el link en menos de 5 minutos.'
    },
    {
      icon: 'bi-lightning-charge-fill',
      title: 'Tiempo real',
      desc: 'Los números se actualizan al instante para todos los participantes.'
    },
    {
      icon: 'bi-shield-check-fill',
      title: 'Seguro y auditable',
      desc: 'Cada acción queda registrada. Sorteos 100% transparentes.'
    },
  ];

  protected readonly stats = [
    { value: '+500', label: 'Rifas creadas' },
    { value: '+10k', label: 'Números vendidos' },
    { value: '100%', label: 'Transparentes' },
  ];
}
