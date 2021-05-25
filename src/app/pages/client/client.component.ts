import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import 'firebase/auth';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Title} from '@angular/platform-browser';
import {AngularFireStorage} from '@angular/fire/storage';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.less']
})

export class ClientComponent implements OnInit {
  @ViewChild('addUserModal') closeAddExpenseModal: ElementRef | undefined;

  entity: Array<any> = [];
  currMonYear: string;
  dates: number;
  isEmployees: boolean;
  clientList: Array<any> = [];
  employeeList: Array<any> = [];
  sitesList: Array<string> = [];
  changeSiteDropdownList: any = [];
  activeTab = 'activeEmployee';
  selectedItem?: any;
  weekDay: Array<string> = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  selectedClient = {
    name: '',
    sites: [],
    isSelected: false
  };

  selectedUser = {
    display: false,
    isSelected: true,
    activeSite: '',
    sites: [],
    uid: '',
  };

  updateSite = {
    client: '',
    site: '',
  };

  newSiteData = {
    name: '',
    address: '',
    pincode: ''
  };
  loader = {
    addUserLoader: false,
    pageLoader: false,
    addClientLoader: false,
  };
  client = {
    name: '',
  };

  keyList: Array<string> = [];
  employee = {
    username: '',
    emailAddress: '',
    designation: ''
  };
  addUserError = false;
  selectedCategory = 'Admin';
  userTypes: Array<any> = [];
  allow: boolean;
  searchText = '';
  prevClientItem = '';
  prevEmployeeItem = '';
  itemClicked = false;
  displayEmployeeDetail = false;
  selectedSiteEmployeeList: Array<any> = [];
  selectedSiteContractorList: Array<any> = [];
  selectedSiteEmployee = '';
  employeeAttendance: Array<any> = [];
  selectedSiteEmployeeStatus = '';
  currentDate = 1;

  images = [
    {
      image: '',
      thumbImage: 'https://sanjayv.github.io/ng-image-slider/contents/assets/img/slider/5.jpg',
      title: 'Hummingbirds are amazing creatures',
      data: 'Nulla vitae elit libero, a pharetra augue mollis interdum.',
      name: 'firstimage'
    }
  ];
  imgName: string = this.images[0].name;
  imgNumber = 1;
  imgLength: number = this.images.length;


  materialView = false;
  imgHref?: any = '';
  imgId = 0;
  allImageListing: Array<string> = [];
  materialImagesDisplay = false;
  progressImagesDisplay = false;
  displayInfoView = false;
  defaultMaterialImage = '';
  defaultProgressImage = '';

  constructor(private db: AngularFirestore, private router: Router, private afAuth: AngularFireAuth,
              private http: HttpClient, private titleService: Title, private storage: AngularFireStorage) {
    this.allow = localStorage.getItem('access') === '1';
    if (!this.allow) {
      router.navigateByUrl('/login');
    }

    this.loader.pageLoader = true;
    this.currentDate = new Date().getDate();
    this.db = db;
    this.isEmployees = (router.url === '/employees');
    if (this.isEmployees) {
      this.userTypes = environment.userTypes;
      this.getUserListing();
      this.titleService.setTitle('Employees | ' + environment.brand);
    } else {
      this.clientDataStore();
      this.titleService.setTitle('Clients | ' + environment.brand);
    }
    const date = new Date();
    this.currMonYear = date.toLocaleString('default', {month: 'long'}) + ' ' + date.getFullYear();
    const dt = new Date();
    const month = dt.getMonth();
    const year = dt.getFullYear();
    this.dates = new Date(year, month, 0).getDate();
  }

  clientDataStore(): void { /* client data records */
    this.db.collection('clients', ref => {
      return ref; // .where('id', 'in', ['client01', 'client02']);
    }).valueChanges().subscribe((det) => {
      this.clientList = det;
      if (this.clientList.length > 0) {
        this.clientList[0].isSelected = true;
        this.selectClientItem(this.clientList[0]);
        this.selectedItem = this.clientList[0].sites[0];
      }
      this.loader.pageLoader = false;
      this.onSelect(this.selectedItem);
    }, (err) => {
      this.loader.pageLoader = false;
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
          this.sitesList.push(this.clientList[i].sites[j]);
        }, (err) => {
          console.log(err);
        });
      }
    }
  }

  constructArr(entity: any): string {
    return ''; // entity.join(', ');
  }

  ngOnInit(): void {
  }

  loadDocInfo(item: any): void {
    item.isSelected = true;
    if (this.isEmployees) {
      if (this.selectedUser.display) {
        this.selectedUser.isSelected = false;
      }
      if (item !== this.selectedUser) {
        this.selectedUser.isSelected = false;
      }
      this.selectedUser = item;
      this.selectedUser.display = true;
      // @ts-ignore
      this.keyList = this.selectedUser.attendance.map((value) => value.date).filter((value, index, arr) => arr.indexOf(value) === index);
      this.keyList.sort();
    } else {
      this.selectClientItem(item);
    }
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

  getWeekDayText(str: string): string { /* get day as text */
    const today = new Date();
    // tslint:disable-next-line:radix
    return this.weekDay[(new Date(today.getFullYear(), today.getMonth(), parseInt(str))).getDay()];
  }

  renderList(item: string): Array<any> { /* render attendance listing */
    // @ts-ignore
    return this.selectedUser.attendance.filter((er) => {
      return er.date === item;
    });
  }

  selectClientItem(client: any): void {
    if (client !== this.prevClientItem) {
      this.selectedClient.isSelected = false;
    }
    this.prevClientItem = client;
    /* this.selectedClient.isSelected = false; */
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
    }

    this.selectedClient = client;
  }

  /* add new user popup Add click */
  addUser(): void { // name, email address, designation
    this.loader.addUserLoader = true;
    this.addUserService([this.employee.username, this.employee.emailAddress, this.employee.designation]).then((data) => {
      this.loader.addUserLoader = false;
    }, (error) => {
      if (error.status === 200) {
        // handle success user
        setTimeout(() => {
          this.closeAddExpenseModal?.nativeElement.click();
        }, 2000);
      } else if (error.status === 0) {
        this.addUserError = true;
      }
    }).finally(() => {
      this.loader.addUserLoader = false;
    });
  }

  // tslint:disable-next-line:typedef
  async addUserService(mod: Array<string>) {
    return await this.http.post(environment.funcUrl + 'addUser/', {
      name: mod[0],
      email: mod[1],
      designation: mod[2],
      password: mod[0].split(',')[0].toLowerCase() + '123',
    }).toPromise();
  }

  getUserListing(): void {
    this.loader.pageLoader = true;
    this.getAllUsers().then((data) => {
      // @ts-ignore
      this.employeeList = data;
    }, (error) => {
      console.log(error);
    }).finally(() => {
      this.loader.pageLoader = false;
    });
  }

  // maintain 3-4 flags for different types of data
  // change status of each on selection

  // tslint:disable-next-line:typedef
  async getAllUsers() {
    return await this.http.post(environment.funcUrl + 'getAllUsers', {
      designation: this.selectedCategory
    }).toPromise();
  }

  // user category selection change
  userCategorySelectionChange(entity: string): void {
    this.selectedCategory = entity;
    this.getUserListing();
  }

  /* add a new client */
  addNewClient(): void {
    this.db.doc(`/clients/${this.client.name}`).set({
      name: this.client.name,
      dateAdded: new Date(),
      sites: [],
    });
  }

  /* add new site for client */
  addSite(): void {
    const newSite = {
      name: this.newSiteData.name,
      address: this.newSiteData.address,
      pincode: this.newSiteData.pincode,
      addedOn: new Date(),
      refNo: '',
    };
    // @ts-ignore
    this.selectedClient.sites.push(newSite);
    this.db.doc(`/clients/${this.selectedClient.name}`).update({
      sites: this.selectedClient.sites
    });
  }

  updateUserSite(): void {
    if (this.updateSite.site.length > 0) {
      // @ts-ignore
      this.selectedUser.sites.push(this.selectedUser.activeSite);

      this.db.doc(`/users/${this.selectedUser.uid}`).update({
        sites: this.selectedUser.sites,
        activeSite: this.updateSite.site + ', ' + this.updateSite.client,
      });
    }
  }

  /* update state of widget04-details */
  updateDynamicDetailSelection(state: number): void {
    this.displayEmployeeDetail = (state === 1); // update view for employee
    this.materialImagesDisplay = (state === 2); // update view for material images
    this.progressImagesDisplay = (state === 3); // update view for progress images
    this.displayInfoView = (state === 4);
  }

  /* update widget-04 for employee selection */
  selectEmployee(uid: string): void {
    this.updateDynamicDetailSelection(1);
    // get selected employee detail
    this.db.collection('users').doc(uid).valueChanges().subscribe((det: any) => {
      this.selectedSiteEmployee = det.name;
      this.employeeAttendance = det.attendance;
      if (det.currentStatus) {
        this.selectedSiteEmployeeStatus = det.currentStatus;
      } else {
        this.selectedSiteEmployeeStatus = '';
      }
      if (det.attendance.length > 3) {
        // get last three records
        this.employeeAttendance = this.employeeAttendance.slice(this.employeeAttendance.length - 3);
      }
    });
  }

  /* fetch and sort mployee listing on site selection */
  sortEmployeeList(site: string): void {
    // from site, get data
    this.db.collection('users', ref => {
      const x = '' + site + ', ' + this.selectedClient.name;
      return ref.where('activeSite', '==', x);
    }).valueChanges().subscribe((det: Array<any>) => {
      this.selectedSiteEmployeeList = det.filter(s => s.designation === 'Menu-Admin');
      this.selectedSiteContractorList = det.filter(s => s.designation === 'Sub-Admin');
    }, (err) => {
      console.log(err);
    });
  }

  onSelect(item: any): void {
    this.selectedItem = item;
    this.sortEmployeeList(item.name);
    this.renderDisplayImage();
  }

  activateContractor(activeTab: string): void {
    this.activeTab = activeTab;
  }

  /* update widget-04 for Material/Progress selection */
  selectMaterials(uid: string): void {
    if (uid === 'Materials') {
      this.updateDynamicDetailSelection(2);
      this.materialView = true;
    } else if (uid === 'Progress') {
      this.updateDynamicDetailSelection(3);
      this.materialView = false;
    }
    this.fetchRecentImages(this.materialView);
  }

  openImageModel(imgHref: any, imgId: number): void {
    this.imgHref = imgHref;
    this.imgId = imgId;
    this.imgNumber = imgId + 1;
  }

  /* get image listing from storage */
  fetchRecentImages(toFetchVal: boolean): void {
    const filePath = this.selectedItem.name + ', ' + this.selectedClient.name;
    this.allImageListing = [];
    this.storage.ref(`${filePath}/` + (toFetchVal ? 'material' : 'progress')).listAll().toPromise()
      .then((ref) => {
        for (const i of ref.items) {
          i.getDownloadURL().then((url: string) => {
            this.allImageListing.push(url);
          });
        }
      });
  }

  /* render images to widget-04 */
  renderImages(): Array<any> {
    return this.allImageListing;
  }

  /* get default display image on site window */
  renderDisplayImage(): void {
    const filePath = this.selectedItem.name + ', ' + this.selectedClient.name;
    this.storage.ref(`${filePath}/material`).listAll().toPromise()
      .then((ref) => {
        ref.items[ref.items.length - 1].getDownloadURL().then((url: string) => {
          this.defaultMaterialImage = url;
        });
      });

    this.storage.ref(`${filePath}/progress`).listAll().toPromise()
      .then((ref) => {
        ref.items[ref.items.length - 1].getDownloadURL().then((url: string) => {
          this.defaultProgressImage = url;
        });
      });
  }

  /* get date for month */
  getDateFromMonth(): Array<number> {
    const date = new Date();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const arr = [];
    for (let i = 1; i <= lastDay; i++) {
      arr.push(i);
    }

    return arr;
  }
}
