import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseBackendService } from '../firebase-backend.service';
import * as firebase from 'firebase';
import * as backend from '../backendClasses';

@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.page.html',
  styleUrls: ['./qrcode.page.scss'],
})
export class QRcodePage implements OnInit {
  qrData: string = '';
  elementType: 'url' | 'canvas' | 'img' = 'canvas';
  private profile: backend.user;
  private firebase: FirebaseBackendService;

  constructor(private router: Router) {
    firebase.auth().onAuthStateChanged(firebaseUser => {
      if(!firebaseUser)
      {
        this.router.navigate(['login']);
      }
      else
      {
        this.firebase = new FirebaseBackendService(firebase.auth().currentUser.uid);
        this.firebase.getUserData().then(dat => {
          this.profile = dat;
          if(JSON.stringify(this.profile.getQrCodes).length <= 2900) {
            this.qrData = JSON.stringify(this.profile.getQrCodes[0]);
          } else {
            this.qrData = JSON.stringify(this.profile.getQrCodes[0]);
          }
          console.log(this.qrData);
        });
      }
    });
  }

  goToHome(){
    this.router.navigate(['home']);
  }

  ngOnInit() {
  }

}
