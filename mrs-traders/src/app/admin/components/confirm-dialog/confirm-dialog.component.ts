import { CommonModule } from '@angular/common';
import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation dialog"
        class="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        [disabled]="loading()"
        (click)="cancel.emit()"
      ></button>

      <div
        class="relative z-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:p-7"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="messageId"
      >
        <div
          class="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700"
        >
          <svg viewBox="0 0 24 24" class="h-6 w-6 fill-none stroke-current" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v5m0 3h.01" />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            />
          </svg>
        </div>

        <h3 [id]="titleId" class="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          {{ title() }}
        </h3>
        <p [id]="messageId" class="mt-3 text-sm leading-6 text-slate-500">
          {{ message() }}
        </p>

        <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="loading()"
            (click)="cancel.emit()"
          >
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="loading()"
            (click)="confirm.emit()"
          >
            @if (loading()) {
              <span
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              ></span>
            }
            {{ loading() ? loadingLabel() : confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  protected readonly titleId = `confirm-dialog-title-${Math.random().toString(36).slice(2)}`;
  protected readonly messageId = `confirm-dialog-message-${Math.random().toString(36).slice(2)}`;

  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly cancelLabel = input('Cancel');
  readonly confirmLabel = input('Delete');
  readonly loadingLabel = input('Deleting...');
  readonly loading = input(false);

  readonly cancel = output<void>();
  readonly confirm = output<void>();

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (!this.loading()) {
      this.cancel.emit();
    }
  }
}
