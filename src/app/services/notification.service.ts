import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ActionPerformed, PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { ModalController } from '@ionic/angular';
import { RequestsPage } from '../requests/requests.page';
import { MarkercreatorPage } from '../tab2/markercreator/markercreator.page';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private us: UsersService, private r: Router, private modalController: ModalController) { }

  initPush() {
    if (Capacitor.getPlatform() !== 'web') {
      this.registerPush();
    }
  }

  private registerPush() {
    PushNotifications.requestPermissions().then((permission) => {
      if (permission.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // No permission for push granted
      }
    });

    PushNotifications.addListener(
      'registration',
      (token: Token) => {
        this.us.setNotifToken(token.value).subscribe();
      }
    );

    PushNotifications.addListener('registrationError', (error: any) => {
      console.log('Error: ' + JSON.stringify(error));
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
      }
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async (notification: ActionPerformed) => {
        let modal: HTMLIonModalElement;
        switch(notification.notification.title){
          case 'New Request!':
            modal = await this.modalController.create({
              component: RequestsPage
            });
            return await modal.present();
          case 'New Ping!':
          case 'Ping Reply!':
            return this.r.navigate(['/circledash']);
          case 'Event Invite!':
          case 'Updated Event!':
            modal = await this.modalController.create({
              component: MarkercreatorPage,
              componentProps: {
                eventID: notification.notification.data.id,
              }
            });
            return await modal.present();
          default:
            return;
        }
      }
    );
  }


}
