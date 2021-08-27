import {Component, OnDestroy, OnInit} from '@angular/core';
import {SettingsPage} from '../settings/settings.page';
import {ModalController} from '@ionic/angular';
import {RequestsPage} from '../requests/requests.page';
import {BehaviorSubject, Observable} from 'rxjs';
import { LinksService } from '../services/links.service';
import { RequestsService } from '../services/requests.service';
import { AngularFireDatabase } from '@angular/fire/database';

@Component({
    selector: 'app-tab3',
    templateUrl: 'tab3.page.html',
    styleUrls: ['tab3.page.scss'],
    providers: [AngularFireDatabase]
})

export class Tab3Page implements OnInit, OnDestroy {
    requestAmount: Observable<number | any>;
    links: any;
    offset: number;
    linksBS: BehaviorSubject<number>;

    constructor(private modalController: ModalController, private ls: LinksService, private rs: RequestsService) {
    }

    ngOnInit() {
        this.offset = 0;
        this.linksBS = new BehaviorSubject(this.offset);
        this.linksBS.subscribe(() => this.getLinks());
        this.requestAmount = this.rs.getTotalNumRequests();
    }

    ngOnDestroy() {
    }

    getLinks() {
        this.links = this.ls.getAllLinks(this.offset);
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

    doRefresh(event) {
        this.offset = 0;
        this.linksBS.next(this.offset);
        event.target.complete();
    }

    loadData(event){
        ++this.offset;
        this.linksBS.next(this.offset);
        event.target.complete();
    }

    async presentRequestsPage() {
        const modal = await this.modalController.create({
            component: RequestsPage
        });
        return await modal.present();
    }

    async presentSettingsModal() {
        const modal = await this.modalController.create({
            component: SettingsPage
        });
        return await modal.present();
    }
}