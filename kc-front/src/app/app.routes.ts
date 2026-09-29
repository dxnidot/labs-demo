import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path: 'inicio',
    loadComponent: () =>
      import('./ui/pages/inicio/inicio.page').then((module) => module.InicioPage),
  },
  { path: '**', redirectTo: 'inicio' },
];
