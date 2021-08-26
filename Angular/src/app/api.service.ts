import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http'
import { environment } from '../environments/environment';
import { Observable, observable, Subscribable } from 'rxjs';
import { map, catchError, filter, switchMap } from 'rxjs/operators';
import { TableObject, SetupTableObject, AppliedFilterSelections } from './models';
import { error } from '@angular/compiler/src/util';
import { analyzeAndValidateNgModules } from '@angular/compiler';
import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import {SubmissionObject} from './models/submission'
const API_URL = environment.apiUrl; //this should default to environment.ts in dev and environment.prod.ts in production
const PORT = environment.port;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  public getSetupTableObject(): Observable<SetupTableObject> {
    var url = API_URL + '/setup';

    return this.http.get<SetupTableObject>(url, {
      observe: 'response',
    })
      .pipe(map((response: any) => {
        console.log("Server Status: " + response.status + ":::::" + response.statusText);
        console.log(response.body);
        return response.body;
      }));
  }

  public getTableObject(feature: string, defaultColumnIDs: any, appliedFilterSelections: AppliedFilterSelections, returnableIDs): any {
    //DON'T DELETE. once sink is the only feature we can get dropdown info for.
    //we wil need this stuff once sink and default columns are no longer hardcoded
    // var url = API_URL + "/audit/observation/" + feature;

    // sink as feature and default columns are hardcoded:
    //rn formQueryURL just forms the filters part. in the future i might make it create the whole url.
    // var url = API_URL + '/audit/observation/sink/65&66&67&68&70&73&76&142&143&69&71&72&74&75&78&79&80&81&82&83&144&145&146&147&148&149&150&151&156&157&158&159&160&161'
    var url = API_URL + '/audit/observation/sink/' + returnableIDs.filter(s => s).join('&')
      + this.formQueryURL(defaultColumnIDs, appliedFilterSelections);

    return this.http.get<TableObject>(url);
  }

  // arg returnableIDS is an array of IDS for which you want to get options
  public getDropdownOptions(returnableIDs): Observable<any> {
    // var url = API_URL + '/audit/observation/distinct';
    // var url = API_URL + '/audit/observation/distinct/sink/65&66&67&68&70&73&76&142&143&69&71&72&74&75&78&79&80&81&82&83&144&145&146&147&148&149&150&151&156&157&158&159&160&161&188';
    var url = API_URL + '/audit/observation/distinct/sink/' + returnableIDs.filter(s => s).join('&');

    return this.http.get<any>(url, {
      observe: 'response',
    })
      .pipe(map((response: any) => {
        return response.body;
      }));
  }


  private formQueryURL(defaultColumnIDs: any, appliedFilterSelections: AppliedFilterSelections) {
    // create the "columns" part of the query by joining the default column IDS with '&'
    let columnsString = defaultColumnIDs.join('&');
    let colAndFilterSeparater = "?";

    //each element consists of a returnable, "=", and its user selections
    //ex: 42=Toyota, 58=red|blue
    let filterStrings = []

    for (const [ID, input] of Object.entries(appliedFilterSelections.dropdown)) {
      if (input) { filterStrings.push(ID + "=" + input) }
    }
    for (const [ID, input] of Object.entries(appliedFilterSelections.numericEqual)) {
      if (input) { filterStrings.push(ID + "=" + input) }
    }
    for (const [ID, inputObject] of Object.entries(appliedFilterSelections.numericChoice)) {
    }
    for (const [ID, inputObject] of Object.entries(appliedFilterSelections.calendarRange)) {
    }
    for (const [ID, input] of Object.entries(appliedFilterSelections.calendarEqual)) {
      if (input) { filterStrings.push(ID + "=" + input) }
    }
    for (const [ID, inputArray] of Object.entries(appliedFilterSelections.searchableDropdown)) {
      inputArray.forEach(option => { filterStrings.push(ID + "=" + option.item_text) });
    }
    for (const [ID, inputArray] of Object.entries(appliedFilterSelections.checklistDropdown)) {
      inputArray.forEach(option => { filterStrings.push(ID + "=" + option.item_text) });
    }
    for (const [ID, inputArray] of Object.entries(appliedFilterSelections.searchableChecklistDropdown)) {
      let optionStrings = [];
      inputArray.forEach(option => {
        optionStrings.push(option.item_text);
      });
      // if there are no options, don't add this filter's id to the URL
      if (optionStrings.length != 0) {
        filterStrings.push(ID + "=" + optionStrings.join('|'));
      }
    }
    for (const [ID, input] of Object.entries(appliedFilterSelections.text)) {
      if (input) { filterStrings.push(ID + "=" + input) }
    }
    for (const [ID, input] of Object.entries(appliedFilterSelections.bool)) {
      if (input) { filterStrings.push(ID + "=" + input) }
    }

    // console.log(columnsString + colAndFilterSeparater + filterStrings.join('&'));
    if (filterStrings.length != 0) {
      // filter to remove empty strings
      return colAndFilterSeparater + filterStrings.filter(s => s).join('&');

    }
    else return "";

  }

  // POST REQUESTS

  attemptLogin(loginObject, withCredentials = true) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'withCredentials': 'True', 'With-Credentials': 'True' });
    return this.http.post(`${API_URL}/login`, loginObject, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }


  signOut(withCredentials = true) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'withCredentials': 'True', 'With-Credentials': 'True' });
    return this.http.post(`${API_URL}/logout`, {
    }, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }

  submit(submission:SubmissionObject) {
    return this.http.post(`${API_URL}/audit/submission`, submission, {responseType:'text'})
  }

}