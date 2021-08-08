import { Injectable } from '@angular/core';
import {ToastController} from '@ionic/angular'

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(private toastController: ToastController) { }

  async presentToast(displayMessage: string) {
    const toast = await this.toastController.create({
        message: displayMessage,
        duration: 2000
    });
    await toast.present();
  }
}
