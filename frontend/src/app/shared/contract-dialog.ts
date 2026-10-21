import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileText, lucideUpload, lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmDialogService } from '@spartan-ng/helm/dialog';

export interface ContractContext {
  patron: string;
}

/** Text documents a contract can be: PDF, Word, plain text, RTF and OpenDocument. */
export const CONTRACT_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];

export function isContractFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return CONTRACT_TYPES.some((ext) => name.endsWith(ext));
}

const kb = (n: number) =>
  n < 1024 * 1024
    ? `${Math.max(1, Math.round(n / 1024))} KB`
    : `${(n / 1024 / 1024).toFixed(1)} MB`;

/**
 * "Create contract": contract templates are coming soon, so for now the artist
 * drops in their own document. Nothing is uploaded in this demo; the dialog
 * closes with the file name.
 */
@Component({
  selector: 'app-contract-dialog',
  imports: [BrnDialogTitle, NgIcon],
  providers: [provideIcons({ lucideFileText, lucideUpload, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <span
          class="inline-flex h-6 items-center self-start rounded-md bg-highlight px-2.5 text-xs font-semibold"
          >Coming soon</span
        >
        <h2 brnDialogTitle class="font-serif text-[32px] leading-none font-normal">
          Create a contract
        </h2>
        <p class="text-[13px] leading-relaxed text-muted-foreground">
          Contract templates for {{ ctx.patron }} are coming soon. For now, add your own contract
          and we’ll send it with the conversation.
        </p>
      </div>

      @if (file(); as f) {
        <div class="flex items-center gap-3 rounded-2xl border bg-surface px-4 py-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-background"
            ><ng-icon name="lucideFileText" size="18"
          /></span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm font-medium">{{ f.name }}</span>
            <span class="text-xs text-muted-foreground">{{ size(f) }}</span>
          </span>
          <button
            type="button"
            (click)="file.set(null)"
            aria-label="Remove file"
            title="Remove file"
            class="grid size-8 place-items-center rounded-full hover:bg-muted"
          >
            <ng-icon name="lucideX" size="16" />
          </button>
        </div>
      } @else {
        <label
          class="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-6 py-9 text-center transition-colors"
          [class]="dragging() ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
          (dragover)="$event.preventDefault(); dragging.set(true)"
          (dragleave)="dragging.set(false)"
          (drop)="drop($event)"
        >
          <ng-icon name="lucideUpload" size="22" />
          <span class="text-sm font-medium">Drop your contract here, or browse</span>
          <span class="text-xs text-muted-foreground"
            >PDF, Word (.doc, .docx), TXT, RTF or ODT</span
          >
          <input
            type="file"
            class="sr-only"
            [accept]="accept"
            (change)="pick($event)"
            aria-label="Choose a contract file"
          />
        </label>
      }
      @if (error()) {
        <p class="text-[13px] text-destructive" role="alert">{{ error() }}</p>
      }
      <p class="text-xs text-muted-foreground">
        This is a demo: the file stays on your device and isn’t uploaded.
      </p>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          (click)="ref.close()"
          class="h-10 rounded-md border bg-background px-4 text-[13px] font-medium hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          (click)="ref.close(file()?.name)"
          [disabled]="!file()"
          class="h-10 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:opacity-85 disabled:opacity-40"
        >
          Send contract
        </button>
      </div>
    </div>
  `,
})
export class ContractDialog {
  protected readonly ref = inject<BrnDialogRef<string | undefined>>(BrnDialogRef);
  protected readonly ctx = injectBrnDialogContext<ContractContext>();
  protected readonly accept = CONTRACT_TYPES.join(',');
  protected readonly file = signal<File | null>(null);
  protected readonly dragging = signal(false);
  protected readonly error = signal('');
  protected readonly size = (f: File) => kb(f.size);

  protected pick(e: Event) {
    const input = e.target as HTMLInputElement;
    this.take(input.files?.[0]);
    input.value = '';
  }

  protected drop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    this.take(e.dataTransfer?.files?.[0]);
  }

  private take(f: File | undefined) {
    if (!f) return;
    if (!isContractFile(f)) {
      this.error.set('That file type isn’t supported. Use a PDF, Word, TXT, RTF or ODT document.');
      return;
    }
    this.error.set('');
    this.file.set(f);
  }
}

/** Opens the dialog; resolves with the chosen file name, or undefined if cancelled. */
export function openContractDialog(dialog: HlmDialogService, patron: string) {
  return dialog.open<string | undefined, ContractContext>(ContractDialog, {
    context: { patron },
    contentClass: 'w-full sm:w-[480px] sm:max-w-[480px] rounded-4xl p-7 gap-0',
  });
}
