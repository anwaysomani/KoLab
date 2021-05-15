import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {environment} from '../../../environments/environment';
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
      router.navigateByUrl('/clients');
    }
  }

  ngOnInit(): void {
  }

  /* authenticate new user */
  authenticateUser(): void {
    // sign in user with email and password
    // check db for document with user object
    // if not exists, display no user
    // if user, then check environment for property display for admin/sub-admins/contractor
    // if admin perm, then display for screen
    // else, take to error page

    this.auth.signInWithEmailAndPassword(this.form.email, this.form.pass).then((data) => {
      // get firestore object
      // check if admin level allowed
      this.db.collection('users', ref => {
        // @ts-ignore
        return ref.where('uid', '==', data.user.uid);
      }).valueChanges().subscribe((det) => {
        // @ts-ignore
        if (environment.allowAdmin && det[0].designation === 'Admin') {// redirect to home page
          localStorage.setItem('access', '1');
          localStorage.setItem('user', JSON.stringify(det[0]));
          this.router.navigateByUrl('/clients');
        }
      }, (err) => {
        console.log(err);
      });
    });
  }
}
