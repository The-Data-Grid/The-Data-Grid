import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import {ToiletObject} from './models';
const API_URL = environment.apiUrl;
const PORT = environment.port;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  suffix: string;

  newUrl(array) {
    this.suffix = array.join('&');
    return API_URL + '/' + this.suffix;
  }

  public sendHttps(cmd: string, obj: string = ""): Observable<ToiletObject[]> {
    var dataObj = {
          "command": cmd,
          "dataObject": obj
    }
    var encoded = btoa(JSON.stringify(dataObj));

    if (cmd == "getAllToiletObjects") {
      return this.getAllToilets();
    }
  }

  public getAllToilets(): Observable<ToiletObject[]>{
    return this.http.get<ToiletObject[]>(API_URL + '/toilet');
  }


}