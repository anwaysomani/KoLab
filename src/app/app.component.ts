import {Component} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {NavigationEnd, Router} from '@angular/router';
import {environment} from '../environments/environment';
import {NgxSpinnerService} from 'ngx-spinner';

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
  http: any;

  constructor(private db: AngularFireDatabase, private route: Router, private spinner: NgxSpinnerService) {
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
    return await this.http.post(environment.funcUrl + 'attendanceRegularize', {
      
    }).toPromise();
  }
  xyz():void{
      this.runCronJob().then(d=>{
        console.log("Successfully called");
      });
  }
}
