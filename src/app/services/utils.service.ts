import { Injectable } from '@angular/core';
import {LoadingController, ToastController} from '@ionic/angular'

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(private toastController: ToastController, private loadingController: LoadingController) { }


  convertTime(t) {
    if (t >= 86_400_000) {
        // days
        return Math.floor(t / 86_400_000) + 'd ago';
    } else if (t >= 3_600_000) {
        // hours
        return Math.floor(t / 3_600_000) + 'h ago';
    } else if (t >= 60_000) {
        // mins
        return Math.floor(t / 60_000) + 'm ago';
    } else if (t >= 1000) {
        // secs
        return Math.floor(t / 1000) + 's ago';
    } else {
        return 'Just Now';
    }
}

  async presentAlert(message: string){
    const loading = await this.loadingController.create({
      message,
      duration: 30000
    });
    await loading.present();
    return loading;
  }

  async presentToast(displayMessage: string, type: string) {
    let position: 'top' | 'bottom';
    let color: string;

    switch(type){
      case 'error':
        position = 'bottom';
        color = 'danger'
        break;
      case 'warning':
        position = 'bottom';
        color = 'light';
        break;
      case 'success':
        position = 'top';
        color = 'success';
        break;
      default:
        position = 'bottom';
        color = 'light';
    }

    const toast = await this.toastController.create({
        message: displayMessage,
        color,
        position,
        duration: 2000
    });
    await toast.present();
  }
}
