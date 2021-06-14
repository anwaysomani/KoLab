import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import 'firebase/auth';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Title} from '@angular/platform-browser';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireDatabase} from '@angular/fire/database';
import {map} from 'rxjs/operators';
import {ToastrService} from 'ngx-toastr';

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
  selectedItem?: any;
  selectedClient = {
    name: '',
    sites: [],
    isSelected: false
  };
  selectedUser = {
    display: false,
    isSelected: true,
    activeSite: {},
    sites: [],
    uid: '',
  };
  updateSite = {
    client: '',
    site: '',
    address: '',
    pincode: ''
  };
  newSiteData = {
    name: '',
    address: '',
    pincode: '',
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
    designation: '',
    mobile: '',
  };
  addUserError = false;
  selectedCategory = 'Admin';
  userTypes: Array<any> = [];
  allow: boolean;
  searchText = '';
  prevClientItem = '';

  displayEmployeeDetail = false;
  selectedSiteEmployeeList: Array<any> = [];
  selectedSiteContractorList: Array<any> = [];
  selectedSiteEmployee = '';
  employeeAttendance: Array<any> = [];
  selectedSiteEmployeeStatus = '';
  currentDate = 1;
  newNote = '';
  imgNumber = 1;
  materialView = false;
  imgHref?: any = '';
  imgId = 0;
  allImageListing: Array<string> = [];
  materialImagesDisplay = false;
  progressImagesDisplay = false;
  displayInfoView = false;
  defaultMaterialImage = '';
  defaultProgressImage = '';
  tempSelectedClients: Array<any> = [];
  tempSelectedEmployees: Array<any> = [];
  record: any;
  recordId = 0;
  filterApplied = false;
  selectedStatus = '';
  availableStatusList = ['Active', 'On Leave', 'Sign Out'];
  availableDesignationList = ['Admin', 'Contractor', 'Employee'];
  selectedDesignation = this.availableDesignationList[0];
  selectedImageNotes: Array<any> = [];
  counter = 1;
  isChecked = false;
  skipField = 0;
  submitted = false;
  mobNumberPattern = '^((\\+91-?)|0)?[0-9]{10}$';
  displayVisitorInfo = false;
  activeSiteDate = new Date().getDate();

  constructor(private db: AngularFirestore, private router: Router, private afAuth: AngularFireAuth,
              private http: HttpClient, private titleService: Title, private storage: AngularFireStorage, private fdb: AngularFireDatabase, private toastr: ToastrService) {
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

      this.getAllUsers().then((data) => {
        // @ts-ignore
        this.tempSelectedEmployees = data;
      });
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

  /* get client listing */
  clientDataStore(): void { /* client data records */
    this.db.collection('clients', ref => {
      return ref;
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

  ngOnInit(): void {
  }

  /* filter client list */
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

  selectClientItem(client: any): void {
    if (client !== this.prevClientItem) {
      this.selectedClient.isSelected = false;
    }
    this.prevClientItem = client;
    this.selectedClient = {
      name: '',
      sites: [],
      isSelected: false
    };

    this.selectedClient = client;

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.selectedClient.sites.length; i++) {
      // get employees with active employees
      this.db.collection('users', ref => {
        // @ts-ignore
        return ref.where('activeSite', '==', this.selectedClient.sites[i].name + ', ' + this.selectedClient.name);
      }).valueChanges().subscribe((det) => {
        // @ts-ignore
        this.selectedClient.sites[i].contractor = det.length > 0 ? det[0].name : '-';
      }, (err) => {
        console.log(err);
      });
    }
  }

  /* add new user popup add click */
  addUser(): void { // name, email address, designation
    this.loader.addUserLoader = true;
    this.skipField = this.isChecked ? 1 : 0;
    this.addUserService([this.employee.username, this.employee.emailAddress, this.employee.designation, this.employee.mobile]).then((data) => {
      this.loader.addUserLoader = false;
    }, (error) => {
      if (error.status === 200) {
        // handle success user
        this.showToaster(error.status);
        setTimeout(() => {
          if (!this.isChecked) {
            this.closeAddExpenseModal?.nativeElement.click();
          }
          /* ON Modal close refresh to show recent data */
          this.getAllUsers().then((data) => {
            // @ts-ignore
            this.tempSelectedEmployees = data;
          });
        }, 2000);
      } else if (error.status === 0) {
        this.addUserError = true;
      }
    }).finally(() => {
      this.loader.addUserLoader = false;
      this.clearFields(this.skipField);
    });
  }

  /* add user to db */

  // tslint:disable-next-line:typedef
  async addUserService(mod: Array<string>) {
    return await this.http.post(environment.funcUrl + 'addUser/', {
      name: mod[0],
      email: mod[1],
      designation: mod[2],
      password: mod[0].split(',')[0].toLowerCase() + '123',
      mobile: mod[3],

    }).toPromise();
  }

  /* service for user listing */
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

  /* get all users listing */

  // tslint:disable-next-line:typedef
  async getAllUsers() {
    return await this.http.post(environment.funcUrl + 'getAllUsers', {
      designation: this.selectedCategory
    }).toPromise();
  }

  /* user category selection change */
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
    this.clearFields(this.skipField);
    this.showToaster(200);
  }

  /* add new site for client */
  addSite(): void {
    const newSite = {
      name: this.newSiteData.name,
      address: this.newSiteData.address,
      pincode: this.newSiteData.pincode,
      addedOn: new Date(),
      refNo: '',
      visitors: [],
    };
    // @ts-ignore
    this.selectedClient.sites.push(newSite);
    this.db.doc(`/clients/${this.selectedClient.name}`).update({
      sites: this.selectedClient.sites
    });
    this.clearFields(this.skipField);
    this.showToaster(200);
  }

  /* update user active site */
  updateUserSite(): void {
    if (this.updateSite.site.length > 0) {
      // @ts-ignore
      this.selectedUser.sites.push(this.selectedUser.activeSite);

      this.db.doc(`/users/${this.selectedUser.uid}`).update({
        sites: this.selectedUser.sites,
        activeSite: {
          site: this.updateSite.site,
          client: this.updateSite.client,
          address: this.updateSite.address,
          pincode: this.updateSite.pincode
        },
      });
      this.showToaster(200);
      /* on modal close refresh to show recent data */
      this.getAllUsers().then((data) => {
        // @ts-ignore
        this.tempSelectedEmployees = data;
      });
    }
  }

  /* update site entry */
  updateChangeSite(data: any): void {
    this.updateSite.site = data.name;
    this.updateSite.client = data.client;
    this.updateSite.address = data.address;
    this.updateSite.pincode = data.pincode;
  }

  /* update state of widget04-details */
  updateDynamicDetailSelection(state: number): void {
    this.displayEmployeeDetail = (state === 1); // update view for employee
    this.materialImagesDisplay = (state === 2); // update view for material images
    this.progressImagesDisplay = (state === 3); // update view for progress images
    this.displayInfoView = (state === 4); // update view for info
    this.displayVisitorInfo = (state === 5);
  }

  /* update widget-04 for employee selection */
  selectEmployee(uid: string): void {
    this.loader.addClientLoader = true;
    this.updateDynamicDetailSelection(1);
    this.db.collection('users').doc(uid).valueChanges().subscribe((det: any) => { // get selected employee detail
      this.selectedSiteEmployee = det.name;
      this.employeeAttendance = det.attendance;
      if (det.currentStatus) {
        this.selectedSiteEmployeeStatus = det.currentStatus;
      } else {
        this.selectedSiteEmployeeStatus = '';
      }

      this.employeeAttendance = [];
      this.employeeAttendance = det.attendance.filter((entity: any) => {
        return Number(entity.date) === Number(this.currentDate);
      });

      this.loader.addClientLoader = false;
    });
  }

  /* fetch and sort employee listing on site selection */
  sortEmployeeList(site: string): void {
    // from site, get data
    this.db.collection('users', ref => {
      return ref.where('activeSite.site', '==', site);
    }).valueChanges().subscribe((det: Array<any>) => {
      this.selectedSiteEmployeeList = det.filter(s => s.designation === 'Employee');
      this.selectedSiteContractorList = det.filter(s => s.designation === 'Contractor');
    }, (err) => {
      console.log(err);
    });
  }

  /* on item selected */
  onSelect(item: any): void {
    this.selectedItem = item;
    this.sortEmployeeList(item.name);
    this.renderDisplayImage();
    this.updateDynamicDetailSelection(0);
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

  /* update widget-04 for Material/Progress selection */
  visitors(): void {
    this.updateDynamicDetailSelection(5);
  }

  /* extract date for card header */
  getDateAndTime(key: string): string {
    return (new Date(key)).toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
  }

  /* open image modal */
  openImageModel(imgHref: any, imgId: number): void {
    this.imgHref = imgHref;
    this.imgId = imgId;
    this.imgNumber = imgId + 1;

    this.fdb.list('notes', ref => { // fetch notes against image
      return ref.orderByChild('url').equalTo(this.imgHref);
    }).snapshotChanges().pipe(
      map(data =>
        data.map(d =>
          // @ts-ignore
          ({key: d.payload.key, ...d.payload.val()})
        )
      )
    ).subscribe(data => {
      this.selectedImageNotes = data;
    });
  }

  /* get image listing from storage */
  fetchRecentImages(toFetchVal: boolean): void {
    this.loader.addClientLoader = true;
    const filePath = this.selectedItem.name + ', ' + this.selectedClient.name;
    this.allImageListing = [];
    this.storage.ref(`${filePath}/` + (toFetchVal ? 'material' : 'progress')).listAll().toPromise()
      .then((ref) => {
        for (const i of ref.items) {
          i.getMetadata().then((det: any) => {
            let varEntity = '';
            i.getDownloadURL().then((url: string) => {
              varEntity = url;
            }).then(() => {
              if (Number(this.currentDate) !== Number(new Date().getDate())) {
                if (Number(new Date(det.timeCreated)) === Number(this.currentDate)) {
                  // @ts-ignore
                  this.allImageListing.push({
                    url: varEntity,
                    date: det.timeCreated
                  });
                }
              } else {
                // @ts-ignore
                this.allImageListing.push({
                  url: varEntity,
                  date: det.timeCreated
                });
              }
            });
          });
        }
        this.loader.addClientLoader = false;
      });
  }

  /* render images to widget-04 */
  renderImages(): Array<any> {
    return this.allImageListing;
  }

  /* get default display image on site window */
  renderDisplayImage(): void {
    this.loader.addClientLoader = true;
    const filePath = this.selectedItem.name + ', ' + this.selectedClient.name;
    this.storage.ref(`${filePath}/material`).listAll().toPromise()
      .then((ref) => {
        if (ref.items.length > 0) {
          ref.items[ref.items.length - 1].getDownloadURL().then((url: string) => {
            this.defaultMaterialImage = url;
          });
        }
        this.loader.addClientLoader = false;
      });

    this.storage.ref(`${filePath}/progress`).listAll().toPromise()
      .then((ref) => {
        if (ref.items.length > 0) {
          ref.items[ref.items.length - 1].getDownloadURL().then((url: string) => {
            this.defaultProgressImage = url;
          });
        }
        this.loader.addClientLoader = false;
      });
    this.loader.addClientLoader = false;
  }

  /* client listing search */
  clientSearch(txt: string): void {
    if (this.clientList.length < 0) {
      this.tempSelectedClients = [];
    }
    this.tempSelectedClients = this.clientList.filter(item => {
      return item.name.toLowerCase().includes(txt.toLowerCase());
    });
  }

  /* get filtered client listing */
  getFilteredClientList(): Array<any> {
    return this.tempSelectedClients;
  }

  /* employee listing search */
  employeeSearch(txt: string): void {
    if (this.employeeList.length < 0) {
      this.tempSelectedEmployees = [];
    }
    this.tempSelectedEmployees = this.employeeList.filter(item => {
      return item.name.toLowerCase().includes(txt.toLowerCase());
    });
  }

  /* assign variables to values on opening employee details modal */
  openEmployeeDetailsModel(data: any, index: number): void {
    this.record = data;
    this.recordId = index;
  }

  /* designation filter change */
  onDesignationSelection(txt: string): void {
    this.filterApplied = !this.filterApplied;
    this.searchText = '';
    this.tempSelectedEmployees = [];
    this.selectedCategory = txt;
    this.getAllUsers().then((data) => {
      // @ts-ignore
      this.tempSelectedEmployees = data;
      // @ts-ignore
      this.employeeList = data;
    });
  }

  /* status filter change */
  onStatusSelection(txt: string): void {
    this.filterApplied = !this.filterApplied;
    if (this.employeeList.length < 0) {
      this.tempSelectedEmployees = [];
    }
    this.tempSelectedEmployees = this.tempSelectedEmployees.filter(user => {
      return user.currentStatus.toLowerCase().includes(txt.toLowerCase());
    });
  }

  radioToggle(event: Event, selectedStatus: string): void {
    this.counter += 1;
    if (this.selectedStatus !== selectedStatus) {
      (event.target as HTMLInputElement).checked = true;
    } else {
      (event.target as HTMLInputElement).checked = this.counter % 2 === 0;
    }
  }

  /* record note for image */
  recordNote(): void {
    this.fdb.list('notes').push({
      url: this.imgHref,
      message: this.newNote,
      date: (new Date()).getTime()
    });
  }

  /* get site listing for change site popup */
  getClientListing(data: any): void {
    this.db.collection('clients').valueChanges().subscribe((det) => {
      this.clientList = [];
      this.selectedUser.activeSite = data.activeSite;
      this.selectedUser.sites = data.sites;
      this.selectedUser.uid = data.uid;
      /* tslint:disable-next-line:prefer-for-of */
      for (let i = 0; i < det.length; i++) {
        /* tslint:disable-next-line:prefer-for-of */ // @ts-ignore
        for (let j = 0; j < det[i].sites.length; j++) {
          this.clientList.push({
            // @ts-ignore
            ...det[i].sites[j],
            // @ts-ignore
            client: det[i].name
          });
        }
      }
    });
  }

  /* clear popup fields */
  clearFields(skipField: any): void {
    this.employee.username = '';
    this.employee.emailAddress = '';
    if (skipField === 0) {
      this.employee.designation = '';
    }
    this.employee.mobile = '';
    this.client.name = '';
    this.newSiteData.name = '';
    this.newSiteData.address = '';
    this.newSiteData.pincode = '';
  }

  /* display toaster on screen */
  showToaster(status: any): void {
    if (status === 200) {
      this.toastr.success('Record added successfully.');
    }
  }

  /* add another popup for employee popup */
  onSubmit(): void {
    this.submitted = true;
  }

  /* check empty widget_04 config */
  checkWidgetDisplayConfig(): boolean {
    return !this.materialImagesDisplay && !this.progressImagesDisplay && !this.displayInfoView && !this.displayVisitorInfo;
  }

  /* delete site */
  deleteSite(): void {
    this.db.doc(`clients/${this.selectedClient.name}`).get().subscribe((d) => {
      // @ts-ignore
      const entity = d.data().sites;
      // @ts-ignore
      const index = entity.findIndex((er) => {
        return er.name === this.selectedItem.name;
      });
      entity.splice(index, 1);
      this.db.doc(`/clients/${this.selectedClient.name}`).update({
        sites: entity,
      });
    });
  }

  /* get date for month */
  getDateFromMonth(): Array<number> {
    const arr = [];
    for (let i = 1; i <= Number(new Date().getDate()); i++) {
      arr.push(i);
    }

    return arr;
  }

  /* date change for site */
  changeEvent(): void {
    this.activeSiteDate = Number(this.currentDate);
    this.updateDynamicDetailSelection(6);
  }

  makeDate(viewDate: string): string {
    const dt = new Date(viewDate);
    return dt.getDate() + '-' + dt.getMonth() + '-' + dt.getFullYear();
  }
}
