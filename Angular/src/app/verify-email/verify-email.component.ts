import { FnParam } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DialogComponent } from '.././login-dialog/login-dialog.component';


interface VerifyObject {
  email: string
  token: string
}

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})


export class VerifyEmailComponent implements OnInit {

  constructor(private route: ActivatedRoute, private apiService: ApiService, private router:Router, private dialog: MatDialog) { }

  data;
  isSuccess:boolean;
  verify:VerifyObject;

  isVerified:boolean;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params => {
      this.verify = {
        email: params.email,
        token: params.token
      }
      console.log(this.verify);
      // this.apiService.verifyEmail(this.data).subscribe((res) => {
      //   console.log(res);
      // });
    }))
      this.apiService.verifyEmail(this.verify).subscribe((res) => {
        console.log(res);
        console.log("ah");
        if (res == "Email verified") {
          this.isVerified = true;
        }
        else {
          this.isVerified = false;
          this.router.navigate(['./']);

        }
      });

  }

  signIn() {
    this.router.navigate(['./']);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    this.dialog.open(DialogComponent, dialogConfig);  
  }


}
