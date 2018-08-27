import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CdkTreeModule } from '@angular/cdk/tree';

import { AppComponent } from './app.component';
import {CollectModule} from './collect/collect.module';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatToolbarModule,
  MatTreeModule,
} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserAnimationsModule,
    CdkTreeModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatTreeModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule,
    BrowserModule,
    FormsModule,
    HttpModule,
    CollectModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
