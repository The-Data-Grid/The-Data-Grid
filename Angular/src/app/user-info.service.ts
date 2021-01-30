import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  constructor(private http:HttpClient) { }

  attemptLogin(loginObject) {
    return this.http.post('/api/login',loginObject);
  }
}
