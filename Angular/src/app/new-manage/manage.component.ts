import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import { FormControl, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';


@Component({
  selector: 'manage',
  templateUrl: './manage.component.html',
  styleUrls: ['../schema-gen/schema-gen.component.css']
})
export class NewManage implements OnInit {

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private setupObjectService: SetupObjectService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit() {
    this.getSetupObjects();
  }

  setupObject;
  setupFilterObject;
  allFeatures;
  allItems;
  isFeatureExpanded;
  isItemExpanded;
  showingFields;
  databaseInfo;
  sessionObject = this.authService.sessionObject;
  isLoading = [true, true];
  enterPassword = "";
  allowDelete = false;
  downloadBeforeDelete = false;
  schemaView = 0;


  parseSetupObject() {
    // get root features
    this.allFeatures = this.setupObject.features;
    this.allItems = this.setupObject.items;
    this.isFeatureExpanded = this.allFeatures.map(e => false);
    this.isFeatureExpanded[0] = true;
    this.isItemExpanded = this.allItems.map(e => false);
    this.showingFields = this.allItems.map(e => false);

    console.log(this.allItems)
    this.isLoading[0] = false;
  }

  getSetupObjects() {
    this.apiService.getSetupObject(this.sessionObject.databaseName).subscribe((res) => {
      this.setupObject = res;
      this.parseSetupObject();
    });

    this.apiService.getSetupFilterObject(this.sessionObject.databaseName).subscribe((res) => {
      this.setupFilterObject = res;
      this.isLoading[1] = false;
    })

    this.apiService.getAllDatabases().subscribe((res) => {
      this.databaseInfo = res.filter(db => db.dbSqlName === this.sessionObject.databaseName)[0];
    })
  }

  showFields(index) {
    const isCurrently = this.showingFields[index];
    this.showingFields = this.showingFields.map(e => false);
    this.showingFields[index] = !isCurrently;
  }

  // Schema
  openRequiredFeature(index) {
    this.isFeatureExpanded = this.isFeatureExpanded.map(e => false);
    this.isFeatureExpanded[index] = true;
  }

  openRequiredItem(index) {
    this.isItemExpanded = this.isItemExpanded.map(e => false);
    this.isItemExpanded[index] = true;
  }

  downloadDatabase() {
    this.apiService.downloadDatabase(this.sessionObject.databaseName).subscribe((res) => {
      const blob = new Blob([res], {type: "application/zip"});
      const downloadURL = window.URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = downloadURL;
      link.download = `${this.sessionObject.databaseName}_database_image.zip`;
      link.click();
    })
  }

  async deleteDatabase() {
    // download first
    if(this.downloadBeforeDelete) {
      this.downloadDatabase();
      // Wait a little bit
      await new Promise(r => setTimeout(r, 1000));
    }
    this.apiService.deleteDatabase(this.sessionObject.databaseName, this.enterPassword).subscribe((res) => {
      // log out, go to main page
      this.toastr.success(`Successfully deleted database '${this.sessionObject.databaseName}'`, "");
      this.authService.clearSessionData();
      this.router.navigateByUrl('/');
    }, (err) => {
      // display error
      this.toastr.error("Failed to delete database. Your login session may be expired or the database may be already deleted", "");
    })
  }

  checkPasswordNotEmpty() {
    this.allowDelete = this.enterPassword.length > 0;
  }


}