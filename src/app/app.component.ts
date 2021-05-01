import {Component} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'KoLab';
  private items: any;

  constructor(private db: AngularFireDatabase) {
    // this.items = db.list('/restaurant_menu').valueChanges();
    // this.items.subscribe((valueOfItems: any) => {
    //   console.log(valueOfItems);
    // });
  }
}
