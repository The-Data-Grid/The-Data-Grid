import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): true | UrlTree {
      const url: string = state.url;
      return this.checkLogin(url);
  }

  checkLogin(url) {
    if(url === "/manage") {
      if(this.authService.isLoggedIn) {
        return true;
      } else {
        return this.router.parseUrl('');
      }
    } else if(url === "/generate") {
      if(!this.authService.isLoggedIn) {
        return true;
      } else {
        return this.router.parseUrl('/manage');
      }
    }
  }
  
}
