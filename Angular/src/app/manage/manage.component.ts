import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import { FormControl, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css']
})
export class ManagementComponent implements OnInit {

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private setupObjectService: SetupObjectService,
    private toastr: ToastrService
  ) { }


  ngOnInit(): void {
    this.getSetupObjects();
    this.getRoles();
  }

  sessionObject = this.authService.sessionObject;

  canViewPage = this.sessionObject.organizationID.length > 0;

  managingOrganization = this.canViewPage ? this.sessionObject.organizationID[0] : null;
  managingOrganizationName = this.canViewPage ? this.sessionObject.organizationFrontendName[0] : null;
  managingOrganizationRole = this.canViewPage ? this.sessionObject.role[0] : null

  managingOrganizationChange() {
    this.managingOrganizationName = this.sessionObject.organizationFrontendName[this.sessionObject.organizationID.indexOf(this.managingOrganization)];
    this.managingOrganizationRole = this.sessionObject.role[this.sessionObject.organizationID.indexOf(this.managingOrganization)];
    this.getRoles();
  }

  setupObject;
  setupFilterObject;
  allFeatures;
  allItems;
  isFeatureExpanded;
  showingFields;
  isLoading = true;
  setupLoading = [false, false];

  checkLoading() {
    if (this.setupLoading.every(el => el)) {
      this.isLoading = false;
    }
  }

  parseSetupObject() {
    // get root features
    this.allFeatures = this.setupObject.features;
    this.allItems = this.setupObject.items;
    this.isFeatureExpanded = this.allItems.map(e => false);
    this.showingFields = this.allItems.map(e => false);

    console.log(this.allItems)
    this.setupLoading[0] = true;
    this.checkLoading();
  }

  getSetupObjects() {
    this.apiService.getSetupObject(this.sessionObject.databaseName).subscribe((res) => {
      this.setupObject = res;
      this.parseSetupObject();
    });

    this.apiService.getSetupFilterObject(this.sessionObject.databaseName).subscribe((res) => {
      this.setupFilterObject = res;
      this.setupLoading[1] = true;
      this.checkLoading();
    })
  }

  // Database meta information
  databaseMeta = {
    name: 'UCLA Audits',
    location: 'Northern California',
    description: 'UCLA sustainability audit database. We hope it will be used to further the sustainable use of natural resources on campus. For use by various student organizations, UCLA Facilities, and UCLA Sustainability.',
    orgNames: [],
    nMembers: 0,
    nRows: 0,
  };

  // Organization members
  orgMembers = [];
  orgMembersInitiatedRevoke = [];

  // Role Management

  roleChangeForm = new FormControl('', [Validators.required, Validators.email]);

  roleEmail = '';

  roleManagementInitiated = false;

  initiateRoleManagement(start) {
    this.roleManagementInitiated = start;
    this.orgMembersInitiatedRevoke = this.orgMembersInitiatedRevoke.map(e => false);
  }

  initiateRoleRevoke(start, index) {
    this.orgMembersInitiatedRevoke[index] = start;
  }

  revokeRole(email, index) {
    const setRoleObject = {
      organizationID: this.managingOrganization,
      role: null,
      userEmail: email
    };
    this.roleManagementInitiated = false;
    this.orgMembersInitiatedRevoke[index] = false;

    this.apiService.setRole(setRoleObject).subscribe((res) => {
      this.getRoles();
      this.toastr.success('Access Revoked');
    }, (err) => {
      this.toastr.error(err.error);
    })
  }

  setRole() {
    const setRoleObject = {
      organizationID: this.managingOrganization,
      role: 'auditor',
      userEmail: this.roleEmail
    };
    this.roleManagementInitiated = false;
    this.roleEmail = '';

    this.apiService.setRole(setRoleObject).subscribe((res) => {
      this.getRoles();
      this.toastr.success('Role set successfully');
    }, (err) => {
      this.toastr.error(err.error);
    });
  }

  getRoles() {
    this.apiService.getRoles(this.managingOrganization).subscribe((res: any) => {
      this.orgMembers = res;
      this.orgMembersInitiatedRevoke = res.map(e => false);
    }, (err) => {

    })
  }

  // Schema
  openRequiredItem(index) {
    this.isFeatureExpanded = this.isFeatureExpanded.map(e => false);
    this.isFeatureExpanded[index] = true;
  }

  showFields(index) {
    const isCurrently = this.showingFields[index];
    this.showingFields = this.showingFields.map(e => false);
    this.showingFields[index] = !isCurrently;
  }

}
