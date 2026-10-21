import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { PatronStore } from '../../core/data/patron-store';
import { FilterChips } from '../filter-chips';
import type { InquiryContext } from './inquiry-launcher';

@Component({
  selector: 'app-inquiry-dialog',
  imports: [BrnDialogTitle, FormsModule, NgIcon, FilterChips, HlmTextarea],
  providers: [provideIcons({ lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!sentId()) {
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-1.5 pr-10">
          <div class="eyebrow">New inquiry</div>
          <h2
            brnDialogTitle
            class="font-serif text-[38px] leading-[1.1] font-normal tracking-[-.02em]"
          >
            Send an inquiry to <em>{{ artist.name }}</em>
          </h2>
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex items-baseline justify-between">
            <span class="text-sm font-semibold">Works you'd like to reference</span>
            <span class="text-xs text-muted-foreground">{{
              works().length ? works().length + ' selected' : 'Optional'
            }}</span>
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            @for (w of artist.workList.slice(0, 4); track w.title; let i = $index) {
              <button
                type="button"
                (click)="toggleWork(i)"
                [attr.aria-pressed]="works().includes(i)"
                class="relative flex flex-col gap-1.5 text-left"
              >
                <div
                  class="aspect-square w-full rounded-2xl transition-shadow"
                  [style.background]="w.bg"
                  [class.ring-selected]="works().includes(i)"
                ></div>
                @if (works().includes(i)) {
                  <span
                    class="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"
                    ><ng-icon name="lucideCheck" size="13" strokeWidth="3"
                  /></span>
                }
                <span class="font-serif text-sm italic">{{ w.title }}</span>
              </button>
            }
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-sm font-semibold">What would you like?</span>
          <app-filter-chips [options]="typeOptions" [(value)]="type" [clearable]="true" />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-sm font-semibold">Budget</span>
          <app-filter-chips [options]="budgetOptions" [(value)]="budget" [clearable]="true" />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-sm font-semibold">Timeline</span>
          <app-filter-chips [options]="timelineOptions" [(value)]="timeline" [clearable]="true" />
        </div>

        <label class="flex flex-col gap-3">
          <span class="text-sm font-semibold">Your message</span>
          <textarea
            hlmTextarea
            rows="5"
            [(ngModel)]="msg"
            [placeholder]="
              'Tell ' +
              artist.first +
              ' what you have in mind: who it’s for, where it will live, any sizes or colours.'
            "
            class="min-h-32 resize-y rounded-3xl bg-background px-4.5 py-4 text-sm leading-relaxed"
          ></textarea>
        </label>

        <div class="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
          <span class="text-xs text-muted-foreground">{{ artist.reply }}</span>
          <button
            type="button"
            (click)="send()"
            [disabled]="!canSend()"
            class="h-12 rounded-md bg-primary px-8 text-sm font-semibold text-primary-foreground hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send inquiry
          </button>
        </div>
      </div>
    } @else {
      <div class="flex flex-col items-center gap-5 pt-10 pb-4 text-center">
        <span class="size-16 rounded-full" [style.background]="artist.bg"></span>
        <h2
          brnDialogTitle
          class="font-serif text-[44px] leading-[1.05] font-normal tracking-[-.02em]"
        >
          Your inquiry is <em>on its way.</em>
        </h2>
        <p class="max-w-[420px] text-[15px] leading-relaxed text-muted-foreground">
          {{ artist.first }} will reply in Messages. {{ artist.reply }}
        </p>
        <span class="font-hand text-3xl">thank you!</span>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            (click)="ref.close()"
            class="h-11 rounded-md border bg-background px-6 text-sm font-medium hover:bg-muted"
          >
            Back to studio
          </button>
          <button
            type="button"
            (click)="viewThread()"
            class="h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-85"
          >
            View in Messages
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .ring-selected {
      box-shadow:
        0 0 0 2px var(--background),
        0 0 0 4px var(--foreground);
    }
  `,
})
export class InquiryDialog {
  protected readonly ref = inject(BrnDialogRef);
  private readonly router = inject(Router);
  private readonly store = inject(PatronStore);
  protected readonly artist = injectBrnDialogContext<InquiryContext>().artist;

  protected readonly typeOptions = [...this.artist.tiers.map((t) => t.name), 'Something else'];
  protected readonly budgetOptions = [...this.artist.tiers.map((t) => t.range), 'Not sure yet'];
  protected readonly timelineOptions = [
    'Flexible',
    'Within 1 month',
    '1–3 months',
    'For a specific date',
  ];

  protected readonly works = signal<number[]>([]);
  protected readonly type = signal<string | null>(null);
  protected readonly budget = signal<string | null>(null);
  protected readonly timeline = signal<string | null>(null);
  protected readonly msg = signal('');
  protected readonly sentId = signal<string | null>(null);

  protected readonly canSend = computed(() => !!(this.type() || this.msg().trim()));

  protected toggleWork(i: number) {
    this.works.update((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i]));
  }

  protected send() {
    if (!this.canSend()) return;
    this.sentId.set(
      this.store.sendInquiry(this.artist.id, {
        works: this.works(),
        type: this.type(),
        budget: this.budget(),
        timeline: this.timeline(),
        msg: this.msg().trim(),
      }),
    );
  }

  protected viewThread() {
    this.ref.close();
    void this.router.navigate(['/messages', this.sentId()]);
  }
}
