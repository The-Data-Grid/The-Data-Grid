import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuditsComponent } from './audits/audits.component';
import { IndexComponent } from './index/index.component';
// import { UploadComponent } from './upload/upload.component';
import { AboutComponent } from './about/about.component';
import { UploadFilesComponent } from './upload-files/upload-files.component';
import { UploadAuditComponent } from './upload-audit/upload-audit.component';
import { AuditSummaryComponent } from './upload-audit/audit-summary/audit-summary.component'
import { DownloadComponent } from './download/download.component'
import { SettingsComponent } from './settings/settings.component'
import { TeamComponent } from './team/team.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { CheckEmailComponent } from './verify-email/check-email/check-email.component';
import { NewFilterComponent } from './new-filter/filter.component';
import { AuditDashboard } from './audit-dashboard/dashboard.component';
import { ManagementComponent } from './manage/manage.component';
import { AuthGuard } from './auth.guard';
import { GuideComponent } from './guide/guide.component';
import { GuideManageComponent } from './guide-manage/guide.component';
import { GuideQueryComponent } from './guide-query/guide.component';
import { GuideSchemaComponent } from './guide-schema/guide.component';
import { GuideUploadComponent } from './guide-upload/guide.component';
import { SchemaGen } from './schema-gen/schema-gen.component';

const routes: Routes = [
  { path: 'index', redirectTo: '', pathMatch: 'full' },
  { path: 'data', redirectTo: 'table', pathMatch: 'full'},
  { path: 'filter', redirectTo: 'table', pathMatch: 'full'},
  { path: '', component: IndexComponent },
  // { path: 'filter', component: FilterComponent },
//   { path: 'upload', component: UploadComponent },
  { path: 'about', component: AboutComponent },
  { path: 'upload-files', component: UploadFilesComponent },
  { path: 'upload-audit', component: UploadAuditComponent },
  { path: 'audit-summary', component: AuditSummaryComponent },
  { path: 'audit', component: AuditDashboard, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent },
  { path: 'team', component: TeamComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'check-email', component: CheckEmailComponent },
  { path: 'table', component: NewFilterComponent},
  { path: 'map', component: NewFilterComponent},
  { path: 'manage', component: ManagementComponent, canActivate: [AuthGuard] },
  { path: 'guide', component: GuideComponent },
  { path: 'guide/manage', component: GuideManageComponent },
  { path: 'guide/query', component: GuideQueryComponent },
  { path: 'guide/schema', component: GuideSchemaComponent },
  { path: 'guide/upload', component: GuideUploadComponent },
  { path: 'generate', component: SchemaGen },
  { path: '**', redirectTo: '', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }