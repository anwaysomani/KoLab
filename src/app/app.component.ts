import {Component} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {NavigationEnd, Router} from '@angular/router';
import {environment} from '../environments/environment';
import {NgxSpinnerService} from 'ngx-spinner';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'KoLab';
  routes = [
    {
      name: 'Clients',
      route: 'clients'
    },
    {
      name: 'Employees',
      route: 'employees'
    },
  ];
  router: any;
  brand: string;
  allow: boolean;

  constructor(private db: AngularFireDatabase, private http: HttpClient,private route: Router, private spinner: NgxSpinnerService) {
    this.spinner.show();

    this.brand = environment.brand;
    route.events.subscribe((data) => {
      if (data instanceof NavigationEnd) {
        this.router = route.url;
      }
    });
    this.allow = localStorage.getItem('access') === '1';
  }

  /* sign out user */
  signOutUser(): void {
    localStorage.clear();
    this.route.navigateByUrl('/login');
  }

  /* run cronJob */
  async runCronJob() {
    var reqOpts = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        params: new HttpParams()
      };
      return new Promise(resolve => {
        this.http.get(environment.funcUrl + 'attendanceRegularize', reqOpts).subscribe(
          data => { 
                resolve(data); 
          }, 
          err => {
                 console.log("Some error");
          }
        );
      });
    /* return await this.http.post(environment.funcUrl + 'attendanceRegularize', {
      
    }).toPromise(); */
  }
  xyz():void{
      this.runCronJob().then(d=>{
        console.log("Successfully called");
      });
  }
}
