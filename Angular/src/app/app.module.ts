import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from './api.service';
import { IndexComponent } from './index/index.component';
import { AuditsComponent } from './audits/audits.component';
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
// import { UploadComponent } from './upload/upload.component';
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
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { CheckEmailComponent } from './verify-email/check-email/check-email.component';
import { ToastrModule } from 'ngx-toastr';
import { NewFilterComponent  } from './new-filter/filter.component';
import { AuditDashboard } from './audit-dashboard/dashboard.component';
import { ManagementComponent } from './manage/manage.component';
import { AuthService } from './auth.service';
import { GuideComponent } from './guide/guide.component';
import { GuideManageComponent } from './guide-manage/guide.component';
import { GuideUploadComponent } from './guide-upload/guide.component';
import { GuideSchemaComponent } from './guide-schema/guide.component';
import { GuideQueryComponent } from './guide-query/guide.component';
import { SchemaGen } from './schema-gen/schema-gen.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {MatIconModule} from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from "@angular/material/form-field";

@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    AuditsComponent,
    DialogComponent,
    // UploadComponent,
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
    VerifyEmailComponent,
    CheckEmailComponent,
    NewFilterComponent,
    AuditDashboard,
    ManagementComponent,
    GuideComponent,
    GuideManageComponent,
    GuideUploadComponent,
    GuideSchemaComponent,
    GuideQueryComponent,
    SchemaGen
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
    DragDropModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ToastrModule.forRoot({timeOut: 2500, maxOpened: 5, autoDismiss: true}),
  ],
  providers: [ApiService, DatePipe, SetupObjectService, TableObjectService, AuthService],
  bootstrap: [AppComponent],
  entryComponents: [DialogComponent]
})
export class AppModule {

}
