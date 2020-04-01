import { Component, OnInit } from '@angular/core';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';


const API_URL = environment.apiUrl;
const PORT = environment.port;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  
  title = 'THE DATA GRID';
  
  constructor(private apiService: ApiService ) {}
  
  
 ngOnInit() {}
}