import {Component} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {NavigationEnd, Router} from '@angular/router';
import {environment} from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'KoLab';
  routes = [
    {
      name: 'Clients',
      route: 'clients'
    },
    {
      name: 'Employees',
      route: 'employees'
    },
    {
      name: 'Posts',
      route: 'posts'
    },
  ];
  router: any;
  brand: string;
  allow: boolean;

  constructor(private db: AngularFireDatabase, private route: Router) {
    this.brand = environment.brand;
    route.events.subscribe((data) => {
      if (data instanceof NavigationEnd) {
        this.router = route.url;
      }
    });
    this.allow = localStorage.getItem('access') === '1';
  }

  /* sign out user */
  signOutUser(): void {
    localStorage.clear();
    this.route.navigateByUrl('/login');
  }
}
