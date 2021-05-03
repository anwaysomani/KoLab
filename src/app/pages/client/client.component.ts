import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import auth from 'firebase/app';
import 'firebase/auth';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.less']
})

export class ClientComponent implements OnInit {
  entity: Array<any> = [];
  currMonYear: string;
  dates: number;
  isEmployees: boolean;
  clientList: Array<any> = [];
  employeeList: Array<any> = [];
  sitesList: Array<string> = [];
  changeSiteDropdownList: any = [];

  constructor(private db: AngularFirestore, private router: Router, private afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        console.log(user.displayName);
      } else {
        this.afAuth.signInWithPopup(new auth.auth.GoogleAuthProvider()).then((data) => {
          console.log(data);
          if (data.additionalUserInfo?.isNewUser) {
            // new user. create new entry in firestore
            const dataSet = data.additionalUserInfo;
            // db.collection('users').doc(dataSet.profile.email).set({
            //   name: dataSet.profile.name,
            //   email: dataSet.profile.email
            // });
          } else {
            // existing user. fetch data from firestore
          }
          // todo: create new user entry in firestore
          // db.collection('users').doc(data.)

        });
      }
    });

    this.db = db;
    this.isEmployees = (router.url === '/employees');
    if (this.isEmployees) {
      this.employeeDataStore();
    } else {
      this.clientDataStore();
    }
    const date = new Date();
    this.currMonYear = date.toLocaleString('default', {month: 'long'}) + ' ' + date.getFullYear();

    const dt = new Date();
    const month = dt.getMonth();
    const year = dt.getFullYear();
    this.dates = new Date(year, month, 0).getDate();

    // db.collection('mew2').doc('sample').set({tree: '01'});
    // db.collection('attendance/LA').doc('LA').set({
    //   name: 'Los Angeles',
    //   country: 'IN',
    //   old: 'USA'
    // }, {merge: true});

  }

  clientDataStore(): void { /* client data records */
    this.db.collection('clients', ref => {
      return ref; // .where('id', 'in', ['client01', 'client02']);
    }).valueChanges().subscribe((det) => {
      this.clientList = det;
      console.log(det);
    }, (err) => {
      console.log(err);
    });
  }

  employeeDataStore(): void { /* employee data records */
    this.db.collection('users', ref => {
      return ref; // .where('id', 'in', ['client01', 'client02']);
    }).valueChanges().subscribe((det) => {
      this.employeeList = det;
      this.clientAndSiteListing();
    }, (err) => {
      console.log(err);
    });
  }

  clientAndSiteListing() {
    this.clientDataStore();
    for (let i = 0; i < this.clientList.length; i++) {
      for (let j = 0; j < this.clientList[i].sites; j++) {
        this.sitesList.push(this.clientList[i].sites[j]);
      }
    }
  }

  datesInMonth(n: number): Array<any> { // construct date-in-month array
    return Array.from(Array(n), (x, i) => i).slice(1);
  }

  ngOnInit(): void {
  }

  loadDocInfo(id: string): void {
    console.log('Hello World');
  }

  /* dropdown item listing change for client */
  onClientSelectionChange(ebt: any): void { /* client selection change */
    this.changeSiteDropdownList = this.clientList[this.getClientIndex(ebt.value)].sites;
  }

  getClientIndex(name: string): number {
    for (let i = 0; i < this.clientList.length; i++) {
      if (this.clientList[i].name === name) {
        return i;
      }
    }
    return -1;
  }

  changeLocation(): void {
    console.log('Change location');
  }
}
