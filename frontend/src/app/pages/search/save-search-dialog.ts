import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';

@Component({
  selector: 'app-save-search-dialog',
  imports: [BrnDialogTitle, FormsModule, HlmInput, HlmLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="flex flex-col gap-5" (submit)="save($event)">
      <div class="flex flex-col gap-1.5">
        <h2 brnDialogTitle class="font-serif text-[34px] leading-[1.1] font-normal">
          Name this <em>search</em>
        </h2>
        <p class="text-sm text-muted-foreground">You’ll find it on Home and in Saved.</p>
      </div>
      <div class="flex flex-col gap-2">
        <label hlmLabel for="search-name" class="text-[13px] font-semibold">Search name</label>
        <input
          hlmInput
          id="search-name"
          name="name"
          autofocus
          [(ngModel)]="name"
          placeholder="e.g. A portrait for Mum’s 70th"
          class="h-11 bg-background px-4"
        />
      </div>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          (click)="ref.close()"
          class="h-10 rounded-md border bg-background px-4.5 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          [disabled]="!name().trim()"
          class="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-85 disabled:opacity-40"
        >
          Save search
        </button>
      </div>
    </form>
  `,
})
export class SaveSearchDialog {
  protected readonly ref = inject<BrnDialogRef<string>>(BrnDialogRef);
  protected readonly name = signal(injectBrnDialogContext<{ name: string }>().name);

  protected save(e: Event) {
    e.preventDefault();
    if (this.name().trim()) this.ref.close(this.name().trim());
  }
}
