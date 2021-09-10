import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ModalController} from '@ionic/angular';
import { LinksService } from 'src/app/services/links.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
    selector: 'app-link-selector',
    templateUrl: './link-selector.page.html',
    styleUrls: ['./link-selector.page.scss'],
    providers: []
})
export class LinkSelectorPage implements OnInit, OnDestroy {
    links: any;
    userArray: Array<string>;
    offset: number;
    linksBS: BehaviorSubject<number>;
    @Input() ids: Array<string>;

    constructor(private modalController: ModalController, private ls: LinksService, private utils: UtilsService) {
    }

    ngOnInit() {
        this.offset = 0;
        this.userArray = this.ids;
        this.linksBS = new BehaviorSubject(this.offset);
        this.linksBS.subscribe(() => this.getLinks());
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

    async closeModal(isSubmit = false) {
        if(isSubmit && this.userArray.length > 20){
            await this.utils.presentToast('Whoops! Too many people');
        } else {
            await this.modalController.dismiss(this.userArray);
        }
    }

    updateLinkList() {
        const toggle = (document.getElementsByTagName('ion-checkbox') as unknown as Array<HTMLIonCheckboxElement>);
        this.userArray = [];
        for (const element of toggle) {
            if (element.checked) {
                this.userArray.push(element.id);
            }
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
}
