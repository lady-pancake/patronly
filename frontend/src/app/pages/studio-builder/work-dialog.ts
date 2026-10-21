import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideImagePlus, lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { ArtistStore } from '../../core/data/artist-store';
import { type Piece, WORK_TAG_SUGGESTIONS, readImage } from '../../core/data/studio-draft';

export interface WorkDialogContext {
  /** The piece to edit, or null to start by choosing images. */
  index: number | null;
}

/** Adds pieces in bulk, then walks through each one to give it a title and tags. */
@Component({
  selector: 'app-work-dialog',
  imports: [FormsModule, NgIcon],
  providers: [provideIcons({ lucideCheck, lucideImagePlus, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 flex-col' },
  template: `
    <div class="flex items-center justify-between gap-4 border-b py-5 pr-14 pl-6">
      <div class="flex flex-col gap-0.5">
        <h2 class="font-serif text-[30px] leading-none font-normal">{{ title() }}</h2>
        <span class="text-[13px] text-muted-foreground">{{
          piece()
            ? 'Give it a title and a few tags, then move to the next.'
            : 'Choose as many images as you like.'
        }}</span>
      </div>
    </div>

    @if (piece(); as p) {
      <div class="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 sm:grid-cols-2">
        <div
          class="aspect-[4/5] rounded-3xl bg-surface bg-contain bg-center bg-no-repeat ring-1 ring-border max-sm:max-h-[40dvh]"
          [style.background-image]="'url(' + p.src + ')'"
        ></div>
        <div class="flex min-w-0 flex-col gap-5">
          <label class="flex flex-col gap-2"
            ><span class="text-[13px] font-semibold">Title</span
            ><input
              class="field !h-11 !px-4 !text-sm"
              [ngModel]="p.title"
              (ngModelChange)="patch({ title: $event })"
              placeholder="e.g. Portrait of Ana, 2025"
          /></label>
          <label class="flex flex-col gap-2"
            ><span class="text-[13px] font-semibold">Medium</span
            ><input
              class="field !h-11 !px-4 !text-sm"
              [ngModel]="p.medium"
              (ngModelChange)="patch({ medium: $event })"
              placeholder="e.g. Oil on linen, 40×50cm"
          /></label>
          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-semibold">Tags</span>
            <div
              class="flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 focus-within:border-ring"
            >
              @for (t of p.tags; track t) {
                <span
                  class="flex h-7 items-center gap-1 rounded-md bg-secondary pr-1 pl-2.5 text-xs font-medium"
                  >{{ t
                  }}<button
                    type="button"
                    (click)="removeTag(t)"
                    [attr.aria-label]="'Remove tag ' + t"
                    class="grid size-5 place-items-center rounded-full hover:bg-black/10"
                  >
                    <ng-icon name="lucideX" size="11" /></button
                ></span>
              }
              <input
                [(ngModel)]="tagDraft"
                (keydown)="onTagKey($event)"
                placeholder="Type a tag and press Enter"
                aria-label="Add a tag"
                class="h-7 min-w-[140px] flex-1 bg-transparent px-1 text-sm outline-none"
              />
            </div>
            <div class="flex flex-wrap gap-1.5">
              @for (s of suggestions(); track s) {
                <button
                  type="button"
                  (click)="addTag(s)"
                  class="h-7 rounded-full border bg-background px-3 text-xs hover:bg-muted"
                >
                  + {{ s }}
                </button>
              }
            </div>
          </div>
          <button
            type="button"
            (click)="remove()"
            class="self-start text-xs text-muted-foreground underline underline-offset-3 hover:text-destructive"
          >
            Remove this piece
          </button>
        </div>
      </div>
      <div class="no-scrollbar flex gap-2 overflow-x-auto border-t px-6 py-3">
        @for (t of pieces(); track t.id; let k = $index) {
          <button
            type="button"
            (click)="index.set(k)"
            [attr.aria-label]="'Piece ' + (k + 1)"
            class="relative size-12 shrink-0 rounded-lg bg-cover bg-center"
            [class]="k === index() ? 'ring-2 ring-primary' : 'opacity-70 ring-1 ring-border'"
            [style.background-image]="'url(' + t.src + ')'"
          >
            @if (t.title.trim() && t.tags.length) {
              <span
                class="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground"
                ><ng-icon name="lucideCheck" size="10"
              /></span>
            }
          </button>
        }
      </div>
      <div class="flex items-center justify-between gap-3 border-t px-6 py-4">
        <button
          type="button"
          (click)="index.set(null)"
          class="h-10 rounded-md border bg-background px-4 text-[13px] font-medium hover:bg-muted"
        >
          Add more
        </button>
        <div class="flex gap-2">
          <button
            type="button"
            (click)="prev()"
            [disabled]="index() === 0"
            class="h-10 rounded-md px-4 text-[13px] font-medium hover:bg-muted disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            (click)="next()"
            class="h-10 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground hover:opacity-85"
          >
            {{ isLast() ? 'Done' : 'Next' }}
          </button>
        </div>
      </div>
    } @else {
      <label
        class="relative m-6 flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed bg-surface p-6 text-center hover:border-ring"
        [class.border-ring]="dragging()"
        (dragover)="$event.preventDefault(); dragging.set(true)"
        (dragleave)="dragging.set(false)"
        (drop)="onDrop($event)"
      >
        <input type="file" accept="image/*" multiple class="sr-only" (change)="onPick($event)" />
        <span class="grid size-12 place-items-center rounded-full bg-background ring-1 ring-border"
          ><ng-icon name="lucideImagePlus" size="20"
        /></span>
        <span class="text-[15px] font-semibold">{{ busy() ? 'Adding…' : 'Choose images' }}</span>
        <span class="text-[13px] text-muted-foreground"
          >Drag images here or click to choose. JPG or PNG.</span
        >
        @if (error()) {
          <span class="text-xs text-destructive" role="alert">{{ error() }}</span>
        }
      </label>
    }
  `,
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
