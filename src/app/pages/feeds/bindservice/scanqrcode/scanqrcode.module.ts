import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { ScanqrcodePage } from './scanqrcode.page';

const routes: Routes = [
  {
    path: '',
    component: ScanqrcodePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule, 
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ScanqrcodePage]
})
export class ScanqrcodePageModule {}
