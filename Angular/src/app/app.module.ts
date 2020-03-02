import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from './api.service';
import { HomeComponent } from './home/home.component';
import { AuditsComponent } from './audits/audits.component';
//import {MatMenuModule} from '@angular/material/menu';
//import {MatButtonModule} from '@angular/material/button';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AuditsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
    //MatMenuModule, 
    //MatButtonModule,
  ],
  providers: [ApiService],
  bootstrap: [AppComponent]
})
export class AppModule { 
  
}