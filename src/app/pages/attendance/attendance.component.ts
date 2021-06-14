import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {finalize} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Router} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';

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
  x = false;
  currentPincode = 0;
  newVisitor = '';
  visitorList: Array<any> = [];

  constructor(private db: AngularFirestore, private storage: AngularFireStorage, private route: Router, private titleService: Title,
              private http: HttpClient) {
    // @ts-ignore
    this.uid = JSON.parse(localStorage.getItem('user')).uid;
    this.db.doc(`/users/${this.uid}`).valueChanges().subscribe((det) => {
      this.activeUser = det;
      this.getVisitorListing();
    });

    const date = new Date();
    this.entireDate = date.getDate() + '/' + date.getUTCMonth() + '/' + date.getFullYear();
    this.date = date.getDate();
  }

  ngOnInit(): void {
    this.titleService.setTitle('Employee Playground | ' + environment.brand);
    this.getCurrentPincode();
  }

  /* check condition for button enable */
  getCurrentPincode(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + position.coords.latitude
          + ',' + position.coords.longitude + '&key=' + environment.googleApiKey).toPromise().then((data) => {
          // @ts-ignore
          this.currentPincode = data.results[0].address_components.find(addr => addr.types[0] === 'postal_code').short_name;
        });
      });
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }

  /* check current location */
  checkActionEnableCondition(): boolean {
    if (this.activeUser) {
      return this.currentPincode === this.activeUser.activeSite.pincode;
    }
    return true;
  }

  /* mark user status */
  markStatus(status: string): void {
    const currTime = new Date();
    const x = {
      date: this.date,
      time: currTime.getHours() + ':' + currTime.getMinutes(),
      site: this.activeUser.activeSite,
      status,
      reason: ''
    };
    if (status === 'On Leave') {
      x.reason = this.reason;
      this.reason = '';
    }
    if (status === 'Sign Out') {
      // tslint:disable-next-line:radix
      const calcTime = this.activeUser.totalTimeToday + ((new Date()).getHours() - parseInt(this.activeUser.attendance[this.activeUser.attendance.length - 1].time.split(':')[0])); // calculate total time spent
      this.db.doc(`/users/${this.uid}`).update({ // assign to totalTimeToday
        totalTimeToday: calcTime,
      });
    }

    if (this.activeUser.attendance !== undefined) {
      this.activeUser.attendance.push(x);
    } else {
      this.activeUser.attendance = [x];
    }

    this.db.doc(`/users/${this.uid}`).update({
      attendance: this.activeUser.attendance,
      currentStatus: x.status
    });
  }

  // tslint:disable-next-line:typedef
  onFileSelected(event: any, isMaterial: boolean) {
    const n = Date.now();
    const file = event.target.files[0];
    const filePath = `${this.activeUser.activeSite}/${n}`;
    const fileRef = this.storage.ref(filePath);
    const partialPath = isMaterial ? 'material' : 'progress';
    const task = this.storage.upload(`${this.activeUser.activeSite.site + ', ' + this.activeUser.activeSite.client}/${partialPath}/${n}`, file);
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

  /* current user status */
  getCurrentUserStatus(): string {
    return (this.activeUser && this.activeUser.currentStatus) ? this.activeUser.currentStatus : 'Sign Out';
  }

  /* check enable condition for upload buttons */
  checkUploadButtonCondition(): boolean {
    return !this.activeUser.activeSite && !this.activeUser.activeSite.site && this.activeUser.activeSite.site.length < 1;
  }

  /* get visitors list */
  getVisitorListing(): void {
    this.db.doc(`clients/${this.activeUser.activeSite.client}`).get().subscribe((d) => {
      // @ts-ignore
      const y = d.data().sites.findIndex((er) => {
        return er.name === this.activeUser.activeSite.site;
      });
      // @ts-ignore
      this.visitorList = d.data().sites[y].visitors;
    });
  }

  /* add visitor */
  visitorEntry(name: string, status: boolean, index: number): void {
    const date = new Date();

    if (status) {
      const x = {
        name,
        status: 'In',
        signInTime: date.getHours() + ':' + date.getMinutes(),
        date: new Date().getDate()
      };
      this.visitorList.push(x);
    } else {
      // @ts-ignore
      this.visitorList[index].status = 'Out';

      // @ts-ignore
      this.visitorList[index].signOutTime = date.getHours() + ':' + date.getMinutes();
    }

    this.db.doc(`clients/${this.activeUser.activeSite.client}`).get().subscribe((d) => {
      // @ts-ignore
      const y = d.data().sites.findIndex((er) => {
        return er.name === this.activeUser.activeSite.site;
      });

      // @ts-ignore
      const sitesArr = d.data().sites;
      sitesArr[y].visitors = this.visitorList;

      this.db.doc(`/clients/${this.activeUser.activeSite.client}`).update({
        sites: sitesArr,
      });
    });

    this.newVisitor = '';
  }
}
