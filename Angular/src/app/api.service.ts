import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { ToiletObject, TableObject, SetupTableObject} from './models';
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

  public getSetupTableObject(): Observable<SetupTableObject> {
    // return this.http.get<FilterConfig>(API_URL + '/s/filter');
    // return this.http.get<FilterConfig>(API_URL + '/setup');
    return this.http.get<SetupTableObject>(temp_url + '/setup');
  }

  // public getTableConfig(feature: string, columns: any):Observable<TableConfig> {
  public getTableObject(feature: string, columns: any, qsparams: any): any {
    this.columnsString = this.makeColumnsString(columns);
    this.temp = API_URL + "/a/" + feature;
    if (this.columnsString) {
      this.temp = this.temp + "/" + this.columnsString;
    }
    return this.http.get<TableObject>(this.temp, { params: qsparams });


// for test server only:
    // return this.http.get<TableObject>(temp_url + '/table');
  }


}