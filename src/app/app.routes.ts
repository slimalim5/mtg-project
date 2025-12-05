import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'game',
    loadComponent: () => import('./components/game-dashboard/game-dashboard').then(m => m.GameDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/game',
    pathMatch: 'full'
  }
];