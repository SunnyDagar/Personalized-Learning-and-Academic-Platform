import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    const expectedRole = route.data['expectedRole'];

    // Case 1: No token present
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Case 2: Wrong role access attempt
    if (expectedRole && userRole !== expectedRole) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    // Case 3: Correct role
    // NOTE: Client-side routing guards are for UX convenience only. 
    // The server remains the real authority; backend endpoints independently validate 
    // JWT signatures and permissions on every API request.
    return true;
  }
}

// .
