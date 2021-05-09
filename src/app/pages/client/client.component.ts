import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import 'firebase/auth';
import {HttpClient} from '@angular/common/http';

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
  userDataSet: any = {};
  entity2: string;
  weekDay: Array<string> = ['Sun', 'Mon', 'Tue', 'Web', 'Thu', 'Fri', 'Sat'];
  selectedClient = {
    name: '',
    sites: [],
    isSelected: false
  };
  newSiteData = {
    name: '',
    address: '',
    pincode: ''
  };

  valueOld = {
    '02-05-2021': [
      {
        'sign-out': '15:00',
        'sign-in': '10:00',
        site: 'Chicago'
      },
      {
        'sign-out': '19:00',
        site: 'Orlando',
        'sign-in': '17:00'
      }
    ],
    '01-05-2021': [
      {
        'sign-in': '11:00',
        site: 'Orlando',
        'sign-out': '14:00'
      },
      {
        'sign-out': '19:00',
        'sign-in': '15:00',
        site: 'Chicago'
      }
    ]
  };
  keyList: Array<string> = Object.keys(this.valueOld);
  employee = {
    username: '',
    emailAddress: '',
    designation: ''
  };

  constructor(private db: AngularFirestore, private router: Router, private afAuth: AngularFireAuth, private http: HttpClient) {

    console.log(this.valueOld);
    // this.afAuth.authState.subscribe(user => {
    //   if (user) {
    //     console.log(user.uid);
    //   } else {
    //     this.afAuth.signInWithEmailAndPassword('aksar1@mail.com', 'anway123').then((data) => {
    //       console.log(data);
    //       console.log(afAuth.user);
    //     });
    //
    //     //   // todo: create new user entry in firestore
    //     //   // db.collection('users').doc(data.)
    //     //
    //     // });
    //   }
    // });
    // this.getEmployeeAttendance();


    this.entity2 = '<tbody><tr><th colspan="5">01-May, 2021</th></tr><tr><th scope="row">1</th><td>01-May, 2021</td><td>01-May, 2021</td><td>01-May, 2021</td></tr></tbody>';

    // uid: IzcKvAIXDrdqaS0qVHKcBYthyDi1

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

  getEmployeeAttendance() {
    // IzcKvAIXDrdqaS0qVHKcBYthyDi1
    this.db.collection('attendance')
      .doc('IzcKvAIXDrdqaS0qVHKcBYthyDi1').get().subscribe((det) => {
      console.log(det.data());

      this.userDataSet = det.data();
    });
  }

  clientDataStore(): void { /* client data records */
    this.db.collection('clients', ref => {
      return ref; // .where('id', 'in', ['client01', 'client02']);
    }).valueChanges().subscribe((det) => {
      this.clientList = det;
      if (this.clientList.length > 0) {
        this.clientList[0].isSelected = true;
        this.selectClientItem(this.clientList[0]);
      }
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

  /* get client & their associated sites listing with employees for each site */
  clientAndSiteListing(): void {
    this.clientDataStore();
    for (let i = 0; i < this.clientList.length; i++) {
      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < this.clientList[i].sites.length; j++) {
        this.clientList[i].sites[j].employees = {
          second: [],
          third: [],
        };
        // get employees in list
        this.db.collection('users', ref => {
          return ref.where('activeSite', '==', this.clientList[i].sites[j].refNo); // replace with site-id
        }).valueChanges().subscribe((emps: Array<any>) => {
          // tslint:disable-next-line:prefer-for-of
          for (let k = 0; k < emps.length; k++) {
            if (emps[k].designation === 2) {
              this.clientList[i].sites[i].employees.second.push(emps[k].name);
            } else if (emps[k].designation === 3) {
              this.clientList[i].sites[i].employees.third.push(emps[k].name);
            }
          }
          console.log(this.clientList[i].sites[j]);
          this.sitesList.push(this.clientList[i].sites[j]);
        }, (err) => {
          console.log(err);
        });
      }
    }
  }

  constructArr(entity: any): string {
    // console.log('Ball Balle');
    // console.log(entity);
    return ''; //  entity.join(', ');
  }

  datesInMonth(n: number): Array<any> { // construct date-in-month array
    return Array.from(Array(n), (x, i) => i).slice(1);
  }

  ngOnInit(): void {
  }

  loadDocInfo(item: any): void {
    item.isSelected = true;

    if (this.isEmployees) {
      console.log();
    } else {
      // clients
      this.selectClientItem(item);
    }

    this.getEmployeeAttendance();
    // todo: get realtime database entry for active site
    // todo: get firestore entry for attendance for last 7-days

    // provide week view for calendar option for user to select

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

  getWeekDayText(str: string): string { /* get day as text */
    return this.weekDay[new Date(str).getDay()];
  }

  splitText(str: string): string { /* split date */
    return str.split('-')[0];
  }

  renderList(item: string): Array<any> { /* render attendance listing */
    // @ts-ignore
    return this.valueOld[item];
  }

  selectClientItem(client: any): void {
    this.selectedClient.isSelected = false;
    this.selectedClient = {
      name: '',
      sites: [],
      isSelected: false
    };

    // get employees with active employees
    this.db.collection('users', ref => {
      return ref.where('activeSite', '==', 'Chicago, Orlando - 431601');
    }).valueChanges().subscribe((det) => {
      console.log(det);
    }, (err) => {
      console.log(err);
    });

    if (!client.sites || client.sites.length < 1) {
      // display add site ref
      console.log('Balle');
    }

    this.selectedClient = client;
  }

  /* add new user popup Add click */
  addUser(): void { // name, email address, designation
    this.addUserService([this.employee.username, this.employee.emailAddress, this.employee.designation]).then((data) => {
      console.log(data);
    });
  }

  // tslint:disable-next-line:typedef
  async addUserService(mod: Array<string>) {
    return await this.http.post('http://us-central1-kolab-04.cloudfunctions.net/addUser', {
      name: mod[0],
      email: mod[1],
      designation: mod[2],
    }).toPromise();
  }
}
