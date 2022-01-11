import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import {FormControl, Validators} from '@angular/forms';
import { AuthService } from '../auth.service';
import {MatPaginator, PageEvent} from '@angular/material/paginator';

@Component({
  selector: 'audit-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AuditDashboard implements OnInit {

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private setupObjectService: SetupObjectService
  ) { }

  
  ngOnInit(): void {
    this.getSetupObjects();
    this.getAudits();
    this.getSOPs();
  }

  managingOrganizationChange() {
    this.getAudits();
    this.getSOPs();
  }
  
  sessionObject = this.authService.sessionObject;

  canViewPage = this.sessionObject.organizationID.length > 0;
  
  managingOrganization = this.canViewPage ? this.sessionObject.organizationID[0] : null;

  setupObject;
  setupFilterObject;
  allFeatures;
  allItems;
  uploadType = 'Observations';
  fieldsOptions = [];
  selectedFeature = 2; //Sink
  featuresOrItems = [];
  selectedFields = [];
  selectedSortField;
  filterBy = 'Ascending';

  onUploadTypeChange() {
    this.featuresOrItems = this.uploadType == 'Observations' ? this.allFeatures : this.allItems;
    this.selectedFeature = this.uploadType == 'Observations' ? 2 : 15;
    this.onFeatureSelectChange();
  }

  onFeatureSelectChange() {

  }

  getSetupObjects() {
    this.apiService.getSetupObject().subscribe((res) => {
      this.setupObject = res;
      this.parseSetupObject();
    });
  
    this.apiService.getSetupFilterObject().subscribe((res) => {
      this.setupFilterObject = res;
    })
  }

  parseSetupObject() {
    // get root features
    this.allFeatures = this.setupObject.features;
    this.allItems = this.setupObject.items;
    this.featuresOrItems = this.uploadType == 'Observations' ? this.allFeatures : this.allItems;
  }

  // Download spreadsheet template
  runDownload() {
    this.apiService.getSpreadsheet(this.selectedFeature, this.uploadType === 'Items', this.managingOrganization).subscribe((res) => {

    }, (err) => {

    });
  }

  // Upload spreadsheet template
  runUpload() {

  }

  // Audits

  auditNameForm = new FormControl('', [Validators.required]);

  newAuditInitiated = false;
  auditName = "";
  auditCount = 0;
  auditArray: any = [];
  currentPageSize = 5;
  currentPageIndex = 0;
  fittedAuditArray = this.auditArray.slice((this.currentPageSize * this.currentPageIndex), (this.currentPageSize * (this.currentPageIndex + 1)));
  
  onPageChange(event: PageEvent): PageEvent {
    // update page data
    this.currentPageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;
    // refresh API
    this.fittedAuditArray = this.auditArray.slice((this.currentPageSize * this.currentPageIndex), (this.currentPageSize * (this.currentPageIndex + 1)));
    return event;
  }

  initiateNewAudit(open) {
    this.newAuditInitiated = open ? true : false;
  }

  uploadNewAudit() {
    this.newAuditInitiated = false;
    this.apiService.uploadNewAudit(this.auditName, this.managingOrganization, this.sessionObject.userID).subscribe((res) => {
      this.getAudits();
    })
  }

  getAudits() {
    this.apiService.getAuditManagementTable(this.managingOrganization).subscribe((res) => {
      console.log(res)
      const json = JSON.parse(res);
      this.auditArray = json.audits;
      this.fittedAuditArray = this.auditArray.slice((this.currentPageSize * this.currentPageIndex), (this.currentPageSize * (this.currentPageIndex + 1)));
      this.auditCount = json.count;
    }, (err) => {
      console.log(err)
    })
  }

  // SOPs

  SOPArray: any = [];
  newSOPInitiated = false;
  SOPCount = 0;
  currentSOPPageSize = 5;
  currentSOPPageIndex = 0;
  SOPSignedUrl;
  selectedFile = null;
  fittedSOPArray = this.SOPArray.slice((this.currentSOPPageSize * this.currentSOPPageIndex), (this.currentSOPPageSize * (this.currentSOPPageIndex + 1)));
  signedUrlObject = null;
  
  SOPName: string = '';
  SOPNameForm = new FormControl('', [Validators.required]);
  SOPUpload;

  onSOPPageChange(event: PageEvent): PageEvent {
    // update page data
    this.currentSOPPageSize = event.pageSize;
    this.currentSOPPageIndex = event.pageIndex;
    // refresh API
    this.fittedSOPArray = this.SOPArray.slice((this.currentSOPPageSize * this.currentSOPPageIndex), (this.currentSOPPageSize * (this.currentSOPPageIndex + 1)));
    return event;
  }


  initiateNewSOP(open) {
    if(open) {
      this.newSOPInitiated = true;
    } else {
      this.newSOPInitiated = false; 
      this.selectedFile = null;
      this.SOPName = '';
    }
  }

  uploadSOPToBucket() {
    this.newSOPInitiated = false;
    const currentName = this.SOPName;
    const currentSelectedFile = this.selectedFile;
    this.apiService.getSignedUrl({
      organizationID: this.managingOrganization,
      fileName: currentSelectedFile.name,
      type: currentSelectedFile.type,
    }).subscribe((res) => {
      console.log(JSON.parse(res))
      this.signedUrlObject = JSON.parse(res);
      this.apiService.putFileToBucket({
        url: this.signedUrlObject.signedURL,
        contentType: currentSelectedFile.type,
        asset: currentSelectedFile
      }).subscribe((res) => {
        // success
        console.log(res);
        this.apiService.uploadSOP({
          dataURL: this.signedUrlObject.dataURL,
          name: currentName,
          organizationID: this.managingOrganization
        }).subscribe((res) => {
          console.log(res);
          this.getSOPs();
          this.selectedFile = null;
          this.SOPName = '';
  
        }, (err) => {
          console.log(err)
        });
  
      }, (err) => {
        // fail
        console.log(err)
  
      })
    }, (err) => {
      console.log(err)
    })
    
  }

  fileUploadChange(fileInputEvent: any) {
    this.selectedFile = fileInputEvent.target.files[0];
    console.log(this.selectedFile)
  }

  getSignedUrl(fileObject) {
    
  }

  getSOPs() {
    this.apiService.getSOPTable(this.managingOrganization).subscribe((res) => {
      console.log(res)
      this.SOPArray = JSON.parse(res);
      this.fittedSOPArray = this.SOPArray.slice((this.currentSOPPageSize * this.currentSOPPageIndex), (this.currentSOPPageSize * (this.currentSOPPageIndex + 1)));
      this.SOPCount = this.SOPArray.length;
    }, (err) => {
      console.log(err)
    })
  }
}