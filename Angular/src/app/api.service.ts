import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http'
import { environment } from '../environments/environment';
import { Observable, observable, Subscribable } from 'rxjs';
import { map, catchError, filter, switchMap } from 'rxjs/operators';
import { ToiletObject, TableObject, SetupTableObject } from './models';
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

  public getSetupTableObject(lastModified: string): Observable<SetupTableObject> {
    // return this.http.get<FilterConfig>(API_URL + '/s/filter');
    // var url = API_URL + '/setup';
    var url = temp_url + '/setup';
    var lastModifiedObject = {
      lastModified: lastModified
    }

    return this.http.get<SetupTableObject>(url, {
      observe: 'response',
      // params: lastModifiedObject
    })
      .pipe(map((response: any) => {
        console.log("Server Status: " + response.status + ":::::" + response.statusText);
        return response.body;
      }));
  }

  public getTableObject(feature: string, columns: any, qsparams: any): any {
    // this.columnsString = this.makeColumnsString(columns);
    // this.temp = API_URL + "/a/" + feature;
    // if (this.columnsString) {
    //   this.temp = this.temp + "/" + this.columnsString;
    // }
    // return this.http.get<TableObject>(this.temp, { params: qsparams });

    var url = temp_url + '/table';

    // for test server only:
    return this.http.get<TableObject>(url);
  }


}