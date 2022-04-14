import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  loginStatusChange: Subject<boolean> = new Subject<boolean>();
  sessionObjectChange: Subject<string> = new Subject<string>();

  constructor() {
    this.loginStatusChange.subscribe((value) => {
      this.isLoggedIn = value;
    })

    this.sessionObjectChange.subscribe((value) => {
      // Don't need to stringify because it comes from the API as a string
      this.sessionObject = JSON.parse(value);
      localStorage.setItem('sessionObject', value);
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

  getSessionObject() {
    try {
      return JSON.parse(localStorage.getItem('sessionObject'));
    } catch(err) {
      this.isLocalStorageBlocked = true;
      return null;
    }
  }

  isLocalStorageBlocked = false;

  sessionObject = this.getSessionObject();
  
  isLoggedIn = this.getIsLoggedIn();
}
