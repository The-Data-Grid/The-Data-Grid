import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuditsComponent } from './audits/audits.component';
import { IndexComponent } from './index/index.component';
import { UploadComponent } from './upload/upload.component';
import { AboutComponent } from './about/about.component';
import { UploadFilesComponent } from './upload-files/upload-files.component';
import { UploadAuditComponent } from './upload-audit/upload-audit.component';
import {ViewAuditComponent} from './upload-audit/view-audit/view-audit.component'
import { DownloadComponent } from './download/download.component'
import { ProfilePageComponent } from './profile-page/profile-page.component'
import { TeamComponent } from './team/team.component';

const routes: Routes = [
  { path: 'index', redirectTo: '', pathMatch: 'full' },
  { path: '', component: IndexComponent },
  { path:'audits', component: AuditsComponent},
  { path:'upload', component:UploadComponent },
  { path:'about', component:AboutComponent },
  { path: 'upload-files', component: UploadFilesComponent },
  { path: 'upload-audit', component: UploadAuditComponent },
  { path: 'view-audit/:id', component: ViewAuditComponent },
  { path: 'download', component: DownloadComponent },
  { path: 'profile-page', component: ProfilePageComponent },
  { path: 'team', component: TeamComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }