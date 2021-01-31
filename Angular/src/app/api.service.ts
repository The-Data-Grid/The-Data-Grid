import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http'
import { environment } from '../environments/environment';
import { Observable, observable, Subscribable } from 'rxjs';
import { map, catchError, filter, switchMap } from 'rxjs/operators';
import {  TableObject, SetupTableObject } from './models';
import { error } from '@angular/compiler/src/util';
import { analyzeAndValidateNgModules } from '@angular/compiler';
import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
const API_URL = environment.apiUrl; //this should default to environment.ts in dev and environment.prod.ts in production
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

  public getSetupTableObject(): Observable<SetupTableObject> {
    var url = API_URL + '/setup';
    // var url = API_URL + '/audit/setup';

    return this.http.get<SetupTableObject>(url, {
      observe: 'response',
    })
      .pipe(map((response: any) => {
        console.log("Server Status: " + response.status + ":::::" + response.statusText);
        console.log(response.body);
        return response.body;
      }));
  }

  public getTableObject(feature: string, columns: any, qsparams: any): any {
    // var url = API_URL + "/audit/" + feature;
    this.columnsString = this.makeColumnsString(columns);
    if (this.columnsString) {
      url = url + "/" + this.columnsString;
    }
    // return this.http.get<TableObject>(url, { params: qsparams });
    // console.log(url);

    var url = API_URL + '/table';
    return this.http.get<TableObject>(url);
  }

  public getDropdownObject(): Observable<any> {
    var url = API_URL + '/audit/observation/distinct/toilet';
    // var url = API_URL + '/audit/setup';

    return this.http.get<any>(url, {
      observe: 'response',
    })
      .pipe(map((response: any) => {
        console.log("Server Status: " + response.status + ":::::" + response.statusText);
        console.log(response.body);
        return response.body;
      }));
  }

  


}