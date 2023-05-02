import { Component, AfterContentInit } from '@angular/core';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import {FormControl, Validators} from '@angular/forms';
import { AuthService } from '../auth.service';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard'

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
    private clipboard: Clipboard
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
      this.potentialChosenOption = null;
      this.chosenOption = null;
      this.databaseName = "";
      this.featureName = "";
      this.selectedFile = null;
    }, 200);  
  }
  
  checkValidOptions() {
    if(this.databaseName.length > 0 && this.featureName.length > 0) {
      this.areOptionsValid = true;
    } else {
      this.areOptionsValid = false;
    }
  }

  handleResponseStream(line) {
    if(line.split(": ")[0] === "GENERATIONERROR") {
      this.throwGenerationError(JSON.parse(line.split(": ")[1]));
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
        this.generationSuccess = true;
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

  }

  formatBytes(a,b=2,k=1024) {let d=Math.floor(Math.log(a)/Math.log(k));return 0==a?"0 Bytes":parseFloat((a/Math.pow(k,d)).toFixed(Math.max(0,b)))+" "+["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"][d]}

}
