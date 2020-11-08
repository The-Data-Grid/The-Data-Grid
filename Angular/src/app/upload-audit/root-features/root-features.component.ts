import { Component, OnInit, Inject, ViewChild, HostListener } from '@angular/core';
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


  constructor(private apiService: ApiService,
    public dialogRef: MatDialogRef<RootFeaturesComponent>,
    @Inject(MAT_DIALOG_DATA)public data: Data, private setupObjectService: SetupObjectService) {
    }


  setupObject;
  rootFeatures;
  currentWindowWidth;

  ngOnInit(): void {
    this.currentWindowWidth = window.innerWidth
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

// keeps track of which features are checked (temporary)
  updateFeatures() {
    if (this.status == 'template') {
    var featuresLength = this.getFeaturesLength();
    console.log(featuresLength + " is the features length");


    for (var i = 0; i <= featuresLength; ++i) {
      const no = (<HTMLInputElement>document.getElementById(this.data[i].name + " checkbox"))
      const feature = document.getElementById(this.data[i].name + " checkbox") as HTMLInputElement;
      if (!feature.checked) {
        this.data[i].included = false;
      }
      else {
        this.data[i].included = true;
      }

      const subFeaturesLength = this.getSubFeaturesLength(this.data[i]);
      for (var j = 0; j <= subFeaturesLength; j++) {
        if (this.data[i].included == false) {
          this.data[i].features[j].included = false;
          continue;
        }
        const subFeature = document.getElementById(this.data[i].features[j].name + " checkbox") as HTMLInputElement;
        if (!subFeature.checked) {
          this.data[i].features[j].included = false;
        }
        else {
          this.data[i].features[j].included = true;
        }
      }

    }
    this.close();
  }
  else {
    this.close();
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
  this.apiService.getSetupTableObject(null).subscribe((res) => {
    USE_FAKE_DATA ? this.setupObject = SetupObject : this.setupObject = res;
    this.rootFeatures = this.setupObjectService.getRootFeatures(this.setupObject);
    // this.setupObjectService.getRootFeatures(this.setupObject);
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