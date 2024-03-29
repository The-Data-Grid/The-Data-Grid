import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TableObject, SetupTableObject, AppliedFilterSelections } from './models';
import { SetupObjectService, IDX_OF_ITEM_ARR, IDX_OF_AUDIT_ITEM_IDX } from './setup-object.service';

const API_URL = environment.apiUrl; //this should default to environment.ts in dev and environment.prod.ts in production
const PORT = environment.port;
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient, private setupObjectService: SetupObjectService) { }

  public uploadNewAudit(auditName: string, organizationID: number, userID) {
    const reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'With-Credentials': 'True' })
    const submissionObject = {
      "items": {
          "create": [
              {
                  "itemTypeID": 10,
                  "requiredItems": [
                      // Organization
                      {
                          "itemTypeID": 1,
                          "primaryKey": organizationID
                      },
                      // User
                      {
                          "itemTypeID": 8,
                          "primaryKey": userID
                      }
                  ],
                  "newRequiredItemIndices": [],
                  "globalPrimaryKey": null,
                  "newGlobalItemIndex": null,
                  "data": {
                      "returnableIDs": [
                          272
                      ],
                      "data": [
                          auditName
                      ]
                  }
              }
          ],
          "update": [],
          "delete": [],
          "requestPermanentDeletion": []
      },
      "observations": {
          "create": [],
          "update": [],
          "delete": []
      }
  }

    return this.http.post(`${API_URL}/audit/submission`, submissionObject, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }

  public getSetupObject(databaseName: string = "default"): Observable<any> {
    var url = `${API_URL}/db/${databaseName}/setup`;

    return this.http.get<any>(url, {
      observe: 'response',
    })
      .pipe(map((response: any) => {
        console.log("SetupObject Request Status: " + response.status + ":::::" + response.statusText);
        console.log("setupObject", response.body);
        return response.body;
      }));
  }

  public getAudits(setupObject): Observable<any> {
    let auditTreeIDObjects = this.setupObjectService.getAllAuditItemRelatedColumns(setupObject);
    let itemPath = IDX_OF_ITEM_ARR + ">" + setupObject.children[IDX_OF_AUDIT_ITEM_IDX]; //path to audit item
    let returnableIDstring = auditTreeIDObjects[itemPath].IDreturnableIDs.filter(s => s).join('&')
    let url = API_URL + '/audit/item/audit/' + returnableIDstring;
    // let url = API_URL + '/audit/item/audit/1234567890';

    console.log(url)

    return this.http.get<any>(url, {
      observe: 'response',
    })
      .pipe(map((response: any) => {
        console.log("Audit Request Status: " + response.status + ":::::" + response.statusText);
        console.log("audit response", response.body);
        return response.body;
      }));
  }

  public getSetupFilterObject(databaseName: string = "default") {
    const url = `${API_URL}/db/${databaseName}/setup/filter`;

    return this.http.get<any>(url, {
      observe: 'response',
    })
      .pipe(map((response: any) => {
        console.log("SetupObject Request Status: " + response.status + ":::::" + response.statusText);
        console.log("setupObject", response.body);
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

  public getAllDatabases() {
    const url = `${API_URL}/executive/databases`;
    const reqHeader = new HttpHeaders({ 'With-Credentials': 'True' });

    return this.http.get<any>(url, {
      observe: 'response',
    })
    .pipe(map((response: any) => {
      return response.body;
    }));
  }

  public downloadDatabase(dbSqlName) {
    const url = `${API_URL}/executive/download/${dbSqlName}`;

    return this.http.get<any>(url, { responseType: "arrayBuffer" as "json" })
  }

  public deleteDatabase(dbSqlName, password) {
    const url = `${API_URL}/executive/delete/${dbSqlName}`;
    const reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'With-Credentials': 'True' })

    return this.http.post<any>(url, { password }, { headers: reqHeader, withCredentials: true, responseType: "json" });
  }

  public newGetTableObject(database: string, isObservation: boolean, feature: string, returnableIDs: Array<Number>, appliedFilterSelections: any, sortObject: any, pageObject: any) {
    const observationOrItem = isObservation ? 'observation' : 'item';
    const formattedSort: string = this.formatSort(sortObject);
    const formattedPage: string = this.formatPage(pageObject);
    const formattedFilterSelections: string = this.formatFilterSelections(appliedFilterSelections);
    const urlNoQuery = API_URL + '/db/' + database + '/audit/' + observationOrItem + '/' + feature + '/' + returnableIDs.join('&');
    const queryString = [formattedSort, formattedPage, formattedFilterSelections].filter(arg => arg.length > 0).join('&');
    const finalUrl = queryString.length > 0 ? urlNoQuery + '?' + queryString : urlNoQuery;
    // console.log(finalUrl)
    return this.http.get<any>(finalUrl);
  }

  private formatSort(sortObject: any): string {
    if(sortObject === null) {
      return '';
    }
    const key = sortObject.isAscending ? 'sorta' : 'sortd';
    return `${key}=${sortObject.returnableID}`;
  }

  private formatPage(pageObject: any): string {
    return `limit=${pageObject.limit}&offset=${pageObject.offset}`;
  }

  private formatFilterSelections(appliedFilterSelections): string {
    return appliedFilterSelections.length > 0 ? 'builder=' + appliedFilterSelections : '';
  }

  public getAuditManagementTable(organizationID) {
    const url = API_URL + '/manage/audits?organizationID=' + organizationID;
    const reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'withCredentials': 'True', 'With-Credentials': 'True' });

    return this.http.get(url, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }

  public getSignedUrl(fileObject) {
    const {
      organizationID,
      type,
      fileName,
    } = fileObject;
    const url = `${API_URL}/manage/signed-url?organizationID=${organizationID}&type=${type}&fileName=${fileName}`;
    const reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'withCredentials': 'True', 'With-Credentials': 'True' });

    return this.http.get(url, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }

  public putFileToBucket(putObject) {
    const {
      url,
      contentType,
      asset
    } = putObject; 

    console.log(putObject)
    
    const reqHeader = new HttpHeaders({ 'Content-Type': contentType });
    return this.http.put(url, asset, { headers: reqHeader });
  }

  public uploadSOP(sopObject) {
    const reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'With-Credentials': 'True' })
    const submissionObject = {
      "items": {
          "create": [
            {
              "itemTypeID": 7,
              "requiredItems": [{
                  "itemTypeID": 1,
                  "primaryKey": sopObject.organizationID
              }],
              "newRequiredItemIndices": [],
              "globalPrimaryKey": null,
              "newGlobalItemIndex": null,
              "data": {
                  "returnableIDs": [
                      209,
                      210
                  ],
                  "data": [
                      sopObject.name,
                      sopObject.dataURL
                  ]
              }
            }
          ],
          "update": [],
          "delete": [],
          "requestPermanentDeletion": []
      },
      "observations": {
          "create": [],
          "update": [],
          "delete": []
      }
  }

    return this.http.post(`${API_URL}/audit/submission`, submissionObject, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }

  public putApiKey() {
    const reqHeader = new HttpHeaders({ 'With-Credentials': 'True' });

    return this.http.put(`${API_URL}/manage/key`, undefined, { headers: reqHeader, responseType: 'json', withCredentials: true })
  }

  public deleteApiKey() {
    const reqHeader = new HttpHeaders({ 'With-Credentials': 'True' });

    return this.http.delete(`${API_URL}/manage/key`, { headers: reqHeader, withCredentials: true });
  }

  public getSOPTable(organizationID) {
    const url = API_URL + '/manage/sops?organizationID=' + organizationID;
    const reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'withCredentials': 'True', 'With-Credentials': 'True' });

    return this.http.get(url, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }

  public setRole(setRoleObject) {
    const {
      organizationID,
      userEmail,
      role
    } = setRoleObject;

    const url = API_URL + '/user/role';
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True',
      'withCredentials': 'True',
      'With-Credentials': 'True'
    });

    return this.http.put(url, setRoleObject, { headers: reqHeader, responseType: 'text', withCredentials: true});
  }

  public getRoles(organizationID) {
    const url = API_URL + '/user/role?organizationID=' + organizationID;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True',
      'withCredentials': 'True',
      'With-Credentials': 'True'
    });

    return this.http.get(url, { headers: reqHeader, responseType: 'json', withCredentials: true});
  }

  public downloadTableObject(database: string, isObservation: boolean, feature: string, returnableIDs: Array<Number>, appliedFilterSelections: any, sortObject: any, isCSV: boolean, pageObject: any) {
    const observationOrItem = isObservation ? 'observation' : 'item';
    const formattedSort: string = this.formatSort(sortObject);
    const formattedPage: string = this.formatPage(pageObject);
    const formattedFilterSelections: string = this.formatFilterSelections(appliedFilterSelections);
    const downloadType = isCSV ? 'csv' : 'json'
    const urlNoQuery = API_URL + '/db/' + database + '/audit/' + observationOrItem + '/download/' + downloadType + '/' + feature + '/' + returnableIDs.join('&');
    const queryString = [formattedSort, formattedPage, formattedFilterSelections].filter(arg => arg.length > 0).join('&');
    const finalUrl = queryString.length > 0 ? urlNoQuery + '?' + queryString : urlNoQuery;

    return this.http.get<any>(finalUrl, { responseType: 'blob' as 'json'} );
  }

  // arg returnableIDS is an array of IDS for which you want to get options
  public getDropdownOptions(returnableIDs, auditName = "sink"): Observable<any> {
    console.log(returnableIDs)
    if (!auditName) {
      auditName = "sink"
    }
    // var url = API_URL + '/audit/observation/distinct';
    // var url = API_URL + '/audit/observation/distinct/sink/65&66&67&68&70&73&76&142&143&69&71&72&74&75&78&79&80&81&82&83&144&145&146&147&148&149&150&151&156&157&158&159&160&161&188';
    var url = API_URL + '/audit/observation/distinct/' + auditName + '/' + returnableIDs.filter(s => s).join('&');

    return this.http.get<any>(url, {
      observe: 'response',
    })
      .pipe(map((response: any) => {
        return response.body;
      }));
  }

  public getSpreadsheet(featureID, isItem, nRows, organizationID) {
    const url = API_URL + `/manage/spreadsheet?organizationID=${organizationID}&isItem=${isItem}&featureID=${featureID}&nRows=${nRows}`;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True',
      'withCredentials': 'True',
      'With-Credentials': 'True'
    });

    return this.http.get<any>(url, { headers: reqHeader, responseType: 'blob' as 'json', withCredentials: true});
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

  async generateSchema(options) {
    const {
      file,
      fileType,
      fileExtension,
      featureName,
      dbName,
      apiKey,
      separator
    } = options;
    const formData = new FormData();
    formData.append(`${fileType.toLowerCase()}.${fileExtension}`, file);
    const fetchOptions: any = {
      "body": formData,
      "method": "POST"
    };
    if(apiKey) {
      fetchOptions.headers = {'db-api-key': apiKey};
    }
    let url = `${API_URL}/executive/generate?type=${fileType}&name=${encodeURIComponent(dbName)}&featureName=${encodeURIComponent(featureName)}`;
    return fetch(url + (separator ? `&separator=${separator}` : ''), fetchOptions);
  }

  uploadSpreadsheet(file, sops, organizationID) {
    const reqHeader = new HttpHeaders({ 'No-Auth': 'True', 'With-Credentials': 'True' })
    const formData: FormData = new FormData();
    formData.append('spreadsheet', file);
    formData.append('sops', JSON.stringify(sops));

    const url = API_URL + '/manage/spreadsheet?organizationID=' + organizationID;
    return this.http.post<any>(url, formData, { headers: reqHeader, withCredentials: true});
  }

  attemptLogin(databaseName, loginObject, withCredentials = true) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'withCredentials': 'True', 'With-Credentials': 'True' });
    return this.http.post(`${API_URL}/db/${databaseName}/user/login`, loginObject, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }

  attemptSignUp(signUpObject, withCredentials = true) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'withCredentials': 'True', 'With-Credentials': 'True' });
    return this.http.post(`${API_URL}/user`, signUpObject, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }

  verifyEmail(verifyEmailObject, withCredentials = true) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'withCredentials': 'True', 'With-Credentials': 'True' });
    return this.http.post(`${API_URL}/user/email/verify`, verifyEmailObject, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }
  
  signOut(withCredentials = true) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True', 'withCredentials': 'True', 'With-Credentials': 'True' });
    return this.http.post(`${API_URL}/user/logout`, {
    }, { headers: reqHeader, responseType: 'text', withCredentials: true });
  }

}
