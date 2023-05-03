import { Component, AfterContentInit } from '@angular/core';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import {FormControl, Validators} from '@angular/forms';
import { AuthService } from '../auth.service';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard';
import { Router } from '@angular/router';


@Component({
  selector: 'schema-gen',
  templateUrl: './schema-gen.component.html',
  styleUrls: ['./schema-gen.component.css']
})
export class SchemaGen implements AfterContentInit {

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private setupObjectService: SetupObjectService,
    private toastr: ToastrService,
    private clipboard: Clipboard,
    private router: Router
  ) { }

  genTypes = ["CSV", "GeoJSON", "Custom"];
  extensionTypes = ["csv", "json", "json"];
  mimeTypes = ["text/csv", "application/json", "application/json"];
  options = [0,1,2];
  optionText = [
    ["Tabluar Database", "Automatically convert a spreadsheet or table into PostgreSQL. Database design best practices, data formatting, insertion, and more are all handled for you.", "Upload CSV File"],
    ["Geospatial Database", "Create a database with geographic features that can run geospatial analysis from the map page. Uses PostGIS under the hood for efficient spatial queries.", "Upload GeoJSON File"],
    ["Custom Database", "Write a custom database schema using the universal data representation format. Allows complete control over fields, relations, constraints, and more.", "Upload JSON"]
  ];


  onOptionsPage = true;
  generationInProgress = false;
  responseStream = [];
  chosenOption = null;
  potentialChosenOption = null;
  // For handling the form transition
  isFormHidden = true;
  
  databaseName = "";
  featureName = "";
  selectedFile = null;
  areOptionsValid = false;

  headerText = "";
  databaseSqlName = null;
  generationError = null;
  generationSuccess = false;

  ngAfterContentInit(): void {
    // Add the transition after init so it doesn't fire on first load
    setTimeout(() => {
      // Really not sure why I need to hack it like this
      document.getElementById("entirePageContainer").style.transition = "padding-top 0.5s";
    }, 500)
  }

  async generateSchema() {
    try {
      this.headerText = "in progress..."
      this.generationInProgress = true;
      this.onOptionsPage = false;
      this.isFormHidden = true;
      const options = {
        contentType: this.mimeTypes[this.chosenOption],
        file: this.selectedFile,
        fileType: this.genTypes[this.chosenOption],
        fileExtension: this.extensionTypes[this.chosenOption],
        featureName: this.featureName,
        dbName: this.databaseName
      };
      const response = await this.apiService.generateSchema(options)
      const reader = response.body.getReader();
      const responseDecoder = new TextDecoder('utf-8');
      while(true) {
        const { done, value } = await reader.read();
        if(done) {
          this.generationInProgress = false;
          return;
        }
  
        this.handleResponseStream(responseDecoder.decode(value))
      }
    } catch(err) {
      this.throwGenerationError({type: "Request Error", message: "Failed to get a response from the API"});
    }
  }

  uploadFile(option) {
    this.potentialChosenOption = option;
    // Must do after setTimeout so input element can rerender with correct `accept` attribute
    setTimeout(() => document.getElementById("fileInput").click(), 1);
  }

  fileUploadChange(fileInputEvent: any) {
    if(fileInputEvent.target.files[0]) {
      this.selectedFile = fileInputEvent.target.files[0];
      this.chosenOption = this.potentialChosenOption;
      setTimeout(() => this.isFormHidden = false, 1);
    }
  }

  resetOptions() {
    // First trigger the CSS transition before the derender of the form
    this.isFormHidden = true;
    this.areOptionsValid = false;
    
    // Wait until the transition finishes
    setTimeout(() => {
      // Now trigger the derender
      this.onOptionsPage = true;
      this.generationInProgress = false;
      this.responseStream = [];
      this.chosenOption = null;
      this.potentialChosenOption = null;
      this.databaseName = "";
      this.featureName = "";
      this.selectedFile = null;
      this.headerText = "";
      this.databaseSqlName = null;
      this.generationError = null;
      this.generationSuccess = false;
    }, 200);  
  }

  editConfig() {
    this.generationInProgress = false;
    this.onOptionsPage = true;
    this.isFormHidden = false;
    this.generationError = null;
    this.responseStream = [];
  }
  
  checkValidOptions() {
    if(this.databaseName.length > 0 && this.featureName.length > 0) {
      this.areOptionsValid = true;
    } else {
      this.areOptionsValid = false;
    }
  }

  async handleResponseStream(line) {
    if(line.split(": ")[0] === "GENERATIONERROR") {
      try {
        this.throwGenerationError(JSON.parse(line.split(": ")[1]));
      } catch(err) {
        // Could not parse JSON
        this.throwGenerationError({type: "Unknown", message:line.split(": ")[1]});
      }
      return;
    }
    if(this.databaseSqlName === null) {
      if(line.split(": ")[0] === "GENERATIONSTART") {
        const firstChunk = line.split(": ")[1].split("\n");
        this.databaseSqlName = firstChunk[0];
        for(let remaining of firstChunk.slice(1)) {
          this.responseStream.push(remaining);
        }
      } else {
        this.throwGenerationError({type: "Unknown", message: "Did not receive an expected response from the API, try again later."})
      }
    } else {
      if(line.split(": ")[0] === "GENERATIONSUCCESS") {
        try {
          const {
            userPassword,
            userEmail,
          } = JSON.parse(line.split(": ")[1]);
          await this.successfulGeneration(userPassword, userEmail);
        } catch(err) {
          // Could not parse JSON
          this.throwGenerationError({type: "Unknown", message:"Received successful generation signal from API but malformed accompanying information"});
        }
      } else {
        // Most responses
        for(let remaining of line.split("\n")) {
          if(remaining.length > 0) {
            this.responseStream.push(remaining);
            const currIndex = this.responseStream.length - 1;
            setTimeout(() => {
              document.getElementById("line-" + currIndex).scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
            }, 10);
          }
        }
      }
    }
  }

  throwGenerationError(errorObject) {
    if(errorObject.message && typeof errorObject.message !== "string") {
      errorObject.message = JSON.stringify(errorObject.message);
    }
    this.generationError = errorObject;
    this.headerText = "Generation Error";
    this.generationSuccess = false;
  }

  async successfulGeneration(userPassword, userEmail) {
    // flash success in the header and fire a snackbar
    this.generationSuccess = true;
    this.headerText = "Successfully Generated"
    this.toastr.success("Database Created", "");
    // Wait a second for aesthetic purposes
    await new Promise(r => setTimeout(r, 1000));
    // parse string and get password, log user in on the frontend, now there is a cookie, fire another snackbar
    if (this.authService.isLocalStorageBlocked) {
      this.toastr.error('Your browser is blocking access to local storage', 'Allow cookies and local storage for www.thedatagrid.org in your browser to continue.')
      this.throwGenerationError({type: "Unable to log in", message:`Your browser is blocking access to local storage. Allow local storage to store your database information and manage it in your browser.\
Your database has been successfully created and is publicly accessible on the 'Query Data' page. After allowing access to local storage, log in to your database ${this.databaseName} with email ${userEmail} and\
password ${userPassword} to manage it. Do not share this password with anyone, this is the only time it will be displayed.`});
    } else {
      const userLoginObject = { email: userEmail, pass: userPassword };
      this.apiService.attemptLogin(this.databaseName, userLoginObject)
        .subscribe((res) => {
          // top bar should change with log in status, redirect to new management page
          this.authService.setSession(res)
          this.toastr.success('Log in Successful', '');
          this.router.navigate(['/manage'])
        }, (err) => {
          this.throwGenerationError({type: "Unable to log in", message:"Log in has failed for unknown reasons. Your database has been successfully created and is publicly accessible on the 'Query Data' page."})
        });
    }

    
  }

  formatBytes(a,b=2,k=1024) {let d=Math.floor(Math.log(a)/Math.log(k));return 0==a?"0 Bytes":parseFloat((a/Math.pow(k,d)).toFixed(Math.max(0,b)))+" "+["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"][d]}

}
