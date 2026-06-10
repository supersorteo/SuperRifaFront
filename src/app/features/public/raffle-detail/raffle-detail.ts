import {
  Component, computed, inject, OnDestroy, OnInit, signal
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RaffleService } from '../../../core/services/raffle.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import {
  NumberInfo, NumberStatus, RafflePublicResponse
} from '../../../core/models/raffle.models';

@Component({
  selector: 'app-raffle-detail',
  imports: [RouterLink, ReactiveFormsModule, DecimalPipe, CurrencyArPipe],
  template: `
    @if (loading()) {
      <div class="d-flex justify-content-center align-items-center" style="min-height:60vh">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" style="width:3rem;height:3rem" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="text-muted">Cargando rifa...</p>
        </div>
      </div>
    }

    @if (!loading() && raffle()) {
      <!-- HERO -->
      <section class="hero-gradient text-white">
        <div class="container py-4">
          <div class="row align-items-center g-4">
            <div class="col-lg-7">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span [class]="statusBadgeClass()">{{ operationalLabel() }}</span>
                @if (raffle()!.drawDateTime) {
                  <span class="badge bg-white bg-opacity-20 text-white">
                    <i class="bi bi-calendar3 me-1"></i>{{ formatDate(raffle()!.drawDateTime!) }}
                  </span>
                }
              </div>
              <h1 class="fw-bold display-6 mb-2">{{ raffle()!.title }}</h1>
              @if (raffle()!.description) {
                <p class="opacity-75 mb-3">{{ raffle()!.description }}</p>
              }
              <div class="d-flex flex-wrap gap-3">
                <div class="d-flex align-items-center gap-1">
                  <i class="bi bi-hash"></i>
                  <span class="fw-semibold">{{ raffle()!.totalNumbers }} números</span>
                </div>
                <div class="d-flex align-items-center gap-1">
                  <i class="bi bi-currency-exchange"></i>
                  <span class="fw-semibold">{{ raffle()!.pricePerNumber | currencyAr }} c/u</span>
                </div>
                <div class="d-flex align-items-center gap-1">
                  <i class="bi bi-person-circle"></i>
                  <span>{{ raffle()!.organizer.displayName }}</span>
                </div>
              </div>
            </div>
            <div class="col-lg-5">
              @if (raffle()!.prize) {
                <div class="card-glass p-3 text-dark">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <i class="bi bi-trophy-fill text-warning fs-4"></i>
                    <span class="fw-bold">Premio</span>
                  </div>
                  <p class="fw-semibold mb-0 fs-5">{{ raffle()!.prize!.name }}</p>
                  @if (raffle()!.prize!.estimatedValue) {
                    <p class="text-success fw-bold mb-0">
                      Valor: {{ raffle()!.prize!.estimatedValue | currencyAr }}
                    </p>
                  }
                  @if (raffle()!.prize!.description) {
                    <p class="text-muted small mb-0 mt-1">{{ raffle()!.prize!.description }}</p>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- PROGRESS BAR -->
      <div class="bg-white shadow-sm py-3">
        <div class="container">
          <div class="row g-3 align-items-center">
            <div class="col-md-8">
              <div class="d-flex justify-content-between small text-muted mb-1">
                <span><i class="bi bi-check-circle-fill text-success me-1"></i>{{ paidCount() }} pagados</span>
                <span><i class="bi bi-clock text-warning me-1"></i>{{ reservedCount() }} reservados</span>
                <span><i class="bi bi-circle text-secondary me-1"></i>{{ availableCount() }} disponibles</span>
              </div>
              <div class="progress" style="height:10px" role="progressbar"
                   [attr.aria-valuenow]="soldPercent()"
                   aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-success" [style.width.%]="paidPercent()"></div>
                <div class="progress-bar bg-warning" [style.width.%]="reservedPercent()"></div>
              </div>
            </div>
            <div class="col-md-4 text-md-end">
              <span class="fw-bold fs-5 text-primary">{{ soldPercent() | number:'1.0-0' }}% vendido</span>
            </div>
          </div>
        </div>
      </div>

      <div class="container py-4">
        <div class="row g-4">

          <!-- NUMBER GRID -->
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                <h5 class="mb-0 fw-semibold">
                  <i class="bi bi-grid-3x3-gap me-2 text-primary"></i>Elegí tus números
                </h5>
                <div class="d-flex gap-3 small">
                  <span><span class="number-cell number-cell--available d-inline-flex" style="width:24px;height:24px;font-size:.6rem">1</span> Disponible</span>
                  <span><span class="number-cell number-cell--selected d-inline-flex" style="width:24px;height:24px;font-size:.6rem">2</span> Seleccionado</span>
                  <span><span class="number-cell number-cell--paid d-inline-flex" style="width:24px;height:24px;font-size:.6rem">3</span> Ocupado</span>
                </div>
              </div>
              <div class="card-body p-3">
                <div class="number-grid">
                  @for (n of numbers(); track n.number) {
                    <button
                      type="button"
                      [class]="'number-cell number-cell--' + cellClass(n)"
                      [disabled]="!isAvailable(n)"
                      (click)="toggleNumber(n.number)"
                      [attr.aria-label]="'Número ' + n.number + ' ' + n.status"
                      [attr.aria-pressed]="isSelected(n.number)">
                      {{ n.number }}
                    </button>
                  }
                </div>
              </div>
              @if (selected().length > 0) {
                <div class="card-footer bg-primary bg-opacity-10 border-top-0 d-flex justify-content-between align-items-center">
                  <span class="fw-semibold text-primary">
                    {{ selected().length }} número{{ selected().length !== 1 ? 's' : '' }} seleccionado{{ selected().length !== 1 ? 's' : '' }}
                  </span>
                  <span class="fw-bold text-primary fs-5">
                    {{ totalPrice() | currencyAr }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- RESERVATION FORM -->
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm sticky-top" style="top:1rem">
              <div class="card-header bg-white border-bottom">
                <h5 class="mb-0 fw-semibold">
                  <i class="bi bi-cart3 me-2 text-primary"></i>Reservar
                </h5>
              </div>
              <div class="card-body">
                @if (selected().length === 0) {
                  <div class="text-center text-muted py-3">
                    <i class="bi bi-cursor-fill fs-2 d-block mb-2 opacity-50"></i>
                    Seleccioná al menos un número para continuar
                  </div>
                } @else {
                  @if (reservationSuccess()) {
                    <div class="alert alert-success text-center">
                      <i class="bi bi-check-circle-fill fs-3 d-block mb-2"></i>
                      <strong>¡Reserva creada!</strong>
                      <p class="mb-0 small mt-1">Tu reserva expira en 30 minutos. Completá el pago para confirmarla.</p>
                    </div>
                  } @else {
                    @if (reservationError()) {
                      <div class="alert alert-danger py-2 small mb-3">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ reservationError() }}
                      </div>
                    }

                    <div class="bg-light rounded p-3 mb-3">
                      <div class="small text-muted mb-1">Números seleccionados</div>
                      <div class="d-flex flex-wrap gap-1">
                        @for (n of selected(); track n) {
                          <span class="badge bg-primary">{{ n }}</span>
                        }
                      </div>
                      <div class="d-flex justify-content-between mt-2">
                        <span class="small text-muted">Total</span>
                        <span class="fw-bold text-primary">{{ totalPrice() | currencyAr }}</span>
                      </div>
                    </div>

                    <form [formGroup]="reserveForm" (ngSubmit)="submitReservation()">
                      <div formGroupName="participant">
                        <div class="mb-2">
                          <label class="form-label small fw-medium" for="fullName">Nombre *</label>
                          <input id="fullName" type="text" class="form-control form-control-sm"
                                 formControlName="fullName" autocomplete="name"
                                 [class.is-invalid]="rtouched('fullName') && reserveForm.get('participant.fullName')?.invalid">
                        </div>
                        <div class="mb-2">
                          <label class="form-label small fw-medium" for="rPhone">Teléfono / WhatsApp *</label>
                          <input id="rPhone" type="tel" class="form-control form-control-sm"
                                 formControlName="phone" autocomplete="tel"
                                 placeholder="+54 9 11 ..."
                                 [class.is-invalid]="rtouched('phone') && reserveForm.get('participant.phone')?.invalid">
                        </div>
                        <div class="mb-3">
                          <label class="form-label small fw-medium" for="rEmail">Email (opcional)</label>
                          <input id="rEmail" type="email" class="form-control form-control-sm"
                                 formControlName="email" autocomplete="email">
                        </div>
                      </div>

                      <!-- Payment method selector -->
                      @if (raffle()!.paymentMethods.length > 0) {
                        <div class="mb-3">
                          <label class="form-label small fw-medium">Método de pago</label>
                          @for (pm of raffle()!.paymentMethods; track pm.displayName) {
                            <div class="border rounded p-2 mb-1 cursor-pointer"
                                 [class.border-primary]="selectedPaymentMethod() === pm.displayName"
                                 (click)="selectedPaymentMethod.set(pm.displayName)"
                                 role="radio"
                                 [attr.aria-checked]="selectedPaymentMethod() === pm.displayName">
                              <div class="d-flex align-items-center gap-2">
                                <i class="bi" [class]="pmIcon(pm.type)"></i>
                                <span class="small fw-medium">{{ pm.displayName }}</span>
                              </div>
                              @if (pm.alias) {
                                <div class="small text-muted ps-4">Alias: {{ pm.alias }}</div>
                              }
                              @if (pm.cbuCvu) {
                                <div class="small text-muted ps-4">CBU/CVU: {{ pm.cbuCvu }}</div>
                              }
                            </div>
                          }
                        </div>
                      }

                      <button type="submit" class="btn btn-primary w-100 fw-semibold"
                              [disabled]="reserving()">
                        @if (reserving()) {
                          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        }
                        <i class="bi bi-lock-fill me-1"></i>Reservar números
                      </button>
                    </form>
                  }
                }
              </div>
            </div>

            <!-- Organizer info -->
            <div class="card border-0 shadow-sm mt-3">
              <div class="card-body d-flex align-items-center gap-3">
                @if (raffle()!.organizer.avatarUrl) {
                  <img [src]="raffle()!.organizer.avatarUrl" alt="Organizador"
                       class="rounded-circle" style="width:48px;height:48px;object-fit:cover">
                } @else {
                  <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                       style="width:48px;height:48px;flex-shrink:0">
                    {{ raffle()!.organizer.displayName.charAt(0).toUpperCase() }}
                  </div>
                }
                <div>
                  <div class="small text-muted">Organiza</div>
                  <div class="fw-semibold">{{ raffle()!.organizer.displayName }}</div>
                  @if (raffle()!.organizer.whatsappNumber) {
                    <a [href]="'https://wa.me/' + raffle()!.organizer.whatsappNumber"
                       target="_blank" rel="noopener noreferrer"
                       class="btn btn-sm btn-success mt-1">
                      <i class="bi bi-whatsapp me-1"></i>WhatsApp
                    </a>
                  }
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    }

    @if (!loading() && !raffle()) {
      <div class="container py-5 text-center">
        <i class="bi bi-ticket-x text-muted" style="font-size:4rem"></i>
        <h3 class="mt-3 text-muted">Rifa no encontrada</h3>
        <a routerLink="/" class="btn btn-primary mt-3">Volver al inicio</a>
      </div>
    }
  `,
  styles: [`
    .sticky-top { top: 1rem !important; }
  `]
})
export class RaffleDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly raffleService = inject(RaffleService);
  private readonly reservationService = inject(ReservationService);
  private readonly ws = inject(WebSocketService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(true);
  protected readonly raffle = signal<RafflePublicResponse | null>(null);
  protected readonly numbers = signal<NumberInfo[]>([]);
  protected readonly selected = signal<number[]>([]);
  protected readonly reserving = signal(false);
  protected readonly reservationSuccess = signal(false);
  protected readonly reservationError = signal('');
  protected readonly selectedPaymentMethod = signal('');

  protected readonly availableCount = computed(() => this.raffle()?.availableCount ?? 0);
  protected readonly reservedCount  = computed(() => this.raffle()?.reservedCount ?? 0);
  protected readonly paidCount      = computed(() => this.raffle()?.paidCount ?? 0);
  protected readonly totalNumbers   = computed(() => this.raffle()?.totalNumbers ?? 1);
  protected readonly paidPercent     = computed(() => (this.paidCount() / this.totalNumbers()) * 100);
  protected readonly reservedPercent = computed(() => (this.reservedCount() / this.totalNumbers()) * 100);
  protected readonly soldPercent     = computed(() => ((this.paidCount() + this.reservedCount()) / this.totalNumbers()) * 100);
  protected readonly totalPrice      = computed(() => this.selected().length * (this.raffle()?.pricePerNumber ?? 0));

  protected readonly reserveForm = this.fb.group({
    participant: this.fb.group({
      fullName: ['', Validators.required],
      phone:    ['', Validators.required],
      email:    [''],
    })
  });

  private wsSub?: Subscription;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.raffleService.getPublic(slug).subscribe({
      next: r => {
        this.raffle.set(r);
        this.loading.set(false);
        this.loadNumbers(slug);
        this.connectWebSocket(r.id);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.ws.disconnect();
  }

  private loadNumbers(slug: string): void {
    this.raffleService.getNumbers(slug).subscribe(nums => this.numbers.set(nums));
  }

  private connectWebSocket(raffleId: string): void {
    this.ws.connect().then(() => {
      this.wsSub = this.ws.subscribe<{ reservedNumbers: number[] }>(
        `/topic/raffle/${raffleId}/numbers`
      ).subscribe(evt => {
        this.numbers.update(nums =>
          nums.map(n =>
            evt.reservedNumbers.includes(n.number)
              ? { ...n, status: 'RESERVED' as NumberStatus }
              : n
          )
        );
      });
    });
  }

  protected isAvailable(n: NumberInfo): boolean {
    return n.status === 'AVAILABLE';
  }

  protected isSelected(num: number): boolean {
    return this.selected().includes(num);
  }

  protected cellClass(n: NumberInfo): string {
    if (this.isSelected(n.number)) return 'selected';
    return n.status.toLowerCase();
  }

  protected toggleNumber(num: number): void {
    this.selected.update(sel =>
      sel.includes(num) ? sel.filter(n => n !== num) : [...sel, num]
    );
  }

  protected rtouched(field: string): boolean {
    return !!this.reserveForm.get('participant')?.get(field)?.touched;
  }

  protected pmIcon(type: string): string {
    const icons: Record<string, string> = {
      MERCADO_PAGO: 'bi-credit-card-2-front-fill text-primary',
      ALIAS_CBU:    'bi-bank text-success',
      TRANSFER:     'bi-arrow-left-right text-info',
      CASH:         'bi-cash text-warning',
      WALLET:       'bi-wallet2 text-purple',
    };
    return icons[type] ?? 'bi-credit-card text-muted';
  }

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  protected operationalLabel(): string {
    const labels: Record<string, string> = {
      ACTIVE:       'Activa',
      SOLD_OUT:     'Agotada',
      PENDING_DRAW: 'Sorteo pronto',
      EXECUTING:    'Sorteando...',
      FINISHED:     'Finalizada',
      CANCELLED:    'Cancelada',
    };
    return labels[this.raffle()?.operationalStatus ?? ''] ?? '';
  }

  protected statusBadgeClass(): string {
    const classes: Record<string, string> = {
      ACTIVE:       'badge bg-success',
      SOLD_OUT:     'badge bg-warning text-dark',
      PENDING_DRAW: 'badge bg-info',
      EXECUTING:    'badge bg-warning text-dark',
      FINISHED:     'badge bg-secondary',
      CANCELLED:    'badge bg-danger',
    };
    return classes[this.raffle()?.operationalStatus ?? ''] ?? 'badge bg-secondary';
  }

  protected submitReservation(): void {
    this.reserveForm.markAllAsTouched();
    if (this.reserveForm.invalid || this.selected().length === 0) return;

    this.reserving.set(true);
    this.reservationError.set('');

    const p = this.reserveForm.get('participant')!.getRawValue() as {
      fullName: string; phone: string; email: string;
    };

    this.reservationService.create({
      raffleSlug: this.raffle()!.slug,
      numbers: this.selected(),
      participant: { fullName: p.fullName, phone: p.phone, email: p.email || undefined },
    }).subscribe({
      next: () => {
        this.reservationSuccess.set(true);
        this.reserving.set(false);
        this.numbers.update(nums =>
          nums.map(n =>
            this.selected().includes(n.number)
              ? { ...n, status: 'RESERVED' as NumberStatus }
              : n
          )
        );
        this.selected.set([]);
      },
      error: (e: Error) => {
        this.reservationError.set(e.message);
        this.reserving.set(false);
      },
    });
  }
}
