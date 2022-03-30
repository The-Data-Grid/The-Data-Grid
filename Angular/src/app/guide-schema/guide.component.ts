import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard'

@Component({
  selector: 'guide-schema',
  templateUrl: './guide.component.html',
  styleUrls: ['../guide/guide.component.css'],
  providers: []

})
export class GuideSchemaComponent implements OnInit {

  constructor(
    private toastr: ToastrService,
    private clipboard: Clipboard
  ) { }

  copyToClipboard(data: string) {
    this.clipboard.copy(data);
    this.toastr.success('Copied to clipboard')
  }

  schemaFormat = JSON.stringify({ 
    "itemOrObservation": "Item",

    "name": "Waste Bin",
    "information": "Unique alphanumeric bin identifier", // optional, defaults to null
    
    "sqlType": "TEXT", // required
    "referenceType": "item-id", // required
    "presetValues": null,
    "isNullable": false // required
  }, null, 4)

  exampleFormat = JSON.stringify({
    "frontendName": "Victor Stanley Waste Bin", // required
    "information": "A Compost, Landfill, or Recycle Waste Bin", // optional, default null
    "observableItem" : {
        "requiredItem": [
            {
                "name": "item_entity", 
                "isID": true, 
                "isNullable": false, 
                "frontendName": "Entity of Cluster", 
                "information": null
            }
        ],
        "realGeo": {
            "itemName": "item_vs_bin",
            "tableName": "location_point",
            "columnName": "data_point"
        },
        "frontendName": "Victor Stanley Waste Bin",
        "creationPrivilege": 2
    },
    "authorization": {
        "queryPrivilege": "guest",
        "queryRole": null,
        "uploadPrivilege": "user",
        "uploadRole": "auditor"
    }
}, undefined, 4)

  ngOnInit() {
  }
}
