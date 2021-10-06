import {Component, Input, OnInit} from '@angular/core';
import {Calendar} from '@ionic-native/calendar/ngx';
import { ModalController } from '@ionic/angular';
import { UsersService } from 'src/app/services/users.service';

@Component({
    selector: 'app-markercreator',
    templateUrl: './markercreator.page.html',
    styleUrls: ['./markercreator.page.scss'],
    providers: [Calendar]
})

export class MarkercreatorPage implements OnInit {
    @Input() eventID: string;
    @Input() tapLocation: Array<any>;
    segmentShown: string;
    editMode: boolean;

    constructor(private modalController: ModalController, public us: UsersService) {
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
