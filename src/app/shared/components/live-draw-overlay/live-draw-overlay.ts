import { Component, input } from '@angular/core';

@Component({
  selector: 'app-live-draw-overlay',
  standalone: true,
  template: `
    @if (open()) {
      <div class="live-draw-overlay">
        <div class="live-draw-overlay__backdrop"></div>
        <section class="live-draw-card" aria-live="polite" aria-atomic="true">
          <div class="live-draw-card__pulse"></div>
          <div class="live-draw-card__eyebrow">Sorteo en vivo</div>
          <h3 class="live-draw-card__title">{{ title() }}</h3>

          @if (subtitle()) {
            <p class="live-draw-card__subtitle">{{ subtitle() }}</p>
          }

          @if (winnerNumber() === null) {
            <div class="live-draw-card__countdown-wrap">
              <div class="live-draw-card__ring">
                <span>{{ countdown() ?? 5 }}</span>
              </div>
              <div class="live-draw-card__caption">Preparando el numero ganador...</div>
            </div>
          } @else {
            <div class="live-draw-card__result">
              <div class="live-draw-card__result-label">Numero ganador</div>
              <div class="live-draw-card__winner">{{ winnerNumber() }}</div>
              @if (winnerName()) {
                <div class="live-draw-card__winner-name">{{ winnerName() }}</div>
              }
            </div>
          }
        </section>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .live-draw-overlay {
      position: fixed;
      inset: 0;
      z-index: 2500;
      display: grid;
      place-items: center;
      padding: 1.25rem;
    }

    .live-draw-overlay__backdrop {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at top, rgba(59, 130, 246, 0.25), transparent 42%),
        rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(10px);
    }

    .live-draw-card {
      position: relative;
      width: min(100%, 30rem);
      padding: 2rem 1.5rem;
      border-radius: 1.75rem;
      background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.94));
      border: 1px solid rgba(255,255,255,0.7);
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
      text-align: center;
      overflow: hidden;
    }

    .live-draw-card__pulse {
      position: absolute;
      inset: auto -12% -48% -12%;
      height: 10rem;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.2), transparent 68%);
      animation: live-draw-pulse 1.8s ease-in-out infinite;
      pointer-events: none;
    }

    .live-draw-card__eyebrow {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.42rem 0.8rem;
      border-radius: 999px;
      background: rgba(37, 99, 235, 0.1);
      color: #1d4ed8;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .live-draw-card__title {
      position: relative;
      margin: 1rem 0 0.45rem;
      color: #0f172a;
      font-size: clamp(1.45rem, 3vw, 1.9rem);
      font-weight: 800;
    }

    .live-draw-card__subtitle {
      position: relative;
      margin: 0 auto 1.4rem;
      max-width: 24rem;
      color: #475569;
      font-size: 0.98rem;
    }

    .live-draw-card__countdown-wrap,
    .live-draw-card__result {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 0.75rem;
    }

    .live-draw-card__ring {
      width: min(48vw, 10.5rem);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background:
        radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.78)),
        linear-gradient(135deg, #0ea5e9, #2563eb);
      box-shadow:
        inset 0 0 0 10px rgba(255,255,255,0.9),
        0 18px 40px rgba(37, 99, 235, 0.28);
      animation: live-draw-float 1.2s ease-in-out infinite;
    }

    .live-draw-card__ring span,
    .live-draw-card__winner {
      color: #0f172a;
      font-size: clamp(3rem, 10vw, 4.5rem);
      line-height: 1;
      font-weight: 900;
    }

    .live-draw-card__caption,
    .live-draw-card__result-label {
      color: #475569;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .live-draw-card__winner {
      display: grid;
      place-items: center;
      min-width: min(48vw, 10.5rem);
      min-height: min(48vw, 10.5rem);
      padding: 1rem;
      border-radius: 1.75rem;
      background: linear-gradient(135deg, #facc15, #fb7185);
      color: #fff;
      box-shadow: 0 22px 46px rgba(244, 114, 182, 0.32);
    }

    .live-draw-card__winner-name {
      color: #0f172a;
      font-size: 1rem;
      font-weight: 700;
    }

    @keyframes live-draw-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @keyframes live-draw-pulse {
      0%, 100% { transform: scale(0.95); opacity: 0.55; }
      50% { transform: scale(1.05); opacity: 1; }
    }
  `]
})
export class LiveDrawOverlay {
  readonly open = input(false);
  readonly title = input('Sorteo');
  readonly subtitle = input('');
  readonly countdown = input<number | null>(null);
  readonly winnerNumber = input<number | null>(null);
  readonly winnerName = input('');
}
