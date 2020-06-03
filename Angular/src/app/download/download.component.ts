import { Component, OnInit } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';


interface Audit {
  value: string;
  viewValue: string;
}

interface Water {
  value: string;
  viewValue: string;
}


@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.css']
})
export class DownloadComponent implements OnInit {
  currentValue = "";
  fileValue = "CSV";

  changeFileValue(newValue) {
    this.fileValue = newValue;
  } 

  audits: Audit[] = [
    {value: "water", viewValue: "Water"},
    {value: "food", viewValue: "Food"},
    {value: "electricity", viewValue: "Electricity"},
    {value: "other", viewValue: "Other"}
  ]

  water: Water[] = [
    {value: "gpf", viewValue: "Gallons Per Flush (GPF)"},
    {value: "basinbrand", viewValue: "Basin Brand"},
    {value: "condition", viewValue: "Stall Condition"},
    {value: "flushometerbrand", viewValue:"Flushometer Brand"}
  ]

  // audits Audit[] = {
  //     {value: 'toilet', view}
  // };

  constructor() { }

  ngOnInit(): void {
  }

}
