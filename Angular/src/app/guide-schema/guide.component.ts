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
    a: 1,
    b: 2
  }, null, 4)

  exampleFormat = JSON.stringify({
    a: 1,
    b: 2
  }, undefined, 4)

  ngOnInit() {
  }
}
