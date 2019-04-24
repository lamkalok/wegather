import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ShareServiceProvider } from '../../providers/share-service/share-service';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { UserServiceProvider } from '../../providers/user-service/user-service';
import { GroupServiceProvider } from '../../providers/group-service/group-service';
import { EventServiceProvider } from '../../providers/event-service/event-service';
import { Observable } from 'rxjs';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
/**
 * Generated class for the EventDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-event-detail',
  templateUrl: 'event-detail.html',
})
export class EventDetailPage {

  event: Observable<any>;
  id: string;
  date_from: Date;
  date_to: Date;
  numberOfAttendedMembers: number;
  attendedMembers = [];
  organizerName: string;
  joinedThisEvent = false;
  isOrganizer = false;
  now = Date.now();
  isOver = false;
  eventOnGoing = false;
  isClaim = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public shareServiceProvider: ShareServiceProvider,
    public authServiceProvider: AuthServiceProvider,
    public userServiceProvider: UserServiceProvider,
    public groupServiceProvider: GroupServiceProvider,
    public eventServiceProvider: EventServiceProvider,
    public alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
  ) {
    var eventSnapshot = navParams.data;
    this.id = eventSnapshot.id;
    console.log("now", this.now);
    if (this.id != null) {
      try {
        eventServiceProvider.getEvent(eventSnapshot.id).then((e) => {
          this.event = e;
          //subscribe is also real time update
          this.event.subscribe(e => {
            
            console.log("event: ", e);

            if(e.isClaim) {
              this.isClaim = true;
            }
            this.date_from = e.date_from.toDate();
            this.date_to = e.date_to.toDate();
            this.numberOfAttendedMembers = e.attendedMembers.length;

            console.log("OnGoing?", this.now - this.date_from.getTime());
            console.log("Over? ", this.now - this.date_to.getTime());

            if (this.now - this.date_from.getTime() > 0 && this.now - this.date_to.getTime() < 0) {
              this.eventOnGoing = true;
            }

            if (this.now - this.date_to.getTime() > 0) {
              this.isOver = true;
            }

            if (e.organizerID == this.authServiceProvider.getLoggedUID()) {
              this.isOrganizer = true;
            }

            this.userServiceProvider.getUser(e.organizerID).then((organizer) => {
              this.organizerName = organizer.name;
            });

            this.attendedMembers = [];

            e.attendedMembers.forEach(attendedMemberID => {
              if (attendedMemberID == this.authServiceProvider.getLoggedUID()) {
                this.joinedThisEvent = true;
              }
              this.userServiceProvider.getUser(attendedMemberID).then((user) => {
                if(!this.attendedMembers.find( am => am.name == user.name )){
                  this.attendedMembers.push(user);
                }
                  
              })
            });

            // console.log("attend Members", this.attendedMembers);

            // this.attendedMembers = this.attendedMembers.filter(function(item, pos) {
            //   return this.attendedMembers.indexOf(item) == pos;
            // })

            // // check new updated element add to groups
            // var updated = false;
            // for (var i = 0; i < this.groups.length; i++) {
            //   if (this.groups[i].id == g.id) {
            //     this.groups.splice(i, 1, g);
            //     updated = true;
            //     break;
            //   }
            // }

          })
        });

      } catch (error) {

      }
    }
  }

  goToMemberList(){
    this.navCtrl.push('UsersListPage', this.attendedMembers)
  }


  scan() {
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Barcode data', barcodeData.text);
      var uid = barcodeData.text;
      if (uid == this.authServiceProvider.getLoggedUID()) {
        this.shareServiceProvider.showAlert("You can not take attendance record of yourself")
      } else {
        this.eventServiceProvider.takeAttendance(uid, this.id).then((msg) => {
          this.shareServiceProvider.showAlertWithTitle(msg.message, msg.title);
        });
      }
    }).catch(err => {
      console.log('Error', err);
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EventDetailPage');
  }

  goEvent() {
    const confirm = this.alertCtrl.create({
      title: "Join event",
      message: "Are you sure to join this event?",
      buttons: [
        {
          text: 'Disagree',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Agree',
          handler: () => {
            console.log('Agree clicked');
            this.eventServiceProvider.addMemeberToEvent(this.authServiceProvider.getLoggedUID(), this.id).then(() => {
              this.joinedThisEvent = true;
              this.shareServiceProvider.showToast("Join event successfully");
            });
          }
        }
      ]
    });
    confirm.present();
  }

  quitEvent() {
    const confirm = this.alertCtrl.create({
      title: "Quit event",
      message: "Are you sure to quit this event?",
      buttons: [
        {
          text: 'Disagree',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Agree',
          handler: () => {
            console.log('Agree clicked');
            this.eventServiceProvider.removeMemberFromEvent(this.authServiceProvider.getLoggedUID(), this.id).then(() => {
              this.joinedThisEvent = false;
              this.shareServiceProvider.showToast("Quit event successfully");
            });
          }
        }
      ]
    });
    confirm.present();
  }

  claimWecoin() {
    var data = {
      eventId: this.id,
      // eventDetailPage: this
    }
    this.navCtrl.push("EventClaimWecoinPage", data);
  }

}
