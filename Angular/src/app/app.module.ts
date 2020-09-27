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
import { UploadComponent } from './upload/upload.component';
import { ViewAuditComponent } from './upload-audit/view-audit/view-audit.component';
import { AboutComponent } from './about/about.component';
import { LockDialogComponent } from './lock-dialog/lock-dialog.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { PasswordAuthenticationComponent } from './password-authentication/password-authentication.component';
import { ClickOutsideModule } from 'ng-click-outside'
import { MaterialModule } from './material.module';
import { RootFeaturesComponent } from './upload-audit/root-features/root-features.component';
import { GlobalPresetsComponent} from './upload-audit/global-presets/global-presets.component';

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
    ProfilePageComponent,
    PasswordAuthenticationComponent,
    UploadAuditComponent,
    ViewAuditComponent,
    RootFeaturesComponent,
    GlobalPresetsComponent
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
    MaterialModule
  ],
  providers: [ApiService, DatePipe],
  bootstrap: [AppComponent],
  entryComponents: [DialogComponent]
})
export class AppModule {

}