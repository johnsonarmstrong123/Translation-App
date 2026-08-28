import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Translation } from '../../services/translation';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private translationService: Translation, private router: Router) {}

  onSignup() {
    this.errorMessage = '';
    this.loading = true;
    this.translationService.signup(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Signup failed.';
        console.error(err);
      }
    });
  }
}
