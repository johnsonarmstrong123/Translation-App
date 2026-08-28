import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Translation } from '../../services/translation';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private translationService: Translation, private router: Router) {}

  onLogin() {
    console.log('Login attempt:', this.email, this.password);
    this.errorMessage = '';
    this.loading = true;
    this.translationService.login(this.email, this.password).subscribe({
      next: (res) => {
        console.log('Login success:', res);
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.log('Login error:', err);
        this.loading = false;
        this.errorMessage = 'Incorrect email or password.';
      }
    });
  }
}
