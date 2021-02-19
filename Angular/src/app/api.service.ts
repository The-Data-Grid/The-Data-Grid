import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http'
import { environment } from '../environments/environment';
import { Observable, observable, Subscribable } from 'rxjs';
import { map, catchError, filter, switchMap } from 'rxjs/operators';
import { TableObject, SetupTableObject, AppliedFilterSelections } from './models';
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

  public getTableObject(feature: string, defaultColumnIDs: any, appliedFilterSelections: AppliedFilterSelections): any {
    // var url = API_URL + "/audit/" + feature;
    // this.columnsString = this.makeColumnsString(columns);
    // if (this.columnsString) {
    //   url = url + "/" + this.columnsString;
    // }
    var url = API_URL + '/audit/observation/sink/65&66&67&68&70&73&76&142&143&69&71&72&74&75&78&79&80&81&82&83&144&145&146&147&148&149&150&151&156&157&158&159&160&161'
      + "?" + this.formQueryURL(defaultColumnIDs, appliedFilterSelections);
    // var url = API_URL + '/table';
    return this.http.get<TableObject>(url);

  }




  public getDropdownOptions(): Observable<any> {
    // var url = API_URL + '/audit/observation/distinct';
    var url = API_URL + '/audit/observation/distinct/sink/65&66&67&68&70&73&76&142&143&69&71&72&74&75&78&79&80&81&82&83&144&145&146&147&148&149&150&151&156&157&158&159&160&161';

    return this.http.get<any>(url, {
      observe: 'response',
    })
      .pipe(map((response: any) => {
        // console.log("Server Status: " + response.status + ":::::" + response.statusText);
        // console.log(response.body);
        return response.body;
      }));
  }


  private formQueryURL(defaultColumnIDs: any, appliedFilterSelections: AppliedFilterSelections) {
    // create the "columns" part of the query by joining the default column IDS with '&'
    let columnsString = defaultColumnIDs.join('&');
    let colAndFilterSeparater = "?";
    let filters = []

    for (const [ID, input] of Object.entries(appliedFilterSelections.dropdown)) {
      if (input) { filters.push(ID + "=" + input) }
    }
    for (const [ID, input] of Object.entries(appliedFilterSelections.numericEqual)) {
      if (input) { filters.push(ID + "=" + input) }
    }
    for (const [ID, inputObject] of Object.entries(appliedFilterSelections.numericChoice)) {
      // if (inputObject.relation && inputObject.value ) {filterString += ID + "=" + input}
    }
    for (const [ID, inputObject] of Object.entries(appliedFilterSelections.calendarRange)) {
      // if (inputObject.relation && inputObject.value ) {filterString += ID + "=" + input}
    }
    for (const [ID, input] of Object.entries(appliedFilterSelections.calendarEqual)) {
      if (input) { filters.push(ID + "=" + input) }
    }
    for (const [ID, inputArray] of Object.entries(appliedFilterSelections.searchableDropdown)) {
      inputArray.forEach(option => { filters.push(ID + "=" + option.item_text) });
    }
    for (const [ID, inputArray] of Object.entries(appliedFilterSelections.checklistDropdown)) {
      inputArray.forEach(option => { filters.push(ID + "=" + option.item_text) });
    }
    for (const [ID, inputArray] of Object.entries(appliedFilterSelections.searchableChecklistDropdown)) {
      inputArray.forEach(option => {
        filters.push(ID + "=" + option.item_text)
        // TO ASK: HOW TO DEAL WITH MULTIPLE SELECTIONS? for the multiselectors
      });
    }
    for (const [ID, input] of Object.entries(appliedFilterSelections.text)) {
      if (input) { filters.push(ID + "=" + input) }
    }
    for (const [ID, input] of Object.entries(appliedFilterSelections.bool)) {
      if (input) { filters.push(ID + "=" + input) }
    }

    // console.log(columnsString + colAndFilterSeparater + filters.join('&'));
    return filters.join('&');

  }

  // POST REQUESTS

  attemptLogin(loginObject, withCredentials=true) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json','No-Auth':'True', 'withCredentials':'True', 'With-Credentials': 'True' });
    return this.http.post(`${API_URL}/login`, loginObject, {headers:reqHeader, responseType: 'text', withCredentials:true });
  }


  signOut(withCredentials=true) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json','No-Auth':'True', 'withCredentials':'True', 'With-Credentials': 'True' });
    return this.http.post(`${API_URL}/logout`, {
   }, {headers:reqHeader, responseType:'text', withCredentials:true});
  }

}