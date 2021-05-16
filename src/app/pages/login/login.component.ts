import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {
  form = {
    email: '',
    pass: ''
  };

  constructor(private auth: AngularFireAuth, private db: AngularFirestore, private router: Router) {
    if (localStorage.getItem('access') === '1') {
      this.conditionalRedirect();
    }
  }

  ngOnInit(): void {
  }

  /* authenticate new user */
  authenticateUser(): void {
    this.auth.signInWithEmailAndPassword(this.form.email, this.form.pass).then((data) => {
      this.db.collection('users', ref => {
        // @ts-ignore
        return ref.where('uid', '==', data.user.uid);
      }).valueChanges().subscribe((det) => {
        localStorage.setItem('access', '1');
        localStorage.setItem('user', JSON.stringify(det[0]));
        this.conditionalRedirect();
      }, (err) => {
        console.log(err);
      });
    });
  }

  /* conditionally redirect user based on active role */
  conditionalRedirect(): void {
    if (JSON.parse(localStorage.getItem('user') as string).designation === 'Admin') {
      this.router.navigateByUrl('/clients');
    } else {
      this.router.navigateByUrl('/attendance');
    }
  }
}
