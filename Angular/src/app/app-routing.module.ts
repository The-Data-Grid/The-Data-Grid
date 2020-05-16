import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuditsComponent } from './audits/audits.component';
import { IndexComponent } from './index/index.component';
import { UploadComponent } from './upload/upload.component';
import { AboutComponent } from './about/about.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  { path: 'index', redirectTo: '', pathMatch: 'full' },
  { path: '', component: IndexComponent },
  { path:'audits', component: AuditsComponent},
  { path:'upload', component:UploadComponent },
  { path:'about', component:AboutComponent },
  { path: 'profile', component: ProfileComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }