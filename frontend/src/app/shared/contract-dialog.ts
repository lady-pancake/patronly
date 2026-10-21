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
  templateUrl: './contract-dialog.html',
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
