import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ClientComponent} from './pages/client/client.component';
import {AttendanceComponent} from './pages/attendance/attendance.component';
import {LoginComponent} from './pages/login/login.component';

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
    path: 'login',
    component: LoginComponent
  },
  {
    path: '**',
    redirectTo: 'clients'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
