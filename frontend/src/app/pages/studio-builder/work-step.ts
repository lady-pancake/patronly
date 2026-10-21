import { FULL_SCREEN_ON_PHONES } from '../../shared/dialog-classes';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideImage, lucidePlus, lucideUpload } from '@ng-icons/lucide';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { ArtistStore } from '../../core/data/artist-store';
import { type Piece, rangeLabel, readImage } from '../../core/data/studio-draft';
import { WorkDialog, type WorkDialogContext } from './work-dialog';

type MediaKey = 'portrait' | 'cover' | 'process';

/** Step 4: the work library, the search-card preview and studio images. */
@Component({
  selector: 'app-work-step',
  imports: [NgIcon],
  providers: [provideIcons({ lucideImage, lucidePlus, lucideUpload })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-10' },
  templateUrl: './work-step.html',
})
export class WorkStep {
  private readonly store = inject(ArtistStore);
  private readonly dialog = inject(HlmDialogService);

  protected readonly d = this.store.draft;
  protected readonly dragId = signal<string | null>(null);
  protected readonly overId = signal<string | null>(null);
  protected readonly overSlot = signal<number | null>(null);
  protected readonly error = signal('');

  protected readonly slots = computed(() => {
    const d = this.d();
    return [0, 1, 2].map((k) => {
      const index = d.pieces.findIndex((p) => p.id === d.featured[k]);
      return index >= 0 ? { piece: d.pieces[index], index } : null;
    });
  });

  protected readonly cardMeta = computed(() => {
    const d = this.d();
    return `${d.mediums.join(', ') || 'Your medium'} · ${d.city || 'Your city'}`;
  });
  protected readonly price = computed(() => rangeLabel(this.d()) ?? 'Price range');

  protected readonly media = computed(() => {
    const d = this.d();
    return [
      {
        key: 'portrait' as const,
        label: 'Profile photo',
        hint: 'A photo of you, shown next to your story',
        optional: false,
        image: d.portrait,
        video: null,
        videoLabel: '',
      },
      {
        key: 'cover' as const,
        label: 'Studio cover',
        hint: 'Image at the top of your studio page',
        optional: true,
        image: d.cover,
        video: d.coverVideo,
        videoLabel: 'Studio cover video',
      },
      {
        key: 'process' as const,
        label: 'Process',
        hint: 'How a piece comes together',
        optional: true,
        image: d.process,
        video: d.processVideo,
        videoLabel: 'Process video',
      },
    ];
  });

  protected needsDetails(p: Piece) {
    return !p.title.trim() || !p.tags.length;
  }

  protected add() {
    this.open({ index: null });
  }

  protected edit(index: number) {
    this.open({ index });
  }

  private open(context: WorkDialogContext) {
    this.dialog.open(WorkDialog, {
      context,
      contentClass:
        'sm:max-w-[880px] max-h-[calc(100dvh-3rem)] overflow-hidden rounded-4xl p-0 gap-0 flex flex-col ' +
        FULL_SCREEN_ON_PHONES,
    });
  }

  protected endDrag() {
    this.dragId.set(null);
    this.overId.set(null);
    this.overSlot.set(null);
  }

  /** Dropping a card piece back on the library takes it off the card. */
  protected dropOnLibrary(e: DragEvent) {
    e.preventDefault();
    const id = this.dragId();
    if (id) this.store.update({ featured: this.d().featured.filter((f) => f !== id) });
    this.endDrag();
  }

  /** Reorders the library: the dragged piece moves to where it was dropped. */
  protected dropOnPiece(targetId: string, e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const id = this.dragId();
    if (id && id !== targetId) {
      const pieces = [...this.d().pieces];
      const [moved] = pieces.splice(
        pieces.findIndex((p) => p.id === id),
        1,
      );
      pieces.splice(
        pieces.findIndex((p) => p.id === targetId),
        0,
        moved,
      );
      this.store.update({ pieces });
    }
    this.endDrag();
  }

  /** Puts the dragged piece on the card at a slot; a full card drops its last piece. */
  protected dropOnSlot(at: number, e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const id = this.dragId();
    if (id) {
      const featured = this.d().featured.filter((f) => f !== id);
      featured.splice(Math.min(at, featured.length), 0, id);
      this.store.update({ featured: featured.slice(0, 3) });
    }
    this.endDrag();
  }

  protected async upload(key: MediaKey, e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      this.error.set('');
      this.store.update({ [key]: await readImage(file) });
    } catch {
      this.error.set('That file couldn’t be read. Try a JPG or PNG.');
    }
  }

  protected clear(key: MediaKey) {
    if (key === 'portrait') this.store.update({ portrait: null });
    if (key === 'cover') this.store.update({ cover: null, coverVideo: null });
    if (key === 'process') this.store.update({ process: null, processVideo: null });
  }
}
