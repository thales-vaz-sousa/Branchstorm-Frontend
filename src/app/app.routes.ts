import { type Routes } from '@angular/router';
import { sessionGuard } from '@core/auth/session.guard';

export const routes: Routes = [
  {
    path: 'entrar',
    data: { titleKey: 'login.enter' },
    loadComponent: () =>
      import('@features/auth/pages/login/login.page').then((module) => module.LoginPage),
  },
  {
    path: '',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('@core/layout/app-shell.component').then((module) => module.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'equipes',
      },
      {
        path: 'sobre',
        data: { titleKey: 'nav.about' },
        loadComponent: () =>
          import('@features/about/about.page').then((module) => module.AboutPage),
      },
      {
        path: 'equipes',
        data: { titleKey: 'teams.title' },
        loadComponent: () =>
          import('@features/teams/pages/teams/teams.page').then((module) => module.TeamsPage),
      },
      {
        path: 'equipes/:teamCode',
        data: { titleKey: 'detail.eyebrow' },
        loadComponent: () =>
          import('@features/teams/pages/team-detail/team-detail.page').then(
            (module) => module.TeamDetailPage,
          ),
      },
      {
        path: 'ideias/:rootCode',
        data: { titleKey: 'canvas.treeLabel' },
        loadComponent: () =>
          import('@features/ideas/pages/idea-workspace/idea-workspace.page').then(
            (module) => module.IdeaWorkspacePage,
          ),
      },
      {
        path: 'ui',
        data: { titleKey: 'ui.title' },
        loadComponent: () =>
          import('@features/ui-showcase/ui-showcase.page').then((module) => module.UiShowcasePage),
      },
      {
        path: 'painel',
        pathMatch: 'full',
        redirectTo: 'equipes',
      },
      {
        path: 'usuarios',
        pathMatch: 'full',
        redirectTo: 'equipes',
      },
      {
        path: 'ideias',
        pathMatch: 'full',
        redirectTo: 'equipes',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'equipes',
  },
];
