import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { SetupObjectService, IDX_OF_ID_COL_IDXS, IDX_OF_NON_ID_COL_IDXS } from '../../setup-object.service';
import { environment } from '../../../environments/environment';
import { SetupObject, TableObject } from '../../responses'
const USE_FAKE_DATA = environment.useFakeData;

@Component({
  selector: 'app-metadata-panel',
  templateUrl: './metadata-panel.component.html',
  styleUrls: ['./metadata-panel.component.css']
})
export class MetadataPanelComponent implements OnInit {
  
  auditMetadata = {};
  setupObject;

  constructor(private apiService: ApiService, private setupObjectService: SetupObjectService) { }

  ngOnInit(): void {
    this.getSetupTableObject()
  }

  getSetupTableObject() {
    this.apiService.getSetupObject().subscribe((res) => {
      USE_FAKE_DATA ? this.setupObject = SetupObject : this.setupObject = res;
      this.auditMetadata = this.setupObjectService.getAllAuditItemRelatedColumns(this.setupObject);
      console.log("audit metadata:", this.auditMetadata)
    });
  }


}
