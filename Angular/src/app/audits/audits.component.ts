import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

export class AuditsComponent implements OnInit { 
  constructor(private apiService: ApiService) { }
  toiletAudits;

  ngOnInit() {
     this.apiService.sendHttps("getToilets").subscribe((data)=>{
       console.log(data);
       this.toiletAudits = data;
     });
  }
}