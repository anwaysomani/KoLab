import {Component} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {Observable} from 'rxjs';
import {Router} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'KoLab';
  private items: any;

  routes = [
    {
      text: 'Clients',
      route: 'clients'
    },
    {
      text: 'Employees',
      route: 'employees'
    },
  ];
  router: any;

  constructor(private db: AngularFireDatabase, private route: Router) {
    this.router = route.url;
    // this.items = db.list('/restaurant_menu').valueChanges();
    // this.items.subscribe((valueOfItems: any) => {
    //   console.log(valueOfItems);
    // });
  }
}
