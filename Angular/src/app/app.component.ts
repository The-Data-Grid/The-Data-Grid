import { Component, OnInit } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';
import { AlertService } from './_alert/alert.service';

const API_URL = environment.apiUrl;
const PORT = environment.port;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  
  alert_options = {
    autoClose: true,
    keepAfterRouteChange: false
  };

  title = 'The Data Grid';
  
  constructor(private apiService: ApiService, protected alertService: AlertService) {}

 ngOnInit() {}
}