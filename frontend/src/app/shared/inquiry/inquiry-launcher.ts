import { Injectable, inject } from '@angular/core';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import type { Artist } from '../../core/data/models';
import { InquiryDialog } from './inquiry-dialog';

export interface InquiryContext {
  artist: Artist;
}

/** Opens the "Send an inquiry" dialog for an artist. */
@Injectable({ providedIn: 'root' })
export class InquiryLauncher {
  private readonly dialog = inject(HlmDialogService);

  open(artist: Artist) {
    return this.dialog.open<void, InquiryContext>(InquiryDialog, {
      context: { artist },
      contentClass:
        'sm:max-w-[720px] max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-4xl p-6 sm:p-10 gap-0',
    });
  }
}
