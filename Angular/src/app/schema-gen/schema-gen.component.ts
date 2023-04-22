import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { SetupObjectService } from '../setup-object.service';
import {FormControl, Validators} from '@angular/forms';
import { AuthService } from '../auth.service';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard'

@Component({
  selector: 'schema-gen',
  templateUrl: './schema-gen.component.html',
  styleUrls: ['./schema-gen.component.css']
})
export class SchemaGen implements OnInit {

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private setupObjectService: SetupObjectService,
    private toastr: ToastrService,
    private clipboard: Clipboard
  ) { }
  
  ngOnInit(): void {
    
  }
}
