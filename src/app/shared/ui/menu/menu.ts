import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';

/** Fachada do menu do CDK usada pelos templates. */
export const BS_MENU = [CdkMenu, CdkMenuItem, CdkMenuTrigger] as const;
