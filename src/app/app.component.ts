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
      text: 'CLIENTS',
      route: 'clients'
    },
    {
      text: 'EMPLOYEES',
      route: 'employees'
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

  // this.items = db.list('/restaurant_menu').valueChanges();
  // this.items.subscribe((valueOfItems: any) => {
  //   console.log(valueOfItems);
  // });

  /* sign out user */
  signOutUser(): void {
    localStorage.clear();
    this.route.navigateByUrl('/login');
  }
}
