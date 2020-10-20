import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { ApiService } from '../../api.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatCheckboxModule, MatCheckbox} from '@angular/material/checkbox';

interface Data {
  name: string,
  features: Object,
  included: boolean
}

@Component({
  selector: 'app-root-features',
  templateUrl: './root-features.component.html',
  styleUrls: ['./root-features.component.css']
})
export class RootFeaturesComponent implements OnInit {


  constructor(private apiService: ApiService,
    public dialogRef: MatDialogRef<RootFeaturesComponent>,
    @Inject(MAT_DIALOG_DATA)public data: Data) {
    }


  setupObject;
  all_root_features = [];

  ngOnInit(): void {
  }


  hideOrShow(id) {
    if (document.getElementById(id).style.display != "none") {
      document.getElementById(id).style.display = "none";
    }
    else {
      document.getElementById(id).style.display = "block";
    }

    if (document.getElementById(id + ' caret').classList.contains('right')) {
      document.getElementById(id + ' caret').classList.remove('right');
      document.getElementById(id + ' caret').classList.add('down');
    }

    else {
      document.getElementById(id + ' caret').classList.remove('down');
      document.getElementById(id + ' caret').classList.add('right');
    }

    if (document.getElementById(id + ' separator').classList.contains('separators_highlight')) {
      console.log("removing")
      document.getElementById(id + ' separator').classList.remove('separators_highlight');
    }

    else {
      console.log("adding");
      document.getElementById(id + ' separator').classList.add('separators_highlight');
    }
    
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


  updateFeatures() {
    if (this.status == 'template') {
    var featuresLength = this.getFeaturesLength();
    console.log(featuresLength + " is the features length");


    for (var i = 0; i <= featuresLength; ++i) {
      const no = (<HTMLInputElement>document.getElementById(this.data[i].name + " checkbox"))
      const feature = document.getElementById(this.data[i].name + " checkbox") as HTMLInputElement;
      if (!feature.checked) {
        this.data[i].included = false;
        console.log(this.data[i].name + " is the thing")
        console.log(no.checked + " is the second thing")
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


  changeStatus(toggleOption) {
    this.status = toggleOption;
    if (this.status == 'roots') {
      this.getSetupObject();
    }
  }

  getSetupObject() {
    this.apiService.getSetupTableObject(null).subscribe((res) => {
      this.setupObject = res;


      for (var i = 0; i < this.setupObject.subfeatureStartIndex; i++) {
        if (document.getElementById(this.setupObject.featureColumns[i].frontendName) != null) {
          if (!this.all_root_features.includes(this.setupObject.featureColumns[i].frontendName))
            this.all_root_features.push(this.setupObject.featureColumns[i].frontendName)
        }
      }
    });
  }


}