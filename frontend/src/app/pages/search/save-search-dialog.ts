import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';

@Component({
  selector: 'app-save-search-dialog',
  imports: [BrnDialogTitle, FormsModule, HlmInput, HlmLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './save-search-dialog.html',
})
export class SaveSearchDialog {
  protected readonly ref = inject<BrnDialogRef<string>>(BrnDialogRef);
  protected readonly name = signal(injectBrnDialogContext<{ name: string }>().name);

  protected save(e: Event) {
    e.preventDefault();
    if (this.name().trim()) this.ref.close(this.name().trim());
  }
}
