import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { ToiletObject, FilterConfig, TableConfig } from './models';
const API_URL = environment.apiUrl;
const temp_url = "https://my-json-server.typicode.com/tanyazhong/the-data-grid-mock-server";
const PORT = environment.port;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  suffix: string;
  columnsString;
  temp;

  makeColumnsString(array): string {
    return array.join('&');
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

  public getAllToilets(): Observable<ToiletObject[]> {
    return this.http.get<ToiletObject[]>(API_URL + '/toilet');
  }

  public getFilterConfig(): Observable<FilterConfig> {
    // return this.http.get<FilterConfig>(API_URL + '/s/filter');
    // return this.http.get<FilterConfig>(API_URL + '/setup');
    return this.http.get<FilterConfig>(temp_url + '/setup');
  }

  // public getTableConfig(feature: string, columns: any):Observable<TableConfig> {
  public getTableConfig(feature: string, columns: any, qsparams: any): any {
    // return this.http.get<FilterConfig>(API_URL + '/s/filter');
    this.columnsString = this.makeColumnsString(columns);
    this.temp = API_URL + "/a/" + feature + "/" + this.columnsString;
    return this.http.get<TableConfig>(this.temp, { params: qsparams });
  }


}