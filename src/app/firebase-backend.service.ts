import { async } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import * as backend from './backendClasses';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { BackendCameraService } from './backend-camera.service'
import { ImagePicker, ImagePickerOptions, OutputType } from '@ionic-native/image-picker/ngx';
import { resolve } from 'url';
import { promise } from 'protractor';

@Injectable({
  providedIn: 'root'
})
export class FirebaseBackendService {
  private uid: string;
  private cam: BackendCameraService;

  constructor(uId: string) {
    this.uid = uId;
    this.cam = new BackendCameraService();
  }

  public loginWithEmail(email: string, password: string): Promise<firebase.auth.UserCredential> {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }

  async signupWithEmail(email, password): Promise<firebase.auth.UserCredential> {
    return await firebase.auth().createUserWithEmailAndPassword(email, password);
  }
  // Returns whether or not the username is already taken
  checkIfUsernameIsTaken(usrName: string): Promise<boolean> {
    return new Promise(resolve => {
      firebase.database().ref('Users/').orderByChild('username').equalTo(usrName).once('value', snap => {
        console.log(snap.val());
        if(snap.val()) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
  // Returns Whether on not the email is already linked to an account
  checkIfEmailIsTaken(usrEmail: string): Promise<boolean> {
    return new Promise(resolve => {
      firebase.database().ref('Users/').orderByChild('email').equalTo(usrEmail).once('value', snap => {
        if(snap.val()) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
  // Login with google
  async loginWithGoogle(): Promise<boolean> {
    var provider = new firebase.auth.GoogleAuthProvider();
    var ret: boolean = false;
    await firebase.auth().signInWithPopup(provider).then(async res => {
      await this.sendUserDataSignUp(res.user.displayName,res.user.uid,res.user.email,res.user.phoneNumber,null,res.user.photoURL,res.user.uid);
      ret = true;
    }).catch(err => {
      ret = false;
    });
    return ret;
  }
  async loginWithFacebook(): Promise<any> {
    var provider = new firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithPopup(provider)
  }
  // Send users data to firebse and sets in the way desribed by architecture milestone
  public async sendUserDataSignUp(name_user: string, username_user: string, email_user: string, phoneNumber_user: string, dateOfBirth: Date, photo_user: string, uid: string ) {
    this.uid = uid;
    var user: backend.user = new backend.user(this.uid, name_user, username_user, email_user, phoneNumber_user, dateOfBirth, photo_user, null, null, [new backend.qrCode(uid, new backend.contact(uid,username_user,name_user,email_user,phoneNumber_user,dateOfBirth,photo_user,null))],true);
    await firebase.database().ref('Users/'+this.uid).set(user)
  }
  // Getting user data from firebase
  async getUserData(): Promise<backend.user> {
    var userProfile: backend.user;
    const self = this
    await firebase.database().ref('Users/'+this.uid).once('value', function(snap) {
      var val = snap.val();
      if(val)
        userProfile = new backend.user(val.uid, val.name, val.username, val.email, val.phoneNumber, val.DOB, val.photo, val.socials, val.contacts, val.qrCodes,val.first);
      else 
        self.logOut()  
    });
    return userProfile;
  }
  // Update user data on firebase
  async updateUserData(usr: backend.user): Promise<any> {
    let qrCodes: backend.qrCode[] = [new backend.qrCode(usr.getUid, new backend.contact(usr.getUid, usr.getUsername, usr.getName, usr.getEmail, usr.getPhoneNumber, usr.getDOB, usr.getPhoto, usr.getSocials))];
    console.log(qrCodes);
    usr.setQrCodes = qrCodes;
    var updates: {} = {};
    updates['Users/'+this.uid+'/'] = usr;
    return firebase.database().ref().update(updates);
  }
  // adding user contact list with new contact
  async addToUserContacts(cont: backend.contact) {
    var userContacts: backend.contact [];
    await this.getUserData().then(usr => {
      userContacts = usr.getContacts;
      if(!userContacts) {
        userContacts = [];
      }
      userContacts.push(cont);
      var updates = {};
      updates['Users/'+this.uid+'/contacts'] = userContacts;
      firebase.database().ref().update(updates);
    });
  }
  // add to user contacts from username of another user
  async addToUserContactsFromUsername(usrName: string) {
    var newContact: backend.contact;
    firebase.database().ref('Users/').orderByChild('username').equalTo(usrName).once('value', snap => {
      snap.forEach(shot => {
        let uid: string = shot.key;
        let tempFire: FirebaseBackendService = new FirebaseBackendService(uid);
        tempFire.getUserData().then(usr => {
          newContact = usr.getQrCodes[0]['qContact'];
          this.addToUserContacts(newContact);
        });
      });
    });
  }
  // deletion from user contact list
  async deleteFromUserContacts(cont: backend.contact) {
    var userContacts: {} [];
    await this.getUserData().then(usr => {
      userContacts = usr.getContacts;
      for(let i: number = 0; i < userContacts.length; i++){
        if(userContacts[i]['id'] == cont['id'] && userContacts[i]['name'] == cont['name'] && userContacts[i]['username'] == cont['username'] && userContacts[i]['email'] == cont['email']
            && userContacts[i]['phoneNumber'] == cont['phoneNumber'] && userContacts[i]['DOB'] == cont['DOB'] && userContacts[i]['photo'] == cont['photo'])
        {
          userContacts.splice(i,1);
          break;
        }
      }
      var updates = {};
      updates['Users/'+this.uid+'/contacts'] = userContacts;
      firebase.database().ref().update(updates);
    });
  }
  // Updating user contact
  async updateUsersContact(old: backend.contact, saerowon: backend.contact) {
    var userContacts: {}[] = [];
    await this.getUserData().then(usr => {
      userContacts = usr.getContacts;
      for(let i: number = 0; i<userContacts.length; i++) {
        if(userContacts[i]['id'] == old['id'] && userContacts[i]['name'] == old['name'] && userContacts[i]['username'] == old['username'] && userContacts[i]['email'] == old['email']
            && userContacts[i]['phoneNumber'] == old['phoneNumber'] && userContacts[i]['DOB'] == old['DOB'] && userContacts[i]['photo'] == old['photo'])
        {
          userContacts[i] = saerowon;
          break;
        }
      }
      var updates: {} = {};
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
        if(userSocials[i]['type'] == typ && userSocials[i]['socialAccounts']) {
          userSocials[i]['socialAccounts'].push(newAccount);
          found = true;
        } else if(userSocials[i]['type'] == typ && !userSocials[i]['socialAccounts']) {
          userSocials[i]['socialAccounts'] = [];
          userSocials[i]['socialAccounts'].push(newAccount);
          found = true;
        }
      }
      if(!found) {
        userSocials.push(new backend.social(typ, null, [newAccount]));
      }
      var newCon: backend.contact = new backend.contact(this.uid, usr.getUsername, usr.getName, usr.getEmail, usr.getPhoneNumber, usr.getDOB, usr.getPhoto, usr.getSocials);
      var newQr: backend.qrCode = new backend.qrCode(this.uid, newCon);
      var updates = {};
      updates['Users/'+this.uid+'/socials'] = userSocials;
      updates['Users/'+this.uid+'/qrCodes/0/'] = newQr;
      firebase.database().ref().update(updates);
    });
  }
  // delete social account
  async deleteSocialAccount(typ: string, sAcot: backend.socialAccount) {
    var userSocialAccounts: {} [];
    var userSocials: {} [] = [];
    await this.getUserData().then(usr => {
      userSocials = usr.getSocials;
      let i:number = 0;
      for(; i < userSocials.length; i++){
        if(userSocials[i]['type'] == typ){
          break;
        }
      }
      this.getSocialAccountsType(typ).then(dat => {
        userSocialAccounts = dat;
        for(let j:number = 0; j < userSocialAccounts.length; j++){
          if(userSocialAccounts[j]['id'] == sAcot['id'] && userSocialAccounts[j]['user'] == sAcot['user'] && userSocialAccounts[j]['url'] == sAcot['url']){
            userSocialAccounts.splice(j,1);
            break;
          }
        }
        var updates = {};
        userSocials[i]['socialAccounts'] = userSocialAccounts;
        var newCon: backend.contact = new backend.contact(this.uid, usr.getUsername, usr.getName, usr.getEmail, usr.getPhoneNumber, usr.getDOB, usr.getPhoto, usr.getSocials);
        var newQr: backend.qrCode = new backend.qrCode(this.uid, newCon);

        updates['Users/'+this.uid+'/socials'] = userSocials;
        updates['Users/'+this.uid+'/qrCodes/0/'] = newQr;
        firebase.database().ref().update(updates);
      });
    });
  }
  // Update social account
  async updateSocialAccount(typ: string, old: backend.socialAccount, saerowon: backend.socialAccount) {
    var userSocialAccounts: {} [] = [];
    var userSocials: {} [] = [];
    await this.getUserData().then(usr => {
      userSocials = usr.getSocials;
      let i:number = 0;
      for(; i < userSocials.length; i++){
        if(userSocials[i]['type'] == typ){
          break;
        }
      }
      this.getSocialAccountsType(typ).then(dat => {
        userSocialAccounts = dat;
        for(let j: number = 0; j<userSocialAccounts.length; j++) {
          if(userSocialAccounts[j]['id'] == old['id'] && userSocialAccounts[j]['user'] == old['user'] && userSocialAccounts[j]['url'] == old['url']){
            userSocialAccounts[j] = saerowon;
            break;
          }
        }
        var updates = {};
        userSocials[i]['socialAccounts'] = userSocialAccounts;
        var newCon: backend.contact = new backend.contact(this.uid, usr.getUsername, usr.getName, usr.getEmail, usr.getPhoneNumber, usr.getDOB, usr.getPhoto, usr.getSocials);
        var newQr: backend.qrCode = new backend.qrCode(this.uid, newCon);
        updates['Users/'+this.uid+'/socials'] = userSocials;
        updates['Users/'+this.uid+'/qrCodes/0/'] = newQr;
        firebase.database().ref().update(updates);
      });
    });
  }
  // Generate social account object from user name for the following platforms: Facebook, Instagram, Snapchat, Twitter
  generateSocialAccountFromInfo(typ: string, username_user: string, id_user: string, url_user: string): backend.socialAccount {
    var sca: backend.socialAccount = new backend.socialAccount(username_user,username_user,null);
    if(typ == 'facebook') {
      sca.setUrl = 'https://www.facebook.com/'+username_user;
    } else if(typ == 'instagram') {
      sca.setUrl = 'https://www.instagram.com/'+username_user;
    } else if(typ == 'snapchat') {
      sca.setUrl = 'https://www.snapchat.com/add/'+username_user;
    } else if(typ == 'twitter') {
      sca.setUrl = 'https://www.twitter.com/'+username_user;
    } else {
      sca.setId = id_user;
      sca.setUrl = url_user;
    }
    return sca;
  }
  // Getting social accounts of a given type
  async getSocialAccountsType(type: string) : Promise<backend.socialAccount []> {
    var socialAccs: backend.socialAccount[];
    const usr = await this.getUserData()
    let found: boolean = false;
    let socials: {}[] = usr.getSocials;
    for(let i: number = 0; i<socials.length && !found; i++) {
      if(socials[i]['type'] == type) {
        socialAccs = socials[i]['socialAccounts'];
        found = true;
      }
    }
    if(!found){
      socialAccs = [new backend.socialAccount(null,null,null)];
    }
    return socialAccs;
  }
  // Gets a contacts accessible socials
  async getContactAccessSocials(usrName: string): Promise<backend.social []> {
    var conts: {} [] = [];
    var accessSocials: backend.social[] = [];
    await this.getUserData().then(usr => {
      conts = usr.getContacts;
      for(let i: number = 0; i<conts.length; i++) {
    
        if(conts[i]['username'] == usrName) {
          accessSocials.push(conts[i]['accessSocials']);
        }
      }
    });

    return accessSocials;
  }
  // Gets social accounts of a type from a contact
  async getSocialAccountsTypeContact(type: string, usrName: string) : Promise<backend.socialAccount []> {
    var socialAccs: backend.socialAccount[];
    await this.getContactAccessSocials(usrName).then(usr => {
      let found: boolean = false;
      let socials: {} [] = usr['0'];
      for(let i: number = 0; i<socials.length && !found; i++) {
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
  // Upload user taken photo to profile and return url
  async takeAndUploadProfilePhoto(camera: Camera): Promise<string> {
    var urlPic: string;
    await this.cam.takeSelfie(camera).then(async profilePic => {
      if(!(profilePic == "N/A")) {
        const name = new Date().getTime().toString();
        await firebase.storage().ref('Profile Pics/'+this.uid+'/'+name).putString(profilePic, 'base64', {contentType: 'image/jpeg'}).then(async urlSnap => {
          await firebase.storage().ref('Profile Pics/'+this.uid+'/'+name).getDownloadURL().then(url => {
            urlPic = url;
          });
        });
      }
    });
    if(urlPic == null || urlPic == '' || urlPic == 'N/A') {
      this.getUserData().then(usr => {
        urlPic = usr.getPhoto;
      });
    }
    var updates: {} = {};
    updates['Users/'+this.uid+'/photo'] = urlPic;
    updates['Users/'+this.uid+'/first'] = false;
    firebase.database().ref().update(updates);
    return urlPic;
  }
  // Upload user photo to profile and return url
  async uploadProfilePhoto(imagePicker: ImagePicker): Promise<string> {
    var urlPic: string;
    var options: ImagePickerOptions = {
      maximumImagesCount: 1,
      quality: 75,
      outputType: OutputType.DATA_URL
    }
  
    const name = new Date().getTime().toString();
    const result = await imagePicker.getPictures(options)
    .catch((error) => {
      throw new Error(error)
    });

    const urlSnap =  await firebase.storage().ref('Profile Pics/'+this.uid+'/'+name).putString('data:text/plain;base64,'+result, 'data_url', {contentType: 'image/jpeg'})
    urlPic = await firebase.storage().ref('Profile Pics/'+this.uid+'/'+name).getDownloadURL();
  
    var updates: {} = {};
    updates['Users/'+this.uid+'/photo'] = urlPic;
    updates['Users/'+this.uid+'/first'] = false;
    firebase.database().ref().update(updates);
    return urlPic;
  }
  // Toggles the first boolean of a user
  async toggleFirst() {
    var updates: {} = {};
    await this.getUserData().then(async usr => {
      updates['Users/'+this.uid+'/first'] = false;
      await firebase.database().ref().update(updates);
    });
  }
  // Runs first login cloud function
  async firstTimeLogin(): Promise<{}> {
    var firstLogin = firebase.functions().httpsCallable('firstLogin');
    var ret: {} = {};
    await firstLogin(this.uid).then(val => {
      ret = val;
    });
    return ret;
  }
  // Logs Out
  async logOut() {
    await firebase.auth().signOut()
  }

  async deleteAccount(uid: string)
  {
    await firebase.database().ref('Users/'+ uid).remove()
  }
}
