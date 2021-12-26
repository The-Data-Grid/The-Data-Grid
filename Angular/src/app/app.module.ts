import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from './api.service';
import { IndexComponent } from './index/index.component';
import { AuditsComponent } from './audits/audits.component';
import { FilterComponent } from './filter/filter.component';
import { DatePipe } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { UploadFilesComponent } from './upload-files/upload-files.component';
import { DownloadComponent } from './download/download.component';
import { UploadDialogComponent } from './upload-dialog/upload-dialog.component';
import { UploadAuditComponent } from './upload-audit/upload-audit.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { DialogComponent } from './login-dialog/login-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UploadComponent } from './upload/upload.component';
import { AuditSummaryComponent } from './upload-audit/audit-summary/audit-summary.component';
import { AboutComponent } from './about/about.component';
import { LockDialogComponent } from './lock-dialog/lock-dialog.component';
import { SettingsComponent } from './settings/settings.component';
import { PasswordAuthenticationComponent } from './password-authentication/password-authentication.component';
import { ClickOutsideModule } from 'ng-click-outside'
import { MaterialModule } from './material.module';
import { AddRootFeaturesComponent } from './upload-audit/add-root-features/add-root-features.component';
import { GlobalPresetsComponent } from './upload-audit/global-presets/global-presets.component';
import { FeatureAuditComponent } from './upload-audit/feature-audit/feature-audit.component';
import { ItemCreationComponent } from './upload-audit/item-creation/item-creation.component';
import { SetupObjectService } from './setup-object.service';
import { TableObjectService } from './table-object.service';
import { ReusableTemplateComponent } from './reusable-template/reusable-template.component';
import { SelectorsTemplateComponent } from './selectors-template/selectors-template.component';
import { TeamComponent } from './team/team.component';
import { DeleteDialogComponent } from './upload-audit/delete-dialog/delete-dialog.component';
import { ProfileComponent } from './profile/profile.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { CheckEmailComponent } from './verify-email/check-email/check-email.component';
import { ToastrModule } from 'ngx-toastr';
import { NewFilterComponent  } from './new-filter/filter.component';

@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    AuditsComponent,
    DialogComponent,
    UploadComponent,
    AboutComponent,
    UploadFilesComponent,
    DownloadComponent,
    UploadDialogComponent,
    LockDialogComponent,
    SettingsComponent,
    PasswordAuthenticationComponent,
    UploadAuditComponent,
    AuditSummaryComponent,
    AddRootFeaturesComponent,
    GlobalPresetsComponent,
    FeatureAuditComponent,
    ReusableTemplateComponent,
    TeamComponent,
    ItemCreationComponent,
    DeleteDialogComponent,
    SelectorsTemplateComponent,
    FilterComponent,
    VerifyEmailComponent,
    CheckEmailComponent,
    ProfileComponent,
    NewFilterComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    NgxDatatableModule,
    NgMultiSelectDropDownModule.forRoot(),
    ClickOutsideModule,
    MaterialModule,
    ToastrModule.forRoot(),
  ],
  providers: [ApiService, DatePipe, SetupObjectService, TableObjectService],
  bootstrap: [AppComponent],
  entryComponents: [DialogComponent]
})
export class AppModule {

}
