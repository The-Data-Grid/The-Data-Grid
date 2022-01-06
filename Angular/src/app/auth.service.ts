import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  sessionObject = JSON.parse(localStorage.getItem('sessionObject'));
  
  isLoggedIn = this.getIsLoggedIn();
  
  loginStatusChange: Subject<boolean> = new Subject<boolean>();
  sessionObjectChange: Subject<string> = new Subject<string>();

  constructor() {
    this.loginStatusChange.subscribe((value) => {
      this.isLoggedIn = value;
    })

    this.sessionObjectChange.subscribe((value) => {
      // Don't need to stringify because it comes from the API as a string
      localStorage.setItem('sessionObject', value);
      this.sessionObject = JSON.parse(value);
    })
   }

  setSession(sessionObject) {
    this.sessionObjectChange.next(sessionObject);
    this.loginStatusChange.next(this.getIsLoggedIn());
  }

  getIsLoggedIn() {
    return !(this.sessionObject === null);
  }

  clearSessionData() {
    localStorage.removeItem('sessionObject');
    this.sessionObject = null;
    this.loginStatusChange.next(this.getIsLoggedIn());
  }

}
