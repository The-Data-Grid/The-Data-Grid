import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from './api.service';
import { IndexComponent } from './index/index.component';
import { AuditsComponent } from './audits/audits.component';
import { AlertModule } from './_alert';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule }  from '@angular/material/button';
import { MatToolbarModule} from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table'
@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    AuditsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    AlertModule,
    MatMenuModule, 
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatTableModule
  ],
  providers: [ApiService],
  bootstrap: [AppComponent]
})
export class AppModule { 
  
}