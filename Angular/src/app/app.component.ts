import { Component } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';
//import { toiletObject } from './models'

const API_URL = environment.apiUrl;
const PORT = environment.port;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent{
  constructor(private apiService: ApiService) {}
  title = 'The Data Grid';
 ngOnInit() {}
}