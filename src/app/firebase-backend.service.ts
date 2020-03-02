import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import { Router } from '@angular/router'
import * as backend from './backendClasses';

@Injectable({
  providedIn: 'root'
})
export class FirebaseBackendService {
  private uid: string;
  constructor(uId: string) {
    this.uid = uId;
  }

  public loginWithEmail(email: string, password: string): Promise<firebase.auth.UserCredential> {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }

  async signupWithEmail(email, password): Promise<firebase.auth.UserCredential> {
    return await firebase.auth().createUserWithEmailAndPassword(email, password);
  }

  // Send users data to firebse and sets in the way desribed by architecture milestone
  public sendUserDataSignUp(name_user: string, username_user: string, email_user: string, phoneNumber_user: string, dateOfBirth: Date, photo_user: string, uid: string ) {
    this.uid = uid;
    var user: backend.user = new backend.user(this.uid, name_user, username_user, email_user, phoneNumber_user, dateOfBirth, photo_user, null, null, null);
    console.log(this.uid);
    console.log(user);
    firebase.database().ref('Users/'+this.uid).set(user).then((res) => {
      console.log("success");
    });
  }
  // Getting user data from firebase
  async getUserData(): Promise<backend.user> {
    var userProfile: backend.user;
    await firebase.database().ref('Users/'+this.uid).once('value', function(snap) {
      var val = snap.val();
      userProfile = new backend.user(val.uid, val.name, val.username, val.email, val.phoneNumber, val.DOB, val.photo, val.socials, val.contacts, val.qrCodes,);
    });
    return userProfile;
  }
  // adding user contact list with new contact
  async addToUserContacts(cont: backend.contact) {
    var userContacts: backend.contact [];
    await this.getUserData().then(usr => {
      userContacts = usr.getContacts;
      userContacts.push(cont);
      var updates = {};
      updates['Users/'+this.uid+'/contacts'] = userContacts;
      firebase.database().ref().update(updates);
    });
  }
  // deletion from user contact list
  async deleteFromUserContacts(cont: backend.contact) {
    var userContacts: backend.contact [];
    await this.getUserData().then(usr => {
      userContacts = usr.getContacts;
      for(let i: number = 0; i < userContacts.length; i++){
        if(userContacts[i].isEqual(cont)){
          userContacts.splice(i,1);
          break;
        }
      }
      var updates = {};
      updates['Users/'+this.uid+'/contacts'] = userContacts;
      firebase.database().ref().update(updates);
    });
  }
  // Adding user socialAccount
  // typ the stringed version of which social media
  async addSocialAccount(typ: string, newAccount: backend.socialAccount) {
    var userSocials: {} [];
    await this.getUserData().then(usr => {
      userSocials = usr.getSocials;
      let found: boolean = false;
      for(let i:number=0; i<userSocials.length && !found; i++) {
        if(userSocials[i]['type'] == typ) {
          userSocials[i]['socialAccounts'].push(newAccount);
          found = true;
        }
      }
      if(!found) {
        userSocials.push(new backend.social(typ, null, [newAccount]));
      }
      var updates = {};
      updates['Users/'+this.uid+'/socials'] = userSocials;
      firebase.database().ref().update(updates);
    });
  }
  // delete social account
  async deleteSocialAccount(typ: string, sAcot: backend.socialAccount) {
    var userSocialAccounts: backend.socialAccount [];
    var userSocials: {} [] = [];
    await this.getUserData().then(usr => {
      userSocials = usr.getSocials;
      this.getSocialAccountsType(typ).then(dat => {
        userSocialAccounts = dat;
        for(let i:number = 0; i < userSocialAccounts.length; i++){
          if(userSocialAccounts[i].isEqual(sAcot)){
            userSocialAccounts.splice(i,1);
            break;
          }
        }
      });
      let i:number = 0;
      for(; i < userSocials.length; i++){
        if(userSocials[i]['type'] == typ){
          break;
        }
      }
      var updates = {};
      updates['Users/'+this.uid+'/socials/'+i+'/socialAccount'] = userSocialAccounts;
      firebase.database().ref().update(updates);
    });
  }
  // Getting social accounts of a given type
  async getSocialAccountsType(type: string) : Promise<backend.socialAccount []> {
    console.log(type)
    var socialAccs: backend.socialAccount[];
    await this.getUserData().then(usr => {
      let found: boolean = false;
      let socials: {}[] = usr.getSocials;
      for(let i: number = 0; i<socials.length && !found; i++) {
        console.log(socials[i]);
        if(socials[i]['type'] == type) {
          socialAccs = socials[i]['socialAccounts'];
          found = true;
        }
      }
      if(!found){
        socialAccs = [new backend.socialAccount(null,null,null)];
      }
    });
    return socialAccs;
  }
  // Logs Out
  async logOut() {
    await firebase.auth().signOut().then(res => {
      console.log("Logged Out");
    });
  }
}
