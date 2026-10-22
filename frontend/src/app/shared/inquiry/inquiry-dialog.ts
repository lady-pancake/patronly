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
import { CleanText } from '../clean-text';
import { EnterSubmit } from '../enter-submit';
import { Avatar } from '../avatar';

@Component({
  selector: 'app-inquiry-dialog',
  imports: [CleanText, BrnDialogTitle, FormsModule, NgIcon, FilterChips, HlmTextarea, Avatar],
  providers: [provideIcons({ lucideCheck })],
  hostDirectives: [EnterSubmit],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inquiry-dialog.html',
  styleUrl: './inquiry-dialog.css',
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
