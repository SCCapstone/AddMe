import { Component, OnInit } from '@angular/core';
import { FirebaseBackendService } from '../firebase-backend.service';
import * as firebase from 'firebase';
import { Router, ActivatedRoute } from '@angular/router';
import * as backend from '../backendClasses';
import { PopoverController } from '@ionic/angular';
import { ContactsPage } from '../contacts/contacts.page';

@Component({
  selector: 'app-user-contact',
  templateUrl: './user-contact.page.html',
  styleUrls: ['./user-contact.page.scss'],
})
export class UserContactPage implements OnInit {
  private profile: backend.contact;
  private firebase: FirebaseBackendService;
  private grid: {name: string, logo: string} [][] = [];

  constructor(private router: Router, private route: ActivatedRoute, private popOver: PopoverController) {
    firebase.auth().onAuthStateChanged(firebaseUser => {
      if(!firebaseUser){
        this.router.navigate(['login']);
      }else{
        this.firebase = new FirebaseBackendService(firebase.auth().currentUser.uid);
        this.route.params.subscribe(dat => {
          this.profile = dat['contact'];
          this.initGrid();
        });
      }
    });
  }

  goToContacts() {
    this.router.navigate(['contacts']);
  }

  goToHome() {
    this.router.navigate(['home']);
  }

  ngOnInit() {
  }

  async openPopover(ev: any, typ: string) {
    const pop = await this.popOver.create({
      component: ContactsPage,
      componentProps: {'type': typ},
      translucent: true,
      backdropDismiss: true,
      cssClass: 'popover',
      event: ev
    });
    return await pop.present();
  }
  initGrid() {
    let names: string[] = this.getNames();
    let logos: string[] = this.getLogos();
    if(names.length == logos.length) {
      for(let i: number=0; i<Math.ceil(names.length/4); i++) {
        this.grid[i] = [];
        for(let j: number=0; j<4 && (i*4+j)<names.length; j++) {
          this.grid[i][j] = {name: names[i*4+j],logo: logos[i*4+j]};
        }
      }
    }
  }
  getNames(): string[] {
    return ['instagram',
              'facebook',
              'snapchat',
              'tiktok',
              'github',
              'twitter',
              'linkedin',
              'whatsapp',
              'tinder',
              'steam',
              'gmail',
              'outlook',
              'venmo',
              'paypal',
              'discord',
              'katalk'];
  }
  getLogos(): string[] {
    return ['../assets/instagram-2-1.svg',
                '../assets/facebook-icon.svg',
                '../assets/snapchat.svg',
                '../assets/tiktok-logo.svg',
                '../assets/github.svg',
                '../assets/twitter.svg',
                '../assets/linkedin-icon-2.svg',
                '../assets/whatsapp-symbol.svg',
                '../assets/tinder-icon.svg',
                '../assets/steam-icon-logo.svg',
                '../assets/gmail-icon.svg',
                '../assets/outlook-1.svg',
                '../assets/venmo.svg',
                '../assets/paypal-icon.svg',
                '../assets/discord.svg',
                '../assets/kakaotalk.svg'];
  }
}