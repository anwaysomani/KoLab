import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';


@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.less']
})
export class ClientComponent implements OnInit {
  entity: Array<any> = [];
  currMonYear: string;
  dates: number;

  constructor(private db: AngularFirestore) {
    // db.collection('clients', ref => {
    //   return ref; // .where('id', 'in', ['client01', 'client02']);
    // }).valueChanges().subscribe((det) => {
    //   this.entity = det;
    // }, (err) => {
    //   console.log(err);
    // });
    const date = new Date();
    this.currMonYear = date.toLocaleString('default', {month: 'long'}) + ' ' + date.getFullYear();

    const dt = new Date();
    const month = dt.getMonth();
    const year = dt.getFullYear();
    this.dates = new Date(year, month, 0).getDate();
  }

  datesInMonth(n: number) { // construct date-in-month array
    return Array.from(Array(n), (x, i) => i).slice(1);
  }

  ngOnInit(): void {
  }

  loadDocInfo(id: string) {

    console.log('Hello World');
  }

}
