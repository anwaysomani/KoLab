import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {finalize} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Router} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {environment} from '../../../environments/environment';

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
  entireDate: string;
  fb: string | undefined;
  downloadURL: Observable<string> | undefined;

  constructor(private db: AngularFirestore, private storage: AngularFireStorage, private route: Router, private titleService: Title) {
    // @ts-ignore
    this.uid = JSON.parse(localStorage.getItem('user')).uid;
    this.db.doc(`/users/${this.uid}`).valueChanges().subscribe((det) => {
      this.activeUser = det;
    });

    const date = new Date();
    this.entireDate = date.getDate() + '/' + date.getUTCMonth() + '/' + date.getFullYear();
    this.date = date.getDate();
  }

  ngOnInit(): void {
    this.titleService.setTitle('Employee Playground | ' + environment.brand);
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

  // tslint:disable-next-line:typedef
  onFileSelected(event: any) {
    const n = Date.now();
    const file = event.target.files[0];
    const filePath = `${this.activeUser.activeSite}/${n}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(`${this.activeUser.activeSite}/${n}`, file);
    task.snapshotChanges().pipe(finalize(() => {
        this.downloadURL = fileRef.getDownloadURL();
        this.downloadURL.subscribe(url => {
          if (url) {
            this.fb = url;
          }
        });
      })
    );
  }

  /* sign out user */
  signOutUser(): void {
    localStorage.clear();
    this.route.navigateByUrl('/login');
  }
}
