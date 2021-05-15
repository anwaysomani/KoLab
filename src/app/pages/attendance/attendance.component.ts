import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.less']
})
export class AttendanceComponent implements OnInit {
  reason = '';
  date: number;
  activeUser: any;
  uid = '';

  constructor(private db: AngularFirestore) {
    this.date = (new Date()).getDate();
  }

  ngOnInit(): void {
    // @ts-ignore
    this.uid = JSON.parse(localStorage.getItem('user')).uid;
    this.db.doc(`/users/${this.uid}`).valueChanges().subscribe((det) => {
      this.activeUser = det;
    });
  }

  /* mark user status */
  markStatus(status: string): void {
    const currTime = new Date();
    const x = {
      date: this.date,
      time: currTime.getHours() + ':' + currTime.getMinutes() + ':' + currTime.getSeconds(),
      site: this.activeUser.activeSite,
      status,
      reason: '',
    };
    if (status === 'On Leave') {
      x.reason = this.reason;
      this.reason = '';
    }

    this.activeUser.attendance.push(x);
    this.db.doc(`/users/${this.uid}`).update({
      attendance: this.activeUser.attendance
    });
  }
}
