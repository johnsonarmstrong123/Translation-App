import { Routes } from '@angular/router';
import { Translator } from './components/translator/translator';
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { authGuard } from './auth-guard';

export const routes: Routes = [
  { path: '', component: Translator, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'admin', component: AdminDashboard, canActivate: [authGuard] }
];