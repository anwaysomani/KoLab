import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ClientComponent} from './pages/client/client.component';
import {AttendanceComponent} from './pages/attendance/attendance.component';

const routes: Routes = [
  {
    path: 'clients',
    component: ClientComponent
  },
  {
    path: 'employees',
    component: ClientComponent
  },
  {
    path: 'attendance',
    component: AttendanceComponent
  },
  {
    path: '**',
    redirectTo: 'employees'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
