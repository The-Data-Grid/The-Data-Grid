import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http'
import { environment } from '../environments/environment';
import { Observable, observable, Subscribable } from 'rxjs';
import { map, catchError, filter, switchMap } from 'rxjs/operators';
import { ToiletObject, TableObject, SetupTableObject} from './models';
import { error } from '@angular/compiler/src/util';
import { analyzeAndValidateNgModules } from '@angular/compiler';
import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
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

  private handleError (error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const err = error || '';
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

  private extractData(res: Response) {
    let body = res;
    return body;
  }



// table
  public getSetupTableObject(): Observable<SetupTableObject> {
    // return this.http.get<FilterConfig>(API_URL + '/s/filter');
    // return this.http.get<FilterConfig>(API_URL + '/setup');
    // this.http.get<SetupTableObject>(temp_url + '/setup')

    
    // commented code below gives the correct server status but doesn't load the table


    // return this.http.get<SetupTableObject>(temp_url + '/setup',{observe: 'response'}).pipe(map((response: any) => {
    //   console.log("Server Status: " + response.status + ":::::" + response.statusText);
    //   return response}));


    // gives an undefined status but loads the table correctly
      return this.http.get<SetupTableObject>(temp_url + '/setup').pipe(map((response: any) => {
      console.log("Server Status: " + response.status + ":::::" + response.statusText);
      return response}));      
  }
  

  public getTableObject(feature: string, columns: any, qsparams: any): any {
    // this.columnsString = this.makeColumnsString(columns);
    // this.temp = API_URL + "/a/" + feature;
    // if (this.columnsString) {
    //   this.temp = this.temp + "/" + this.columnsString;
    // }
    // return this.http.get<TableObject>(this.temp, { params: qsparams });


// for test server only:
    return this.http.get<TableObject>(temp_url + '/table');
  }
  

}