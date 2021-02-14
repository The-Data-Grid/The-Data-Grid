import { Component, OnInit, Inject, ViewChild, HostListener, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../../api.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatCheckboxModule, MatCheckbox} from '@angular/material/checkbox';
import { SetupObjectService } from '../../setup-object.service';
import { SetupObject, TableObject } from '../../responses'
import { environment } from '../../../environments/environment';
const USE_FAKE_DATA = environment.useFakeData;

interface Data {
  name: string,
  features: Object,
  included: boolean
}

@Component({
  selector: 'app-root-features',
  templateUrl: './root-features.component.html',
  styleUrls: ['./root-features.component.css'],
})
export class RootFeaturesComponent implements OnInit {
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  rootFeatureOptions = [];

  constructor(private apiService: ApiService,
    public dialogRef: MatDialogRef<RootFeaturesComponent>,
    @Inject(MAT_DIALOG_DATA)public data: Data, @Inject(MAT_DIALOG_DATA) public da:Data, private setupObjectService: SetupObjectService) {
    }


    onSubmit():void {
      console.log(this.rootFeatures.length)
      for (let i = 0; i < this.rootFeatures.length; i++) {
        if ((document.getElementById(`${this.rootFeatures[i].name} root checkbox`) as HTMLInputElement).checked == true) {
          this.rootFeatureOptions.push(this.rootFeatures[i].name);}
      }
      this.dialogRef.close()
      console.log(this.rootFeatureOptions);
      this.notify.emit(this.rootFeatureOptions);
    }

    isCurrentlySelected(selector) {
      var result = this.data[1].filter(feature => feature.name == selector);
      if (result.length != 0) {
        return true;
      }
      return false;
    }

  setupObject;
  rootFeatures;
  currentWindowWidth;

  ngOnInit(): void {
    this.currentWindowWidth = window.innerWidth
    console.log(this.data);
    this.getSetupObject()
  }


  @HostListener('window:resize')
  onResize() {
    this.currentWindowWidth = window.innerWidth;
    console.log(this.currentWindowWidth)
  }


  getFeaturesLength() {
    for (var i = 0;; i++) {
      try {
        console.log(this.data[i].name);
      }
      catch (e) {
        return (i - 1);
      }
  }
}


getSubFeaturesLength(subfeatureList) {
  for (var i = 0;; i++) {
    try {
      console.log(subfeatureList.features[i].name)
    }
    catch (e) {
      return (i - 1);
    }
  }
}

  isChecked = false;

  status = "template";

  close() {
    this.dialogRef.close();
  }

// switch between the toggle options
  changeStatus(toggleOption) {
    this.status = toggleOption;
    if (this.status == 'roots') {
      this.getSetupObject();
    }
  }

getSetupObject() {
  this.apiService.getSetupTableObject().subscribe((res) => {
    USE_FAKE_DATA ? this.setupObject = SetupObject : this.setupObject = res;
    this.rootFeatures = this.setupObjectService.getRootFeatures(this.setupObject);
  });
}
  

  // getSetupObject() {
  //   this.apiService.getSetupTableObject(null).subscribe((res) => {
  //     this.setupObject = res;


  //     for (var i = 0; i < this.setupObject.subfeatureStartIndex; i++) {
  //       // if (document.getElementById(this.setupObject.featureColumns[i].frontendName) != null) {
  //         if (!this.all_root_features.includes(this.setupObject.featureColumns[i].frontendName))
  //           this.all_root_features.push(this.setupObject.featureColumns[i].frontendName)
  //       // }
  //     }
  //     console.log(this.all_root_features)
  //   });
  // }


}