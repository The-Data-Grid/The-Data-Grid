import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { ToiletObject } from '../models'

@Component({
  selector: 'app-audits',
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})

export class AuditsComponent implements OnInit { 
  toiletObjects;
  constructor(private apiService: ApiService) { }



  ngOnInit() {
     this.apiService
     .sendHttps("getAllToiletObjects")
     .subscribe(
       (toiletObjects) => {
         this.toiletObjects = toiletObjects;
     }
     );
  }
}