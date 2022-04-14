import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard'


@Component({
  selector: 'guide-upload',
  templateUrl: './guide.component.html',
  styleUrls: ['../guide/guide.component.css'],
  providers: []

})
export class GuideUploadComponent implements OnInit {

  constructor(
    private toastr: ToastrService,
    private clipboard: Clipboard
  ) { }

  copyToClipboard(data: string) {
    this.clipboard.copy(data);
    this.toastr.success('Copied to clipboard')
  }

  submissionObject = `{
    items: {
        create: [createItemObject, ...],
        update: [updateItemObject, ...],
        delete: [deleteItemObject, ...], 
        requestPermanentDeletion: [deleteItemObject, ...]
    },
    observations: {
        create: [createObservationObject, ...],
        update: [updateObservationObject, ...],
        delete: [deleteObservationObject, ...]
    }
}` // This indent is important so the JSON is formatted correctly

  endpoint = 'https://api.thedatagrid.org/audit/submission'

  authHeader = 'X-API-KEY: api-key-goes-here'

  ngOnInit() {
  }
}
