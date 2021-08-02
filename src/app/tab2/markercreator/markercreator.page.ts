import {Component, Input, OnInit} from '@angular/core';
import {Calendar} from '@ionic-native/calendar/ngx';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'app-markercreator',
    templateUrl: './markercreator.page.html',
    styleUrls: ['./markercreator.page.scss'],
    providers: [Calendar]
})

export class MarkercreatorPage implements OnInit {
    @Input() eventID: string;
    segmentShown: string;
    editMode: boolean;

    constructor(private modalController: ModalController) {
    }

    ngOnInit() {
        this.editMode = this.eventID !== '';
        this.segmentShown = this.editMode ? 'event' : 'geo-ping';
    }

    closeModal(){
        this.modalController.dismiss();
    }

    segmentChanged($event: any) {
        this.segmentShown = $event.detail.value;
    }
}
