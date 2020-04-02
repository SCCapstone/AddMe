import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PopoverOtherPage } from './popover-other.page';

const routes: Routes = [
  {
    path: '',
    component: PopoverOtherPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PopoverOtherPage]
})
export class PopoverOtherPageModule {}