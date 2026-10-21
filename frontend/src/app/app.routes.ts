import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Patronly',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'studio/edit',
    title: 'Build your studio · Patronly',
    loadComponent: () =>
      import('./pages/studio-builder/studio-builder').then((m) => m.StudioBuilder),
  },
  { path: 'studio/new', redirectTo: 'studio/edit' },
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Patronly · Meet the artist. Commission the work.',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'featured',
        title: 'The slow season · Patronly',
        loadComponent: () => import('./pages/featured/featured').then((m) => m.Featured),
      },
      {
        path: 'mediums',
        title: 'All mediums · Patronly',
        loadComponent: () => import('./pages/mediums/mediums').then((m) => m.Mediums),
      },
      {
        path: 'mediums/:name',
        title: 'Browse · Patronly',
        loadComponent: () => import('./pages/medium/medium').then((m) => m.Medium),
      },
      {
        path: 'artists/:id',
        title: 'Studio · Patronly',
        loadComponent: () => import('./pages/studio/studio').then((m) => m.Studio),
      },
      {
        path: 'artists/:id/work',
        title: 'Past work · Patronly',
        loadComponent: () => import('./pages/gallery/gallery').then((m) => m.Gallery),
      },
      {
        path: 'saved',
        title: 'Saved · Patronly',
        loadComponent: () => import('./pages/saved/saved').then((m) => m.Saved),
      },
      {
        path: 'messages',
        title: 'Messages · Patronly',
        loadComponent: () => import('./pages/messages/messages').then((m) => m.Messages),
      },
      {
        path: 'messages/:threadId',
        title: 'Messages · Patronly',
        loadComponent: () => import('./pages/messages/messages').then((m) => m.Messages),
      },
      {
        path: 'dashboard',
        title: 'Dashboard · Patronly',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'search',
        title: 'New search · Patronly',
        loadComponent: () => import('./pages/search/search').then((m) => m.Search),
      },
      {
        path: '**',
        title: 'Not found · Patronly',
        loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
