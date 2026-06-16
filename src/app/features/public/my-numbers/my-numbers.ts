import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { ParticipantLookupResult, ReservationStatus } from '../../../core/models/reservation.models';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-my-numbers',
  imports: [FormsModule, RouterLink, CurrencyArPipe, StatusBadge],
  template: `
    <section class="mn-shell">
      <div class="mn-container">
        <div class="mn-hero">
          <div class="mn-hero__logo">
            <i class="bi bi-ticket-perforated-fill"></i>
            <span>SuperSorteo</span>
          </div>
          @if (slug) {
            <div class="mn-hero__back">
              <a [routerLink]="['/rifa', slug]" class="mn-back-btn">
                <i class="bi bi-arrow-left"></i>
                <span>Volver a la rifa</span>
              </a>
            </div>
          }
          <div class="mn-hero__icon">
            <i class="bi bi-ticket-perforated-fill"></i>
          </div>
          <h1 class="mn-hero__title">Mis numeros</h1>
          <p class="mn-hero__sub">Consulta el estado de tus reservas ingresando tu telefono.</p>
        </div>

        <div class="mn-card">
          <div class="mn-card__body">
            <form (ngSubmit)="search()" #f="ngForm">
              <div class="mb-3">
                <label class="form-label fw-semibold">Numero de telefono</label>
                <input class="form-control form-control-lg" type="tel"
                       [(ngModel)]="phone" name="phone"
                       placeholder="+54 9 11 1234-5678"
                       required autocomplete="tel">
              </div>
              @if (!slugFromUrl()) {
                <div class="mb-3">
                  <label class="form-label fw-semibold">Slug de la rifa</label>
                  <input class="form-control" [(ngModel)]="slug" name="slug"
                         placeholder="nombre-de-la-rifa" required>
                </div>
              } @else {
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted small">Rifa</label>
                  <div class="form-control bg-light text-muted">{{ slug }}</div>
                </div>
              }
              <button type="submit" class="btn btn-gradient fw-semibold w-100 rounded-3"
                      [disabled]="loading() || !phone || !slug">
                @if (loading()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>Buscando...
                } @else {
                  <i class="bi bi-search me-2"></i>Consultar mis reservas
                }
              </button>
            </form>
          </div>
        </div>

        @if (notFound()) {
          <div class="alert alert-warning d-flex align-items-center gap-2 mt-4">
            <i class="bi bi-exclamation-triangle-fill"></i>
            No encontramos reservas para ese telefono en esta rifa. Verifica el numero ingresado.
          </div>
        }

        @if (result()) {
          <div class="mn-result-head">
            <h5 class="fw-bold mb-0">
              <i class="bi bi-person-circle me-2 text-primary"></i>{{ result()!.participantName }}
            </h5>
            <p class="text-muted small mb-0">Rifa: <strong>{{ result()!.raffleTitle }}</strong></p>
          </div>

          @for (r of result()!.reservations; track r.id) {
            <div class="mn-card mb-3">
              <div class="mn-card__body">
                <div class="d-flex justify-content-between align-items-start mb-3 gap-3">
                  <div>
                    <app-status-badge category="reservation" [value]="r.status" [label]="reservationLabel(r.status)"></app-status-badge>
                  </div>
                  <div class="text-end">
                    <div class="fw-bold text-success">{{ r.totalAmount | currencyAr }}</div>
                    <div class="text-muted small">{{ r.numbers.length }} numero{{ r.numbers.length !== 1 ? 's' : '' }}</div>
                  </div>
                </div>

                <div class="d-flex flex-wrap gap-2 mb-3">
                  @for (n of r.numbers; track n) {
                    <span class="badge rounded-pill fw-bold px-3 py-2"
                          style="background:#e0e7ff;color:#3730a3;font-size:.9rem">
                      {{ n }}
                    </span>
                  }
                </div>

                <div class="text-muted small">
                  <i class="bi bi-calendar3 me-1"></i>Reservado el {{ formatDate(r.createdAt) }}
                  @if (r.status === 'PENDING' && r.expiresAt) {
                    · <span class="text-warning fw-semibold">
                      <i class="bi bi-clock me-1"></i>Vence el {{ formatDate(r.expiresAt) }}
                    </span>
                  }
                </div>

                @if (r.status === 'PENDING') {
                  <div class="alert alert-info mt-3 mb-0 py-2 small">
                    <i class="bi bi-info-circle-fill me-1"></i>
                    Tu reserva esta pendiente de pago. Contacta al organizador para confirmarla.
                  </div>
                }
              </div>
            </div>
          }

          <div class="text-center mt-4">
            <a [routerLink]="['/rifa', result()!.raffleSlug]" class="btn btn-outline-primary rounded-3">
              <i class="bi bi-arrow-left me-1"></i>Volver a la rifa
            </a>
          </div>
        }
      </div>

      <footer class="mn-footer">
        <div class="mn-footer__inner">
          <span class="mn-footer__brand">
            <i class="bi bi-ticket-perforated-fill"></i>SuperSorteo
          </span>
          <span class="mn-footer__powered">Plataforma de rifas digitales</span>
        </div>
      </footer>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(99,102,241,.12), transparent 34%),
        linear-gradient(180deg, #f8faff 0%, #eef2ff 100%);
    }
    .mn-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .mn-container {
      width: min(100%, 760px);
      margin: 0 auto;
      padding: 2.5rem 1rem 3rem;
      flex: 1;
    }
    .mn-hero {
      text-align: center;
      margin-bottom: 2rem;
    }
    .mn-hero__back {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .mn-hero__logo {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      padding: .45rem .85rem;
      border-radius: 999px;
      background: rgba(255,255,255,.9);
      border: 1px solid rgba(99,102,241,.12);
      color: #312e81;
      font-weight: 800;
      margin-bottom: 1rem;
    }
    .mn-back-btn {
      display: inline-flex;
      align-items: center;
      gap: .55rem;
      padding: .7rem 1rem;
      border-radius: 999px;
      border: 1px solid rgba(99,102,241,.16);
      background: rgba(255,255,255,.92);
      color: #312e81;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 10px 24px rgba(99,102,241,.1);
      transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    }
    .mn-back-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 28px rgba(99,102,241,.16);
      border-color: rgba(99,102,241,.28);
    }
    .mn-hero__icon {
      width: 76px;
      height: 76px;
      border-radius: 1.4rem;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      font-size: 2rem;
      box-shadow: 0 20px 40px rgba(99,102,241,.22);
    }
    .mn-hero__title {
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      font-weight: 900;
      letter-spacing: -.04em;
      color: #111827;
      margin: 0 0 .45rem;
    }
    .mn-hero__sub {
      color: #6b7280;
      margin: 0;
      font-size: .98rem;
    }
    .mn-card {
      background: rgba(255,255,255,.95);
      border: 1px solid rgba(99,102,241,.1);
      border-radius: 1.35rem;
      box-shadow: 0 14px 40px rgba(99,102,241,.08), 0 2px 8px rgba(0,0,0,.04);
    }
    .mn-card__body {
      padding: 1.35rem;
    }
    .mn-result-head {
      margin: 1.5rem 0 1rem;
    }
    .mn-footer {
      background: #09090b;
      border-top: 1px solid rgba(99,102,241,.12);
      padding: 1.25rem 1rem;
    }
    .mn-footer__inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .75rem;
      flex-wrap: wrap;
    }
    .mn-footer__brand {
      display: flex;
      align-items: center;
      gap: .45rem;
      font-weight: 800;
      font-size: .9rem;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .mn-footer__brand i { font-size: 1rem; }
    .mn-footer__powered {
      color: rgba(255,255,255,.3);
      font-size: .78rem;
    }
    @media (max-width: 575.98px) {
      .mn-container {
        padding: 1.4rem .85rem 2rem;
      }
      .mn-card__body {
        padding: 1rem;
      }
      .mn-hero__icon {
        width: 66px;
        height: 66px;
        border-radius: 1.2rem;
        font-size: 1.7rem;
      }
    }
  `]
})
export class MyNumbers implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);

  protected phone = '';
  protected slug = '';

  protected readonly loading = signal(false);
  protected readonly notFound = signal(false);
  protected readonly result = signal<ParticipantLookupResult | null>(null);
  protected readonly slugFromUrl = signal(false);

  ngOnInit(): void {
    const slug = this.route.snapshot.queryParamMap.get('slug');
    if (slug) {
      this.slug = slug;
      this.slugFromUrl.set(true);
    }
  }

  protected search(): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.result.set(null);

    this.reservationService.lookupReservations(this.phone.trim(), this.slug.trim()).subscribe({
      next: result => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  protected formatDate(dateTime: string): string {
    return new Date(dateTime).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected reservationLabel(status: ReservationStatus): string {
    return ({
      PENDING: 'Pendiente de pago',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
      EXPIRED: 'Expirada',
    })[status] ?? status;
  }
}
