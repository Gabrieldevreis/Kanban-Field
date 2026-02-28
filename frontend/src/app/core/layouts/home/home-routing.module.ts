import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      // {
      //   path: 'calendar',
      //   loadChildren: () => import('../calendar/calendar.module').then(m => m.CalendarModule)
      // },
      // {
      //   path: 'configurations',
      //   loadChildren: () => import('../configurations/configurations.module').then(m => m.ConfigurationsModule)
      // },
      {
        path: 'boards',
        loadChildren: () => import('../../../features/boards/boards.module').then(m => m.BoardsModule)
      },
      {
        path: 'kanban/:projectId',
        loadChildren: () => import('../../../features/kanban/kanban.module').then(m => m.KanbanModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
