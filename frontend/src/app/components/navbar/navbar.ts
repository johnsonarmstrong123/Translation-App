import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Translation } from '../../services/translation';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  email = '';
  isAdmin = false;
  loggedIn = false;

  constructor(private translationService: Translation, private router: Router) {}

  ngOnInit() {
    this.loggedIn = this.translationService.isLoggedIn();
    if (this.loggedIn) {
      this.translationService.getMe().subscribe({
        next: (res) => {
          this.email = res.email;
          this.isAdmin = res.is_admin;
        },
        error: () => {
          // Token might be invalid/expired
          this.loggedIn = false;
        }
      });
    }
  }

  onLogout() {
    this.translationService.logout();
    this.router.navigate(['/login']);
  }
}
