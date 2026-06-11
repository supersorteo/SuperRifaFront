import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminOrganizer, AdminOrganizerDetail, AdminRaffle } from '../../../core/models/admin.models';

type DelOrg  = { kind: 'organizer'; id: string; fullName: string; raffleCount: number; totalParticipants: number };
type DelRaffle = { kind: 'raffle'; raffle: AdminRaffle; organizerId: string };
type ConfirmTarget = DelOrg | DelRaffle;

@Component({
  selector: 'app-admin-organizers',
  imports: [DecimalPipe],
  template: `
    <!-- ── HEADER ──────────────────────────────────────── -->
    <div class="ao-header mb-4">
      <div>
        <h2 class="ao-title">Organizadores</h2>
        <p class="ao-subtitle">{{ organizers().length }} registrados · {{ activeCount() }} activos</p>
      </div>
    </div>

    <!-- Search -->
    <div class="ao-search-wrap mb-4">
      <i class="bi bi-search ao-search-icon"></i>
      <input class="ao-search" type="text"
             placeholder="Buscar por nombre, correo o negocio…"
             [value]="search()"
             (input)="search.set($any($event.target).value)" />
    </div>

    <!-- ── TABLE ──────────────────────────────────────── -->
    @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border" style="color:#6366f1;width:2rem;height:2rem" role="status">
          <span class="visually-hidden">Cargando…</span>
        </div>
      </div>
    } @else if (filtered().length === 0) {
      <div class="ao-empty">
        <i class="bi bi-people ao-empty-icon"></i>
        <p>No hay organizadores que coincidan</p>
      </div>
    } @else {
      <div class="ao-table-wrap">
        <table class="ao-table" role="grid">
          <thead>
            <tr>
              <th>Organizador</th>
              <th class="d-none d-md-table-cell">Teléfono</th>
              <th>Rifas</th>
              <th>Estado</th>
              <th>Registro</th>
              <th class="ao-th-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (o of filtered(); track o.id) {
              <tr>
                <td>
                  <div class="ao-org-cell">
                    <div class="ao-org-avatar">{{ o.fullName.charAt(0).toUpperCase() }}</div>
                    <div class="ao-org-info">
                      <div class="ao-org-name">{{ o.fullName }}</div>
                      <!--div-- class="ao-org-email">{{ o.email }}</!--div-->
                      @if (o.businessName) {
                        <div class="ao-org-biz">{{ o.businessName }}</div>
                      }
                    </div>
                  </div>
                </td>
                <td class="d-none d-md-table-cell ao-td-muted">{{ o.phone ?? '—' }}</td>
                <td>
                  <span class="ao-chip ao-chip--blue">
                    <i class="bi bi-ticket-perforated-fill"></i> {{ o.raffleCount }}
                  </span>
                </td>
                <td>
                  <span class="ao-chip" [class.ao-chip--green]="o.active" [class.ao-chip--red]="!o.active">
                    {{ o.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="ao-td-muted ao-td-date">{{ fmt(o.createdAt) }}</td>
                <td class="ao-td-actions">
                  <div class="ao-actions">
                    <button class="ao-btn-action ao-btn-action--blue"
                            (click)="openPanel(o)"
                            title="Ver rifas del organizador"
                            aria-label="Ver rifas">
                      <i class="bi bi-ticket-perforated"></i>
                      <span class="ao-btn-action__label">Ver rifas</span>
                    </button>
                    <button class="ao-btn-action ao-btn-action--red"
                            (click)="askDeleteOrg(o)"
                            title="Eliminar organizador"
                            aria-label="Eliminar organizador">
                      <i class="bi bi-trash3"></i>
                      <span class="ao-btn-action__label">Eliminar</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- ── PANEL LATERAL (rifas del organizador) ──────── -->
    @if (panelOpen()) {
      <div class="ao-backdrop" (click)="closePanel()"></div>
      <aside class="ao-panel" role="dialog" aria-label="Rifas del organizador">

        <div class="ao-panel__topbar">
          <button class="ao-panel__back" (click)="closePanel()" aria-label="Cerrar panel">
            <i class="bi bi-arrow-left"></i>
          </button>
          @if (detail(); as d) {
            <div>
              <div class="ao-panel__topbar-title">{{ d.fullName }}</div>
              <div class="ao-panel__topbar-sub">{{ d.raffles.length }} rifa(s) · {{ d.totalParticipants | number }} participantes</div>
            </div>
          } @else {
            <span class="ao-panel__topbar-title">Rifas del organizador</span>
          }
        </div>

        @if (detailLoading()) {
          <div class="text-center py-5">
            <div class="spinner-border" style="color:#6366f1" role="status">
              <span class="visually-hidden">Cargando…</span>
            </div>
          </div>
        } @else if (detail(); as d) {

          <!-- Stats del organizador -->
          <div class="ao-stats">
            <div class="ao-stat">
              <span class="ao-stat__val">{{ d.raffles.length }}</span>
              <span class="ao-stat__lbl">Rifas</span>
            </div>
            <div class="ao-stat">
              <span class="ao-stat__val">{{ d.totalParticipants | number }}</span>
              <span class="ao-stat__lbl">Participantes</span>
            </div>
            <div class="ao-stat">
              <span class="ao-stat__val">{{ activeRaffles(d) }}</span>
              <span class="ao-stat__lbl">Activas</span>
            </div>
            <div class="ao-stat">
              <span class="ao-stat__val" [style.color]="d.active ? '#34d399' : '#f87171'">
                {{ d.active ? '✓' : '✗' }}
              </span>
              <span class="ao-stat__lbl">Estado</span>
            </div>
          </div>

          <!-- Lista de rifas -->
          <div class="ao-section">
            <h6 class="ao-section__title">Rifas ({{ d.raffles.length }})</h6>

            @if (d.raffles.length === 0) {
              <p class="ao-section__empty">Este organizador no tiene rifas</p>
            } @else {
              @for (r of d.raffles; track r.id) {
                <div class="ao-raffle-row">
                  <div class="ao-raffle-row__img">
                    @if (r.firstImageUrl) {
                      <img [src]="r.firstImageUrl" [alt]="r.title" class="ao-raffle-row__thumb">
                    } @else {
                      <i class="bi bi-ticket-perforated ao-raffle-row__no-img"></i>
                    }
                  </div>
                  <div class="ao-raffle-row__body">
                    <div class="ao-raffle-row__title">{{ r.title }}</div>
                    <div class="ao-raffle-row__meta">
                      <span class="ao-pill" [class]="pubCls(r.publicationStatus)">{{ pubLabel(r.publicationStatus) }}</span>
                      <span class="ao-raffle-row__info">{{ r.totalNumbers }} núm. · {{ r.participantCount }} part.</span>
                    </div>
                  </div>
                  <button class="ao-btn-danger-sm"
                          (click)="askDeleteRaffle(r, d.id)"
                          title="Eliminar rifa" aria-label="Eliminar rifa">
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              }
            }
          </div>

        }
      </aside>
    }

    <!-- ── CONFIRM MODAL ──────────────────────────────── -->
    @if (confirm()) {

      <div class="ao-confirm-overlay" role="dialog" aria-modal="true">
        <div class="ao-confirm-box">

          @if (confirm()!.kind === 'raffle') {
            <div class="ao-confirm-icon ao-confirm-icon--warn">
              <i class="bi bi-trash3-fill"></i>
            </div>
            <h4 class="ao-confirm-title">Eliminar rifa</h4>
            <p class="ao-confirm-body">
              ¿Eliminar <strong>{{ $any(confirm()).raffle.title }}</strong>?<br>
              Se borrarán todos sus números, reservas y pagos. Esta acción no se puede deshacer.
            </p>
            <div class="ao-confirm-actions">
              <button class="ao-confirm-cancel" (click)="confirm.set(null)">Cancelar</button>
              <button class="ao-confirm-submit ao-confirm-submit--red"
                      [disabled]="deleting()" (click)="execDeleteRaffle()">
                @if (deleting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                Eliminar rifa
              </button>
            </div>

          } @else {
            <div class="ao-confirm-icon ao-confirm-icon--red">
              <i class="bi bi-person-x-fill"></i>
            </div>
            <h4 class="ao-confirm-title">Eliminar organizador</h4>
            <p class="ao-confirm-body">
              Esta acción eliminará a <strong>{{ $any(confirm()).fullName }}</strong> y todos sus datos:
            </p>
            <ul class="ao-confirm-list">
              <li><i class="bi bi-ticket-perforated-fill me-2" style="color:#818cf8"></i>{{ $any(confirm()).raffleCount }} rifa(s)</li>
              <li><i class="bi bi-people-fill me-2" style="color:#34d399"></i>{{ $any(confirm()).totalParticipants }} participante(s)</li>
              <li><i class="bi bi-credit-card-fill me-2" style="color:#fbbf24"></i>Métodos de pago y suscripción</li>
            </ul>
            <div class="ao-confirm-check">
              <label class="ao-confirm-check__label">Escribí <strong>ELIMINAR</strong> para confirmar</label>
              <input class="ao-confirm-check__input" type="text"
                     [value]="confirmText()"
                     (input)="confirmText.set($any($event.target).value)"
                     placeholder="ELIMINAR" />
            </div>
            <div class="ao-confirm-actions">
              <button class="ao-confirm-cancel" (click)="confirm.set(null); confirmText.set('')">Cancelar</button>
              <button class="ao-confirm-submit ao-confirm-submit--red"
                      [disabled]="deleting() || confirmText() !== 'ELIMINAR'"
                      (click)="execDeleteOrganizer()">
                @if (deleting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                Eliminar todo
              </button>
            </div>
          }

        </div>
      </div>
    }
  `,
  styles: [`
    /* ── header / search ── */
    .ao-header  { display:flex; align-items:flex-start; }
    .ao-title   { font-size:1.4rem; font-weight:800; color:#f1f5f9; margin:0; }
    .ao-subtitle{ font-size:.83rem; color:#64748b; margin:.2rem 0 0; }

    .ao-search-wrap { position:relative; }
    .ao-search-icon { position:absolute; left:.9rem; top:50%; transform:translateY(-50%); color:#475569; pointer-events:none; }
    .ao-search {
      width:100%; background:rgba(255,255,255,.05);
      border:1px solid rgba(255,255,255,.1); border-radius:.65rem;
      color:#f1f5f9; padding:.7rem 1rem .7rem 2.5rem;
      font-size:.9rem; outline:none; transition:border-color .2s;
    }
    .ao-search:focus { border-color:#6366f1; }
    .ao-search::placeholder { color:#475569; }

    /* ── table ── */
    .ao-table-wrap {
      background:rgba(255,255,255,.03);
      border:1px solid rgba(255,255,255,.07);
      border-radius:.875rem; overflow:hidden;
    }
    .ao-table { width:100%; border-collapse:collapse; }
    .ao-table thead th {
      background:rgba(255,255,255,.04);
      color:#64748b; font-size:.72rem; font-weight:700;
      text-transform:uppercase; letter-spacing:.06em;
      padding:.75rem 1rem; border-bottom:1px solid rgba(255,255,255,.06);
      white-space:nowrap;
    }
    .ao-th-actions { text-align:right; }
    .ao-table tbody tr {
      border-bottom:1px solid rgba(255,255,255,.04);
      transition:background .12s;
    }
    .ao-table tbody tr:last-child { border-bottom:none; }
    .ao-table tbody tr:hover { background:rgba(255,255,255,.03); }
    .ao-table tbody td { padding:.85rem 1rem; vertical-align:middle; }
    .ao-td-muted  { color:#64748b; font-size:.83rem; }
    .ao-td-date   { white-space:nowrap; }
    .ao-td-actions{ text-align:right; }

    /* ── organizer cell ── */
    .ao-org-cell  { display:flex; align-items:center; gap:.75rem; }
    .ao-org-avatar{
      width:38px; height:38px; flex-shrink:0; border-radius:50%;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:.95rem; color:#fff;
    }
    .ao-org-name  { font-weight:600; color:#e2e8f0; font-size:.9rem; line-height:1.2; }
    .ao-org-email { font-size:.78rem; color:#64748b; }
    .ao-org-biz   { font-size:.75rem; color:#475569; }

    /* ── chips ── */
    .ao-chip {
      display:inline-flex; align-items:center; gap:.3rem;
      padding:.22rem .55rem; border-radius:999px;
      font-size:.72rem; font-weight:600; white-space:nowrap;
    }
    .ao-chip--blue  { background:rgba(99,102,241,.15); color:#818cf8; }
    .ao-chip--green { background:rgba(52,211,153,.15);  color:#34d399; }
    .ao-chip--red   { background:rgba(248,113,113,.15); color:#f87171; }

    /* ── action buttons ── */
    .ao-actions { display:flex; align-items:center; justify-content:flex-end; gap:.45rem; }
    .ao-btn-action {
      display:inline-flex; align-items:center; gap:.35rem;
      border:1px solid; border-radius:.5rem;
      padding:.38rem .65rem; font-size:.78rem; font-weight:600;
      cursor:pointer; transition:background .15s, opacity .15s;
      white-space:nowrap; background:transparent;
    }
    .ao-btn-action--blue { border-color:rgba(99,102,241,.35); color:#818cf8; }
    .ao-btn-action--blue:hover { background:rgba(99,102,241,.12); }
    .ao-btn-action--red  { border-color:rgba(248,113,113,.3);  color:#f87171; }
    .ao-btn-action--red:hover  { background:rgba(248,113,113,.1); }
    .ao-btn-action__label { display:none; }
    @media (min-width:1200px) { .ao-btn-action__label { display:inline; } }

    /* ── empty state ── */
    .ao-empty { text-align:center; padding:3rem 1rem; color:#475569; }
    .ao-empty-icon { font-size:2.5rem; display:block; margin-bottom:.75rem; color:#334155; }

    /* ── PANEL ── */
    .ao-backdrop {
      position:fixed; inset:0; z-index:1040;
      background:rgba(0,0,0,.55); backdrop-filter:blur(3px);
    }
    .ao-panel {
      position:fixed; top:0; right:0; bottom:0; z-index:1045;
      width:min(500px,100vw);
      background:#0f172a;
      border-left:1px solid rgba(255,255,255,.08);
      overflow-y:auto;
      box-shadow:-8px 0 40px rgba(0,0,0,.5);
    }
    .ao-panel__topbar {
      display:flex; align-items:center; gap:.75rem;
      padding:1rem 1.25rem;
      border-bottom:1px solid rgba(255,255,255,.07);
      position:sticky; top:0; background:#0f172a; z-index:1;
    }
    .ao-panel__back {
      background:rgba(255,255,255,.06); border:none;
      color:#94a3b8; width:34px; height:34px; border-radius:.5rem;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; flex-shrink:0; transition:background .15s;
    }
    .ao-panel__back:hover { background:rgba(255,255,255,.1); color:#f1f5f9; }
    .ao-panel__topbar-title { font-weight:600; color:#e2e8f0; font-size:.92rem; line-height:1.2; }
    .ao-panel__topbar-sub   { font-size:.75rem; color:#64748b; }

    /* ── stats ── */
    .ao-stats {
      display:grid; grid-template-columns:repeat(4,1fr);
      border-bottom:1px solid rgba(255,255,255,.06);
    }
    .ao-stat { padding:.9rem .6rem; text-align:center; border-right:1px solid rgba(255,255,255,.05); }
    .ao-stat:last-child { border-right:none; }
    .ao-stat__val { display:block; font-size:1.3rem; font-weight:800; color:#f1f5f9; line-height:1.1; }
    .ao-stat__lbl { display:block; font-size:.7rem; color:#64748b; margin-top:.2rem; }

    /* ── section ── */
    .ao-section { padding:1.25rem 1.5rem 2rem; }
    .ao-section__title { font-size:.72rem; font-weight:700; color:#64748b;
      text-transform:uppercase; letter-spacing:.07em; margin:0 0 .85rem; }
    .ao-section__empty { color:#475569; font-size:.85rem; margin:0; }

    /* ── raffle row ── */
    .ao-raffle-row { display:flex; align-items:center; gap:.85rem; padding:.65rem .4rem; border-radius:.6rem; transition:background .15s; }
    .ao-raffle-row:hover { background:rgba(255,255,255,.04); }
    .ao-raffle-row__img { width:42px; height:42px; flex-shrink:0; border-radius:.45rem; overflow:hidden;
      background:rgba(255,255,255,.06); display:flex; align-items:center; justify-content:center; }
    .ao-raffle-row__thumb { width:100%; height:100%; object-fit:cover; }
    .ao-raffle-row__no-img { font-size:1.2rem; color:#334155; }
    .ao-raffle-row__body { flex:1; min-width:0; }
    .ao-raffle-row__title { font-size:.88rem; font-weight:600; color:#e2e8f0;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ao-raffle-row__meta { display:flex; align-items:center; gap:.5rem; margin-top:.2rem; flex-wrap:wrap; }
    .ao-raffle-row__info { font-size:.75rem; color:#64748b; }

    .ao-pill { display:inline-block; padding:.15rem .5rem; border-radius:999px; font-size:.7rem; font-weight:600; }
    .ao-pill--pub  { background:rgba(99,102,241,.15); color:#818cf8; }
    .ao-pill--draft{ background:rgba(100,116,139,.15); color:#94a3b8; }
    .ao-pill--pause{ background:rgba(251,191,36,.15);  color:#fbbf24; }
    .ao-pill--fin  { background:rgba(52,211,153,.15);  color:#34d399; }
    .ao-pill--cls  { background:rgba(30,27,75,.4);     color:#6366f1; }

    .ao-btn-danger-sm {
      background:transparent; border:1px solid rgba(248,113,113,.25);
      color:#f87171; border-radius:.45rem; width:32px; height:32px;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; flex-shrink:0; transition:background .15s;
    }
    .ao-btn-danger-sm:hover { background:rgba(248,113,113,.12); border-color:#f87171; }

    /* ── confirm modal ── */
    .ao-confirm-overlay {
      position:fixed; inset:0; z-index:2000;
      background:rgba(0,0,0,.8); backdrop-filter:blur(4px);
      display:flex; align-items:center; justify-content:center; padding:1rem;
    }
    .ao-confirm-box {
      background:#0f172a; border:1px solid rgba(255,255,255,.1);
      border-radius:1.25rem; width:100%; max-width:440px;
      padding:2rem; box-shadow:0 25px 60px rgba(0,0,0,.6);
    }
    .ao-confirm-icon {
      width:52px; height:52px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:1.4rem; margin:0 auto 1.1rem;
    }
    .ao-confirm-icon--warn { background:rgba(251,191,36,.15); color:#fbbf24; }
    .ao-confirm-icon--red  { background:rgba(220,38,38,.15);  color:#f87171; }
    .ao-confirm-title { font-size:1.1rem; font-weight:700; color:#f1f5f9; text-align:center; margin:0 0 .6rem; }
    .ao-confirm-body  { font-size:.88rem; color:#94a3b8; text-align:center; margin:0 0 1rem; line-height:1.55; }
    .ao-confirm-list  {
      list-style:none; padding:.75rem 1rem; margin:0 0 1.25rem;
      background:rgba(255,255,255,.04); border-radius:.6rem;
    }
    .ao-confirm-list li { font-size:.85rem; color:#94a3b8; padding:.25rem 0; }
    .ao-confirm-check { margin-bottom:1.25rem; }
    .ao-confirm-check__label { font-size:.8rem; color:#64748b; display:block; margin-bottom:.4rem; }
    .ao-confirm-check__input {
      width:100%; background:rgba(255,255,255,.05);
      border:1px solid rgba(255,255,255,.1); border-radius:.55rem;
      color:#f1f5f9; padding:.65rem .9rem; font-size:.9rem; outline:none;
      transition:border-color .2s;
    }
    .ao-confirm-check__input:focus { border-color:#6366f1; }
    .ao-confirm-actions { display:flex; gap:.75rem; }
    .ao-confirm-cancel {
      flex:1; background:transparent; border:1px solid rgba(255,255,255,.1);
      color:#64748b; border-radius:.65rem; padding:.7rem; font-size:.9rem; cursor:pointer;
      transition:color .15s, border-color .15s;
    }
    .ao-confirm-cancel:hover { color:#94a3b8; border-color:rgba(255,255,255,.2); }
    .ao-confirm-submit {
      flex:1; border:none; border-radius:.65rem; padding:.7rem;
      font-size:.9rem; font-weight:600; cursor:pointer; transition:opacity .2s;
    }
    .ao-confirm-submit--red { background:linear-gradient(135deg,#dc2626,#b91c1c); color:#fff; }
    .ao-confirm-submit:disabled { opacity:.5; cursor:not-allowed; }
    .ao-confirm-submit:not(:disabled):hover { opacity:.88; }
  `]
})
export class AdminOrganizers implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly loading       = signal(true);
  protected readonly organizers    = signal<AdminOrganizer[]>([]);
  protected readonly search        = signal('');
  protected readonly panelOpen     = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly detail        = signal<AdminOrganizerDetail | null>(null);
  protected readonly confirm       = signal<ConfirmTarget | null>(null);
  protected readonly confirmText   = signal('');
  protected readonly deleting      = signal(false);

  protected readonly activeCount = computed(() =>
    this.organizers().filter(o => o.active).length
  );

  protected readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.organizers();
    return this.organizers().filter(o =>
      o.fullName.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      (o.businessName ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadList();
  }

  private loadList(): void {
    this.loading.set(true);
    this.adminService.getOrganizers().subscribe({
      next: data => { this.organizers.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  protected openPanel(o: AdminOrganizer): void {
    this.panelOpen.set(true);
    this.detail.set(null);
    this.detailLoading.set(true);
    this.adminService.getOrganizerDetail(o.id).subscribe({
      next: d => { this.detail.set(d); this.detailLoading.set(false); },
      error: () => this.detailLoading.set(false),
    });
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
    this.detail.set(null);
  }

  protected askDeleteOrg(o: AdminOrganizer): void {
    const d = this.detail();
    const totalParticipants = (d?.id === o.id) ? d.totalParticipants : 0;
    this.confirmText.set('');
    this.confirm.set({
      kind: 'organizer',
      id: o.id,
      fullName: o.fullName,
      raffleCount: o.raffleCount,
      totalParticipants,
    });
  }

  protected askDeleteRaffle(r: AdminRaffle, organizerId: string): void {
    this.confirm.set({ kind: 'raffle', raffle: r, organizerId });
  }

  protected execDeleteRaffle(): void {
    const c = this.confirm();
    if (!c || c.kind !== 'raffle') return;
    this.deleting.set(true);
    this.adminService.deleteRaffle(c.raffle.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.confirm.set(null);
        const d = this.detail();
        if (d) {
          this.detail.set({ ...d, raffles: d.raffles.filter(r => r.id !== c.raffle.id) });
        }
        this.organizers.update(list =>
          list.map(o => o.id === c.organizerId
            ? { ...o, raffleCount: Math.max(0, o.raffleCount - 1) }
            : o)
        );
      },
      error: () => this.deleting.set(false),
    });
  }

  protected execDeleteOrganizer(): void {
    const c = this.confirm();
    if (!c || c.kind !== 'organizer' || this.confirmText() !== 'ELIMINAR') return;
    this.deleting.set(true);
    this.adminService.deleteOrganizer(c.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.confirm.set(null);
        this.confirmText.set('');
        this.organizers.update(list => list.filter(o => o.id !== c.id));
        this.closePanel();
      },
      error: () => this.deleting.set(false),
    });
  }

  protected activeRaffles(d: AdminOrganizerDetail): number {
    return d.raffles.filter(r => r.publicationStatus === 'PUBLISHED').length;
  }

  protected pubCls(s: string): string {
    const map: Record<string, string> = {
      PUBLISHED: 'ao-pill ao-pill--pub', DRAFT: 'ao-pill ao-pill--draft',
      PAUSED: 'ao-pill ao-pill--pause', FINISHED: 'ao-pill ao-pill--fin', CLOSED: 'ao-pill ao-pill--cls',
    };
    return map[s] ?? 'ao-pill ao-pill--draft';
  }

  protected pubLabel(s: string): string {
    const map: Record<string, string> = {
      PUBLISHED: 'Publicada', DRAFT: 'Borrador', PAUSED: 'Pausada', FINISHED: 'Finalizada', CLOSED: 'Cerrada',
    };
    return map[s] ?? s;
  }

  protected fmt(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
