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
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.less']
})

export class ClientComponent implements OnInit {
  brand = environment.brand;
  activeUserName: any;
  @ViewChild('addUserModal') closeAddExpenseModal: ElementRef | undefined;
  @ViewChild('userForm') public userLoginForm: NgForm | undefined;
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
  defaultMaterialImage = '';
  defaultProgressImage = '';
  tempSelectedClients: Array<any> = [];
  tempSelectedEmployees: Array<any> = [];
  record: any;
  recordId = 0;
  filterApplied = false;
  selectedStatus = '';
  availableStatusList = ['Active', 'On Leave', 'Sign Out'];
  availableDesignationList = ['Admin', 'Supervisor', 'Employee'];
  selectedDesignation = this.availableDesignationList[0];
  selectedImageNotes: Array<any> = [];
  counter = 1;
  isChecked = false;
  skipField = 0;
  submitted = false;
  mobNumberPattern = '^((\\+91-?)|0)?[0-9]{10}$';
  activeSiteDate = new Date().getDate();
  regularize: any;
  approvalList: Array<any> = [];
  acceptDenyFlag = false;
  selectedRegularizeRecords: any;
  uid = '';
  datepickerModel = new Date();
  mousing = false;
  clientSiteList:Array<any> = [];
  reportClient ='';
  reportSite ='';

  constructor(private db: AngularFirestore, private router: Router, private afAuth: AngularFireAuth,
              private http: HttpClient, private titleService: Title, private storage: AngularFireStorage, private fdb: AngularFireDatabase, private toastr: ToastrService) {
    this.allow = localStorage.getItem('access') === '1';
    // @ts-ignore
    this.uid = JSON.parse(localStorage.getItem('user')).uid;
    if (!this.allow) {
      router.navigateByUrl('/login');
    }

    this.activeUserName = JSON.parse(localStorage.user).name;
    this.loader.pageLoader = true;
    this.currentDate = new Date().getDate();
    this.db = db;
    this.isEmployees = (router.url === '/employees');
    if (this.isEmployees) {
      this.userTypes = environment.userTypes;
      this.getUserListing();
      this.pageState();
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
      console.log(det);
      if (this.clientList.length > 0) {
        this.clientList[0].isSelected = true;
        this.selectClientItem(this.clientList[0]);
        this.selectedItem = this.clientList[0].sites[0];
      }
      this.loader.pageLoader = false;
      this.onSelect(this.selectedItem, this.selectedClient);
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
  addUser(): void {
    this.loader.addUserLoader = true;
    this.skipField = this.isChecked ? 1 : 0;
    this.addUserService([this.employee.username, this.employee.emailAddress, this.employee.designation, this.employee.mobile]).then((data) => {
      this.loader.addUserLoader = false;
    }, (error) => {
      if (error.status === 200) {
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
      contractors: [],
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

  /* fetch and sort employee listing on site selection */
  sortEmployeeList(site: string): void {
    // from site, get data
    this.db.collection('users', ref => {
      return ref.where('activeSite.site', '==', site);
    }).valueChanges().subscribe((det: Array<any>) => {
      this.selectedSiteEmployeeList = det.filter(s => s.designation === 'Employee');
      this.selectedSiteContractorList = det.filter(s => s.designation === 'Supervisor');
      console.log(this.selectedSiteContractorList);
    }, (err) => {
      console.log(err);
    });
  }

  /* on item selected */
  onSelect(item: any, client: any): void {
    this.selectedItem = item;
    this.selectedClient = client;
    this.sortEmployeeList(item.name);
    this.renderDisplayImage();
  }

  /* update widget-04 for Material/Progress selection */
  selectMaterials(uid: string): void {
    if (uid === 'Materials') {
      this.materialView = true;
    } else if (uid === 'Progress') {
      this.materialView = false;
    }
    this.fetchRecentImages(this.materialView);
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
    this.selectMaterials('Progress');
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
    // @ts-ignore
    this.userLoginForm.form.reset();
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
    if (status === 204) {
      this.toastr.success('Record successfully deleted!.');
    }
  }

  /* add another popup for employee popup */
  onSubmit(): void {
    this.submitted = true;
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
      this.showToaster(204);
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
  }

  /* get visitors listing */
  getVisitors(): Array<any> {
    return this.selectedItem.visitors.filter((item: any) => {
      return Number(item.date) === Number(this.currentDate);
    });
  }

  /* get visitors listing */
  getContractors(): Array<any> {
    return this.selectedItem.contractors.filter((item: any) => {
      return Number(item.date) === Number(this.currentDate);
    });
  }

  /* construct date for entity */
  makeDate(viewDate: string): string {
    const dt = new Date(viewDate);
    return dt.getDate() + '-' + dt.getMonth() + '-' + dt.getFullYear();
  }

  /* delete site */
  deleteUser(): void {
    this.db.doc(`users/${this.record.uid}`).delete().then(() => {
      this.showToaster(204);
      this.getAllUsers().then((data) => {
        // @ts-ignore
        this.tempSelectedEmployees = data;
      });
    }).catch((error) => {
      this.showToaster(error.status);
      console.error('Error removing document: ', error);
    });
  }

  showRegularize(): void {
    this.approvalList.splice(0, this.approvalList.length);
    for (let i = 0; i < this.tempSelectedEmployees.length; i++) {
      if (this.tempSelectedEmployees[i].attendance.length > 0) {
        this.regularize = this.tempSelectedEmployees[i].attendance.filter((employee: any) => {
          if (employee.isApproved != undefined && employee.isApproved === true) {
            this.approvalList.push(this.tempSelectedEmployees[i]);
          }
        });
      }
    }

    /* this.regularize = this.employeeList.filter((employee) => {
        if(employee.isApproved!=undefined && employee.isApproved===false){
            this.approvalList.push(employee);
        }
    }); */
  }

  pageState(): void {
    this.db.doc(`/users/${this.uid}`).get().subscribe((d) => {
      // @ts-ignore
      const y = d.data().attendance.findIndex((er) => {
        return er.isApproved;
      });
    });
  }

  acceptDeny(acceptDeny: string, item: any): void {
    this.acceptDenyFlag = (acceptDeny === 'ACCEPT');
    const lastRecord = item.attendance[item.attendance.length - 1];
    if (this.acceptDenyFlag) {
      for (let index = 0; index < item.attendance.length; index++) {
        if (item.attendance[index].isApproved === true) {
          item.attendance[index].isApproved = false;
          item.attendance[index].discrepant = false;
        }
        /* this.approvalList = this.approvalList.filter((value)=>{
          return item.uid==value.uid;
      }); */
      }
      const element = item.attendance;
      /* this.selectedRegularizeRecords=item.slice(); */
      this.db.doc(`/users/${item.uid}`).update({
        attendance: element
      }).then(() => {
        this.getAllUsers().then((data) => {
          // @ts-ignore
          this.tempSelectedEmployees = data;
        });
      });
      if (element.length > 0) {
        this.approvalList.splice(0, this.approvalList.length);
      }
    }
  }

  /* open side navigation bar */
  openNavigationBar(): void {
    this.mousing = !this.mousing;
  }

  /* get user sign in
  * @param att - attendance array
  * @param status - 1(sign in), 2(sign out)
  */
  getUserSignStatus(att: Array<any>, status: number): string {
    if (att.length > 0) {
      const x = att.filter(r => {
        return r.date.toString() === this.currentDate.toString() && r.status === (status === 1 ? 'Sign In' : 'Sign Out');
      });
      return x.length > 0 ? x[0].time : '-';
    } else {
      return '-';
    }
  }

  /* execute regularize */
  executeRegularize(): void {
    this.http.get(environment.funcUrl + 'attendanceRegularize/').toPromise().then((data) => {
      console.log('Execute regularize');
    });
  }

  /* get site listing for change site popup */
  getReportsClientSite(): void {
    this.getClientList();
  }

  getClientList():void {
    this.db.collection('clients').valueChanges().subscribe((det) => {
        this.clientSiteList = [];
        /* tslint:disable-next-line:prefer-for-of */
        for (let i = 0; i < det.length; i++) {
          /* tslint:disable-next-line:prefer-for-of */ // @ts-ignore
          for (let j = 0; j < det[i].sites.length; j++) {
            this.clientSiteList.push({
              // @ts-ignore
              ...det[i].sites[j],
              // @ts-ignore
              client: det[i].name
            });
          }
        }
        console.log(this.clientSiteList);
      });
  }
  /* add user to db */

  // tslint:disable-next-line:typedef
  async generateSupervisorReport() {
    return await this.http.post(environment.funcUrl + 'supervisorReports/', {
      /* designation: applyFilter.designation, */
      date: this.datepickerModel,
      site:this.reportSite,
      client:this.reportClient,
    }).toPromise();
  }
}
