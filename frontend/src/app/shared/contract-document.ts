import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDownload, lucideFileText, lucidePrinter } from '@ng-icons/lucide';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmDialogService } from '@spartan-ng/helm/dialog';

export interface ContractDocContext {
  /** The contract's text (Patronly's template), or null for an uploaded file. */
  text: string | null;
  /** The uploaded file's name, when the artist used their own contract. */
  file?: string | null;
  artist: string;
  patron: string;
  /** Who has signed so far. */
  signed?: { artist?: boolean; patron?: boolean };
}

interface Block {
  heading: string;
  body: string[];
}

/** Opens a contract as a full page document. */
export function openContractDoc(dialog: HlmDialogService, context: ContractDocContext) {
  return dialog.open<void, ContractDocContext>(ContractDocument, {
    context,
    contentClass:
      'w-[calc(100vw-32px)] max-w-[760px] sm:max-w-[760px] max-h-[calc(100dvh-32px)] overflow-hidden rounded-4xl bg-surface p-0',
  });
}

/** The contract laid out like a printed agreement, with print and download. */
@Component({
  selector: 'app-contract-document',
  imports: [BrnDialogTitle, NgIcon],
  providers: [provideIcons({ lucideDownload, lucideFileText, lucidePrinter })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex max-h-[calc(100dvh-32px)] flex-col">
      <div class="flex flex-wrap items-center gap-2 border-b py-3.5 pr-14 pl-5 sm:pl-6">
        <ng-icon name="lucideFileText" size="16" />
        <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ name }}</span>
        @if (ctx.text) {
          <button
            type="button"
            (click)="print()"
            class="flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            <ng-icon name="lucidePrinter" size="14" />Print
          </button>
          <button
            type="button"
            (click)="download()"
            class="flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            <ng-icon name="lucideDownload" size="14" />Download
          </button>
        }
      </div>
      <div class="overflow-y-auto p-4 sm:p-8">
        <article
          class="mx-auto flex max-w-[620px] flex-col gap-6 rounded-md bg-white px-6 py-10 text-[oklch(0.2_0_0)] shadow-[0_2px_16px_oklch(0_0_0/.08)] ring-1 ring-black/5 sm:px-14 sm:py-14"
        >
          <header class="flex flex-col items-center gap-2 border-b pb-6 text-center">
            <span class="eyebrow !text-[10px]">Patronly</span>
            <h2 brnDialogTitle class="font-serif text-[32px] leading-tight font-normal">
              Commission agreement
            </h2>
            @if (intro) {
              <p class="text-[13px] text-muted-foreground">{{ intro }}</p>
            }
          </header>
          @if (ctx.text) {
            @for (b of blocks; track $index) {
              <section class="flex flex-col gap-1.5">
                @if (b.heading) {
                  <h3 class="text-[13px] font-semibold tracking-wide">{{ b.heading }}</h3>
                }
                @for (p of b.body; track $index) {
                  <p class="text-[14px] leading-relaxed">{{ p }}</p>
                }
              </section>
            }
          } @else {
            <div class="flex flex-col items-center gap-3 py-10 text-center">
              <ng-icon name="lucideFileText" size="40" class="text-muted-foreground" />
              <p class="text-sm font-medium">{{ ctx.file || 'Contract file' }}</p>
              <p class="max-w-[360px] text-[13px] text-muted-foreground">
                {{ ctx.artist }} uploaded their own contract. In the full app, the file opens here.
              </p>
            </div>
          }
          <footer class="mt-4 grid gap-8 border-t pt-8 sm:grid-cols-2">
            @for (s of signatures; track s.role) {
              <div class="flex flex-col gap-1.5">
                <span
                  class="h-9 border-b border-[oklch(0.2_0_0)] font-hand text-[26px] leading-none"
                  >{{ s.signed ? s.name : '' }}</span
                >
                <span class="text-xs text-muted-foreground"
                  >{{ s.role }} · {{ s.name }}{{ s.signed ? '' : ' · not signed yet' }}</span
                >
              </div>
            }
          </footer>
        </article>
      </div>
    </div>
  `,
})
export class ContractDocument {
  protected readonly ref = inject<BrnDialogRef<void>>(BrnDialogRef);
  protected readonly ctx = injectBrnDialogContext<ContractDocContext>();

  protected readonly name = this.ctx.file || 'Commission agreement';
  private readonly lines = (this.ctx.text ?? '').split('\n');
  /** The "Between … and …" line, shown under the title. */
  protected readonly intro = this.lines.find((l) => l.startsWith('Between ')) ?? '';
  protected readonly blocks: Block[] = this.toBlocks();
  protected readonly signatures = [
    { role: 'Artist', name: this.ctx.artist, signed: !!this.ctx.signed?.artist },
    { role: 'Patron', name: this.ctx.patron, signed: !!this.ctx.signed?.patron },
  ];

  /** Numbered lines ("1. The work") start a section; the title and parties line are shown above. */
  private toBlocks(): Block[] {
    const out: Block[] = [];
    for (const raw of this.lines) {
      const line = raw.trim();
      if (!line || line === 'COMMISSION AGREEMENT' || line === this.intro) continue;
      if (/^\d+\.\s/.test(line)) out.push({ heading: line, body: [] });
      else if (out.length) out.at(-1)!.body.push(line);
      else out.push({ heading: '', body: [line] });
    }
    return out;
  }

  protected download() {
    const blob = new Blob([this.ctx.text ?? ''], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Contract - ${this.ctx.patron}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  protected print() {
    const w = window.open('', '_blank', 'width=760,height=900');
    if (!w) return;
    const pre = w.document.createElement('pre');
    pre.style.cssText = 'font: 14px/1.6 Georgia, serif; white-space: pre-wrap; margin: 48px;';
    pre.textContent = this.ctx.text ?? '';
    w.document.title = 'Commission agreement';
    w.document.body.append(pre);
    w.print();
  }
}
