import { Directive } from '@angular/core';

/** Beige tag for criteria and studio specialities. */
@Directive({
  selector: '[appTag]',
  host: {
    class: 'inline-flex h-7 items-center rounded-md bg-secondary px-3 text-xs font-medium',
  },
})
export class Tag {}
