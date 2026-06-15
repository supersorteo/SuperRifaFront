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
import { NumberInfo, NumberStatus, RafflePublicResponse } from '../../../core/models/raffle.models';
import { LiveDrawOverlay } from '../../../shared/components/live-draw-overlay/live-draw-overlay';

@Component({
  selector: 'app-raffle-detail',
  imports: [RouterLink, ReactiveFormsModule, DecimalPipe, CurrencyArPipe, LiveDrawOverlay],
  template: `
    <app-live-draw-overlay
      [open]="showLiveDraw()"
      [title]="raffle()?.title || 'Sorteo en vivo'"
      [subtitle]="liveWinnerNumber() === null ? 'Todos los participantes estan viendo esta cuenta regresiva en tiempo real.' : 'Ya tenemos numero ganador.'"
      [countdown]="liveCountdown()"
      [winnerNumber]="liveWinnerNumber()"
      [winnerName]="raffle()?.winnerName || ''" />

    <header class="rd-header">
      <div class="rd-header__inner">
        <span class="rd-logo">
          <i class="bi bi-ticket-perforated-fill"></i>
          <span>SuperRifa</span>
        </span>
        @if (raffle()) {
          <a [routerLink]="['/mis-numeros']" [queryParams]="{ slug: raffle()!.slug }"
             class="btn btn-sm btn-outline-light rounded-pill px-3">
            <i class="bi bi-ticket-perforated me-1"></i>Consultar mis numeros
          </a>
        }
      </div>
    </header>

    @if (loading()) {
      <div class="d-flex justify-content-center align-items-center" style="min-height:70vh">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" style="width:3rem;height:3rem" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="text-muted">Cargando rifa...</p>
        </div>
      </div>
    }

    @if (!loading() && raffle()) {
      @if (allImages().length > 0) {
        <div class="rd-carousel">
          <div class="rd-carousel__track">
            <img [src]="allImages()[activeImg()].url"
                 [alt]="allImages()[activeImg()].altText || raffle()!.title"
                 class="rd-carousel__img">
            <div class="rd-carousel__overlay"></div>
          </div>

          @if (allImages().length > 1) {
            <button class="rd-carousel__btn rd-carousel__btn--prev" (click)="prevImg()" aria-label="Anterior">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button class="rd-carousel__btn rd-carousel__btn--next" (click)="nextImg()" aria-label="Siguiente">
              <i class="bi bi-chevron-right"></i>
            </button>
            <div class="rd-carousel__dots">
              @for (img of allImages(); track $index) {
                <button class="rd-carousel__dot" [class.rd-carousel__dot--active]="$index === activeImg()"
                        (click)="activeImg.set($index)" [attr.aria-label]="'Imagen ' + ($index + 1)"></button>
              }
            </div>
          }
        </div>
      }

      <section class="hero-gradient text-white">
        <div class="container py-4">
          <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <span [class]="statusBadgeClass()">{{ operationalLabel() }}</span>
            @if (raffle()!.drawDateTime) {
              <span class="badge bg-white bg-opacity-20 text-white">
                <i class="bi bi-calendar3 me-1"></i>{{ formatDate(raffle()!.drawDateTime!) }}
              </span>
            }
            @if (raffle()!.winnerNumber) {
              <span class="badge bg-warning text-dark fw-semibold">
                <i class="bi bi-trophy-fill me-1"></i>Ganador: {{ raffle()!.winnerNumber }}
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
              <span class="fw-semibold">{{ raffle()!.totalNumbers }} numeros</span>
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
      </section>

      @if (raffle()!.prize) {
        <div class="bg-white border-bottom">
          <div class="container py-3">
            <div class="d-flex align-items-center gap-3 flex-wrap">
              @if (raffle()!.prize!.imageUrl) {
                <img [src]="raffle()!.prize!.imageUrl" [alt]="raffle()!.prize!.name"
                     class="rounded-3 object-fit-cover flex-shrink-0"
                     style="width:80px;height:80px">
              } @else {
                <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                     style="width:80px;height:80px;background:#fef3c7">
                  <i class="bi bi-trophy-fill text-warning" style="font-size:2rem"></i>
                </div>
              }
              <div>
                <div class="text-muted small fw-semibold text-uppercase mb-1" style="letter-spacing:.06em">
                  <i class="bi bi-trophy-fill text-warning me-1"></i>Premio
                </div>
                <div class="fw-bold fs-5">{{ raffle()!.prize!.name }}</div>
                @if (raffle()!.prize!.estimatedValue) {
                  <div class="text-success fw-bold">Valor: {{ raffle()!.prize!.estimatedValue | currencyAr }}</div>
                }
                @if (raffle()!.prize!.description) {
                  <div class="text-muted small">{{ raffle()!.prize!.description }}</div>
                }
              </div>
            </div>
          </div>
        </div>
      }

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
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 class="mb-0 fw-semibold">
                  <i class="bi bi-grid-3x3-gap me-2 text-primary"></i>Elegi tus numeros
                </h5>
                <div class="d-flex gap-3 small">
                  <span><span class="number-cell number-cell--available d-inline-flex" style="width:24px;height:24px;font-size:.6rem">1</span> Disponible</span>
                  <span><span class="number-cell number-cell--selected d-inline-flex" style="width:24px;height:24px;font-size:.6rem">2</span> Seleccionado</span>
                  <span><span class="number-cell number-cell--paid d-inline-flex" style="width:24px;height:24px;font-size:.6rem">3</span> Reservado</span>
                  <span><span class="number-cell number-cell--winner d-inline-flex" style="width:24px;height:24px;font-size:.6rem">4</span> Ganador</span>
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
                      [attr.aria-label]="'Numero ' + n.number + ' ' + n.status"
                      [attr.aria-pressed]="isSelected(n.number)">
                      {{ n.number }}
                    </button>
                  }
                </div>
              </div>
              @if (selected().length > 0) {
                <div class="card-footer bg-primary bg-opacity-10 border-top-0 d-flex justify-content-between align-items-center">
                  <span class="fw-semibold text-primary">
                    {{ selected().length }} numero{{ selected().length !== 1 ? 's' : '' }} seleccionado{{ selected().length !== 1 ? 's' : '' }}
                  </span>
                  <span class="fw-bold text-primary fs-5">
                    {{ totalPrice() | currencyAr }}
                  </span>
                </div>
              }
            </div>
          </div>

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
                    Selecciona al menos un numero para continuar
                  </div>
                } @else {
                  @if (reservationSuccess()) {
                    <div class="alert alert-success text-center">
                      <i class="bi bi-check-circle-fill fs-3 d-block mb-2"></i>
                      <strong>Reserva creada</strong>
                      <p class="mb-0 small mt-1">Tu reserva expira en 30 minutos. Contacta al organizador para confirmar el pago.</p>
                    </div>
                  } @else {
                    @if (reservationError()) {
                      <div class="alert alert-danger py-2 small mb-3">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ reservationError() }}
                      </div>
                    }

                    <div class="bg-light rounded p-3 mb-3">
                      <div class="small text-muted mb-1">Numeros seleccionados</div>
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
                          <label class="form-label small fw-medium" for="fullName">Nombre completo *</label>
                          <input id="fullName" type="text" class="form-control form-control-sm"
                                 formControlName="fullName" autocomplete="name"
                                 [class.is-invalid]="rtouched('fullName') && reserveForm.get('participant.fullName')?.invalid">
                        </div>
                        <div class="mb-2">
                          <label class="form-label small fw-medium" for="rPhone">Telefono / WhatsApp *</label>
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

                      @if (raffle()!.paymentMethods.length > 0) {
                        <div class="mb-3">
                          <label class="form-label small fw-medium">Metodo de pago</label>
                          @for (pm of raffle()!.paymentMethods; track pm.displayName) {
                            <div class="border rounded p-2 mb-1"
                                 style="cursor:pointer"
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
                              @if (pm.accountHolder) {
                                <div class="small text-muted ps-4">Titular: {{ pm.accountHolder }}</div>
                              }
                              @if (pm.instructions) {
                                <div class="small text-muted ps-4 fst-italic mt-1">{{ pm.instructions }}</div>
                              }
                            </div>
                          }
                        </div>
                      }

                      <button type="submit" class="btn btn-primary w-100 fw-semibold"
                              [disabled]="reserving() || raffle()!.operationalStatus === 'EXECUTING' || raffle()!.operationalStatus === 'FINISHED'">
                        @if (reserving()) {
                          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        }
                        <i class="bi bi-lock-fill me-1"></i>Reservar numeros
                      </button>
                    </form>
                  }
                }
              </div>
            </div>

            <div class="card border-0 shadow-sm mt-3">
              <div class="card-body d-flex align-items-center gap-3">
                @if (raffle()!.organizer.avatarUrl) {
                  <img [src]="raffle()!.organizer.avatarUrl" alt="Organizador"
                       class="rounded-circle object-fit-cover flex-shrink-0"
                       style="width:48px;height:48px">
                } @else {
                  <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                       style="width:48px;height:48px">
                    {{ raffle()!.organizer.displayName.charAt(0).toUpperCase() }}
                  </div>
                }
                <div>
                  <div class="small text-muted">Organiza</div>
                  <div class="fw-semibold">{{ raffle()!.organizer.displayName }}</div>
                  @if (raffle()!.organizer.whatsappNumber) {
                    <a [href]="'https://wa.me/' + raffle()!.organizer.whatsappNumber!.replace(/\\D/g, '')"
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

      <footer class="rd-footer">
        <span>Powered by <strong>SuperRifa</strong></span>
      </footer>
    }

    @if (!loading() && !raffle()) {
      <div class="container py-5 text-center">
        <i class="bi bi-ticket-x text-muted" style="font-size:4rem"></i>
        <h3 class="mt-3 text-muted">Rifa no encontrada</h3>
        <p class="text-muted">El enlace puede ser incorrecto o la rifa aun no esta disponible.</p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #f8fafc; }

    .rd-header {
      background: linear-gradient(135deg,#1e1b4b,#4f46e5);
      padding: .75rem 1.25rem;
      position: sticky; top: 0; z-index: 100;
    }
    .rd-header__inner {
      max-width: 1140px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    }
    .rd-logo {
      display: flex; align-items: center; gap: .5rem;
      color: #fff; text-decoration: none; font-weight: 800; font-size: 1.1rem;
    }
    .rd-logo i { color: #fbbf24; font-size: 1.3rem; }

    .rd-carousel {
      position: relative; width: 100%; overflow: hidden;
      background: #0f172a; max-height: 420px;
    }
    .rd-carousel__track { width: 100%; }
    .rd-carousel__img {
      width: 100%; height: 420px; object-fit: cover;
      display: block; transition: opacity .3s;
    }
    .rd-carousel__overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,.55) 100%);
      pointer-events: none;
    }
    .rd-carousel__btn {
      position: absolute; top: 50%; transform: translateY(-50%);
      background: rgba(0,0,0,.45); border: none; color: #fff;
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; cursor: pointer; transition: background .15s;
    }
    .rd-carousel__btn:hover { background: rgba(0,0,0,.7); }
    .rd-carousel__btn--prev { left: 1rem; }
    .rd-carousel__btn--next { right: 1rem; }
    .rd-carousel__dots {
      position: absolute; bottom: .75rem; left: 50%; transform: translateX(-50%);
      display: flex; gap: .4rem;
    }
    .rd-carousel__dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255,255,255,.45); border: none; cursor: pointer;
      transition: background .2s, transform .2s;
    }
    .rd-carousel__dot--active { background: #fff; transform: scale(1.3); }

    .rd-footer {
      background: #1e293b; color: #94a3b8;
      text-align: center; padding: 1rem;
      font-size: .82rem; margin-top: 3rem;
      display: flex; align-items: center; justify-content: center; gap: 1rem;
    }
    .rd-footer__link {
      color: #a5b4fc; text-decoration: none; font-weight: 600;
    }
    .rd-footer__link:hover { text-decoration: underline; }
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
  protected readonly activeImg = signal(0);
  protected readonly liveCountdown = signal<number | null>(null);
  protected readonly liveWinnerNumber = signal<number | null>(null);
  protected readonly showLiveDraw = signal(false);

  protected readonly allImages = computed(() => {
    const raffle = this.raffle();
    if (!raffle) return [];
    const images = [...raffle.images].sort((a, b) => a.displayOrder - b.displayOrder);
    if (raffle.prize?.imageUrl && !images.some(i => i.url === raffle.prize!.imageUrl)) {
      images.unshift({ url: raffle.prize.imageUrl, altText: raffle.prize.name, coverImage: false, displayOrder: -1 });
    }
    return images;
  });

  protected readonly availableCount = computed(() => this.raffle()?.availableCount ?? 0);
  protected readonly reservedCount = computed(() => this.raffle()?.reservedCount ?? 0);
  protected readonly paidCount = computed(() => this.raffle()?.paidCount ?? 0);
  protected readonly totalNumbers = computed(() => this.raffle()?.totalNumbers ?? 1);
  protected readonly paidPercent = computed(() => (this.paidCount() / this.totalNumbers()) * 100);
  protected readonly reservedPercent = computed(() => (this.reservedCount() / this.totalNumbers()) * 100);
  protected readonly soldPercent = computed(() => ((this.paidCount() + this.reservedCount()) / this.totalNumbers()) * 100);
  protected readonly totalPrice = computed(() => this.selected().length * (this.raffle()?.pricePerNumber ?? 0));

  protected readonly reserveForm = this.fb.group({
    participant: this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      email: [''],
    })
  });

  private wsSubs: Subscription[] = [];
  private slideTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.raffleService.getPublic(slug).subscribe({
      next: raffle => {
        this.raffle.set(raffle);
        this.loading.set(false);
        this.loadNumbers(slug);
        this.connectWebSocket(raffle.id);
        this.startSlideTimer();
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    for (const sub of this.wsSubs) {
      sub.unsubscribe();
    }
    this.ws.disconnect();
    clearInterval(this.slideTimer);
  }

  private loadNumbers(slug: string): void {
    this.raffleService.getNumbers(slug).subscribe(numbers => this.numbers.set(numbers));
  }

  private connectWebSocket(raffleId: string): void {
    this.ws.connect().then(() => {
      this.wsSubs = [
        this.ws.subscribe<{ reservedNumbers: number[] }>(`/topic/raffle/${raffleId}/numbers`).subscribe(evt => {
          this.numbers.update(numbers =>
            numbers.map(number =>
              evt.reservedNumbers.includes(number.number)
                ? { ...number, status: 'RESERVED' as NumberStatus }
                : number
            )
          );
        }),
        this.ws.subscribe<{ available: number; reserved: number; paid: number }>(`/topic/raffle/${raffleId}/progress`).subscribe(evt => {
          this.raffle.update(raffle => raffle ? {
            ...raffle,
            availableCount: evt.available,
            reservedCount: evt.reserved,
            paidCount: evt.paid,
            operationalStatus: raffle.operationalStatus === 'FINISHED'
              ? raffle.operationalStatus
              : (evt.available === 0 ? 'SOLD_OUT' : raffle.operationalStatus),
          } : raffle);
        }),
        this.ws.subscribe<{ status: string }>(`/topic/raffle/${raffleId}/status`).subscribe(evt => {
          if (evt.status === 'EXECUTING') {
            this.showLiveDraw.set(true);
            this.liveCountdown.set(5);
            this.liveWinnerNumber.set(null);
            this.raffle.update(raffle => raffle ? { ...raffle, operationalStatus: 'EXECUTING' } : raffle);
          }

          if (evt.status === 'FAILED') {
            this.showLiveDraw.set(false);
            this.liveCountdown.set(null);
            this.liveWinnerNumber.set(null);
            this.raffle.update(raffle => raffle ? { ...raffle, operationalStatus: 'ACTIVE' } : raffle);
          }
        }),
        this.ws.subscribe<{ secondsRemaining: number }>(`/topic/raffle/${raffleId}/countdown`).subscribe(evt => {
          this.showLiveDraw.set(true);
          this.liveCountdown.set(evt.secondsRemaining);
        }),
        this.ws.subscribe<{ winnerNumber: number; winnerName?: string }>(`/topic/raffle/${raffleId}/result`).subscribe(evt => {
          this.liveCountdown.set(null);
          this.liveWinnerNumber.set(evt.winnerNumber);
          this.raffle.update(raffle => raffle ? {
            ...raffle,
            operationalStatus: 'FINISHED',
            winnerNumber: evt.winnerNumber,
            winnerName: evt.winnerName || raffle.winnerName,
          } : raffle);
          this.numbers.update(numbers =>
            numbers.map(number => number.number === evt.winnerNumber
              ? { ...number, status: 'WINNER' as NumberStatus }
              : number
            )
          );
          this.selected.set([]);
          setTimeout(() => this.showLiveDraw.set(false), 3200);
        }),
      ];
    });
  }

  private startSlideTimer(): void {
    if (this.allImages().length < 2) return;
    this.slideTimer = setInterval(() => {
      this.activeImg.update(index => (index + 1) % this.allImages().length);
    }, 4000);
  }

  protected prevImg(): void {
    clearInterval(this.slideTimer);
    this.activeImg.update(index => (index - 1 + this.allImages().length) % this.allImages().length);
    this.startSlideTimer();
  }

  protected nextImg(): void {
    clearInterval(this.slideTimer);
    this.activeImg.update(index => (index + 1) % this.allImages().length);
    this.startSlideTimer();
  }

  protected isAvailable(n: NumberInfo): boolean {
    return n.status === 'AVAILABLE'
      && this.raffle()?.operationalStatus !== 'FINISHED'
      && this.raffle()?.operationalStatus !== 'EXECUTING';
  }

  protected isSelected(num: number): boolean {
    return this.selected().includes(num);
  }

  protected cellClass(n: NumberInfo): string {
    if (this.isSelected(n.number)) return 'selected';
    return n.status.toLowerCase();
  }

  protected toggleNumber(num: number): void {
    this.selected.update(selected =>
      selected.includes(num) ? selected.filter(n => n !== num) : [...selected, num]
    );
  }

  protected rtouched(field: string): boolean {
    return !!this.reserveForm.get('participant')?.get(field)?.touched;
  }

  protected pmIcon(type: string): string {
    const icons: Record<string, string> = {
      MERCADO_PAGO: 'bi-credit-card-2-front-fill text-primary',
      ALIAS_CBU: 'bi-bank text-success',
      TRANSFER: 'bi-arrow-left-right text-info',
      CASH: 'bi-cash text-warning',
      WALLET: 'bi-wallet2',
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
      ACTIVE: 'Activa', SOLD_OUT: 'Agotada', PENDING_DRAW: 'Sorteo pronto',
      EXECUTING: 'Sorteando...', FINISHED: 'Finalizada', CANCELLED: 'Cancelada',
    };
    return labels[this.raffle()?.operationalStatus ?? ''] ?? '';
  }

  protected statusBadgeClass(): string {
    const classes: Record<string, string> = {
      ACTIVE: 'badge bg-success', SOLD_OUT: 'badge bg-warning text-dark',
      PENDING_DRAW: 'badge bg-info', EXECUTING: 'badge bg-warning text-dark',
      FINISHED: 'badge bg-secondary', CANCELLED: 'badge bg-danger',
    };
    return classes[this.raffle()?.operationalStatus ?? ''] ?? 'badge bg-secondary';
  }

  protected submitReservation(): void {
    this.reserveForm.markAllAsTouched();
    if (this.reserveForm.invalid || this.selected().length === 0) return;
    if (this.raffle()?.operationalStatus === 'EXECUTING' || this.raffle()?.operationalStatus === 'FINISHED') return;

    this.reserving.set(true);
    this.reservationError.set('');

    const participant = this.reserveForm.get('participant')!.getRawValue() as {
      fullName: string; phone: string; email: string;
    };

    this.reservationService.create({
      raffleSlug: this.raffle()!.slug,
      numbers: this.selected(),
      participant: { fullName: participant.fullName, phone: participant.phone, email: participant.email || undefined },
    }).subscribe({
      next: () => {
        this.reservationSuccess.set(true);
        this.reserving.set(false);
        this.numbers.update(numbers =>
          numbers.map(number =>
            this.selected().includes(number.number)
              ? { ...number, status: 'RESERVED' as NumberStatus }
              : number
          )
        );
        this.selected.set([]);
      },
      error: (e: { message: string }) => {
        this.reservationError.set(e.message ?? 'Error al crear la reserva');
        this.reserving.set(false);
      },
    });
  }
}
