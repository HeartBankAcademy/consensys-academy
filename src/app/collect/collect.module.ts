import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CollectBrowserComponent} from './collect-browser/collect-browser.component';
import {UtilModule} from '../util/util.module';
import {RouterModule} from '@angular/router';
import { CdkTreeModule } from '@angular/cdk/tree';

import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatOptionModule,
  MatSelectModule, 
  MatSnackBarModule,
  MatTreeModule,
} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    CdkTreeModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTreeModule,
    RouterModule,
    UtilModule
  ],
  declarations: [CollectBrowserComponent],
  exports: [CollectBrowserComponent]
})
export class CollectModule {
}
