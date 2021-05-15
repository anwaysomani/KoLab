import {Component, OnInit} from '@angular/core';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.less']
})
export class PostComponent implements OnInit {
  contractorList: Array<any> = [];
  selectedImage = '';

  constructor(private storage: AngularFireStorage, private db: AngularFirestore) {
  }

  ngOnInit(): void {
    this.storage.ref('').listAll().toPromise().then((ref) => {
      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < ref.prefixes.length; i++) {
        const imgs: never[] = [];
        this.storage.ref(ref.prefixes[i].fullPath).listAll().toPromise().then((data) => {
          // tslint:disable-next-line:no-shadowed-variable
          for (const i of data.items) {
            i.getDownloadURL().then((url: string) => {
              // @ts-ignore
              imgs.push(url);
            });
          }
        });

        this.db.doc(`/users/${ref.prefixes[i].fullPath}`).valueChanges().subscribe((det: any) => {
          this.contractorList.push({
            name: det.name,
            imgs,
          });
        });
      }
    });
  }

  imageSelection(i: string): void {
    this.selectedImage = i;
  }

}
