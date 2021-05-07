import {Component} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {NavigationEnd, Router} from '@angular/router';

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
  private items: any;

  constructor(private db: AngularFireDatabase, private route: Router) {
    route.events.subscribe((data) => {
      if (data instanceof NavigationEnd) {
        this.router = route.url;
      }
    });
  }

  // this.items = db.list('/restaurant_menu').valueChanges();
  // this.items.subscribe((valueOfItems: any) => {
  //   console.log(valueOfItems);
  // });
}
