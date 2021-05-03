import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.less']
})
export class AttendanceComponent implements OnInit {

  constructor(private db: AngularFirestore) {
    const date = new Date();
    const currentDate = date.getDate() + '-' + date.getMonth() + '-' + date.getUTCFullYear();
    // db.collection('attendance').doc(currentDate).set({
    //   'aksar@mail.com': {
    //     employee: 'aksar@mail.com',
    //     status: 3,
    //     reason: 'On unplanned leave'
    //   },
    // });
  }

  ngOnInit(): void {
  }

}
