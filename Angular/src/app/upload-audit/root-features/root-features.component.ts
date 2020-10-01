import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';


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

  constructor(
    public dialogRef: MatDialogRef<RootFeaturesComponent>,
    @Inject(MAT_DIALOG_DATA)public data: Data) {}

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
    var featuresLength = this.getFeaturesLength();
    console.log(featuresLength + " is the features length");

    for (var i = 0; i <= featuresLength; ++i) {
      console.log("rotate through one time")
      const feature = document.getElementById(this.data[i].name + " checkbox") as HTMLInputElement;
      if (!feature.checked) {
        this.data[i].included = false;
      }

      const subFeaturesLength = this.getSubFeaturesLength(this.data[i]);
      for (var j = 0; j <= subFeaturesLength; j++) {
        const subFeature = document.getElementById(this.data[i].features[j].name + " checkbox") as HTMLInputElement;
        if (!subFeature.checked) {
          this.data[i].features[j].included = false;
        }
      }

    }
    this.close();

  }

  isChecked = false;

  status = "template";

  close() {
    this.dialogRef.close();
  }

  changeStatus(toggleOption) {
    this.status = toggleOption;
  }


}
