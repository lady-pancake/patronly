import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideImagePlus, lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { ArtistStore } from '../../core/data/artist-store';
import { type Piece, WORK_TAG_SUGGESTIONS, readImage } from '../../core/data/studio-draft';
import { CleanText } from '../../shared/clean-text';
import { EnterSubmit } from '../../shared/enter-submit';

export interface WorkDialogContext {
  /** The piece to edit, or null to start by choosing images. */
  index: number | null;
}

/** Adds pieces in bulk, then walks through each one to give it a title and tags. */
@Component({
  selector: 'app-work-dialog',
  imports: [CleanText, BrnDialogTitle, FormsModule, NgIcon],
  providers: [provideIcons({ lucideCheck, lucideImagePlus, lucideX })],
  hostDirectives: [EnterSubmit],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 flex-col' },
  templateUrl: './work-dialog.html',
})
export class WorkDialog {
  private readonly store = inject(ArtistStore);
  private readonly ref = inject(BrnDialogRef);
  private readonly ctx = injectBrnDialogContext<WorkDialogContext>();

  protected readonly index = signal<number | null>(this.ctx.index);
  protected readonly tagDraft = signal('');
  protected readonly dragging = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly pieces = computed(() => this.store.draft().pieces);
  protected readonly piece = computed(() => {
    const i = this.index();
    return i === null ? null : (this.pieces()[i] ?? null);
  });
  protected readonly isLast = computed(() => (this.index() ?? 0) >= this.pieces().length - 1);
  protected readonly title = computed(() =>
    this.piece() ? `Piece ${(this.index() ?? 0) + 1} of ${this.pieces().length}` : 'Add work',
  );
  protected readonly suggestions = computed(() => {
    const mine = this.piece()?.tags ?? [];
    const q = this.tagDraft().trim().toLowerCase();
    return [...new Set([...this.pieces().flatMap((p) => p.tags), ...WORK_TAG_SUGGESTIONS])]
      .filter((t) => !mine.includes(t) && (!q || t.toLowerCase().includes(q)))
      .slice(0, 10);
  });

  protected patch(p: Partial<Piece>) {
    const i = this.index();
    if (i === null) return;
    this.store.update({ pieces: this.pieces().map((x, j) => (j === i ? { ...x, ...p } : x)) });
  }

  protected addTag(raw: string) {
    const v = raw.trim().replace(/,$/, '');
    const tags = this.piece()?.tags ?? [];
    this.tagDraft.set('');
    if (!v || tags.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    this.patch({ tags: [...tags, v] });
  }

  protected removeTag(t: string) {
    this.patch({ tags: (this.piece()?.tags ?? []).filter((x) => x !== t) });
  }

  protected onTagKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      this.addTag(this.tagDraft());
    } else if (e.key === 'Backspace' && !this.tagDraft()) {
      this.patch({ tags: (this.piece()?.tags ?? []).slice(0, -1) });
    }
  }

  protected remove() {
    const i = this.index();
    if (i === null) return;
    const id = this.pieces()[i].id;
    const pieces = this.pieces().filter((_, j) => j !== i);
    this.store.update({ pieces, featured: this.store.draft().featured.filter((f) => f !== id) });
    if (!pieces.length) this.ref.close();
    else this.index.set(Math.min(i, pieces.length - 1));
  }

  protected prev() {
    const i = this.index() ?? 0;
    if (i > 0) this.index.set(i - 1);
  }

  protected next() {
    if (this.isLast()) this.ref.close();
    else this.index.set((this.index() ?? 0) + 1);
  }

  protected onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    void this.addFiles(files);
  }

  protected onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    void this.addFiles([...(e.dataTransfer?.files ?? [])]);
  }

  private async addFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const srcs = await Promise.all(images.map((f) => readImage(f)));
      const start = this.pieces().length;
      const added: Piece[] = srcs.map((src, k) => ({
        id: `p${Date.now()}-${k}`,
        src,
        title: '',
        medium: '',
        tags: [],
      }));
      const d = this.store.draft();
      // New pieces fill any empty spots on the search card.
      const featured = [...d.featured, ...added.map((p) => p.id)].slice(0, 3);
      this.store.update({ pieces: [...d.pieces, ...added], featured });
      this.index.set(start);
    } catch {
      this.error.set('One of those files couldn’t be read. Try JPG or PNG.');
    } finally {
      this.busy.set(false);
    }
  }
}
