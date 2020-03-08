import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { environment } from '../environments/environment';

const API_URL = environment.apiUrl;
const PORT = environment.port;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private httpClient: HttpClient) { }

  public sendHttps(cmd: string, obj: string = "") {
    var dataObj = {
          "command": cmd,
          "dataObject": obj
    }
    var encoded = btoa(JSON.stringify(dataObj));

    if (cmd == "getToilets") {
      return this.httpClient.get(API_URL + '/toilets')
    }
    if (cmd == "upload") {
      return this.httpClient.post(API_URL, encoded);
    }
  }
}