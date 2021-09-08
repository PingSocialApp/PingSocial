import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LinksService } from 'src/app/services/links.service';
import { EventTypeEnums } from 'src/app/tab2/markercreator/eventcreator/events.model';
import { MarkercreatorPage } from 'src/app/tab2/markercreator/markercreator.page';

@Component({
  selector: 'app-activity-status',
  templateUrl: './activity-status.component.html',
  styleUrls: ['./activity-status.component.scss'],
})
export class ActivityStatusComponent implements OnInit {
  linksBS: BehaviorSubject<number>;
  offset: any;
  links: Observable<any>;

  constructor(private modalController: ModalController, private ls: LinksService) { }

  ngOnInit() {
    this.offset = 0;
    this.linksBS = new BehaviorSubject(this.offset);
    this.linksBS.subscribe(() => this.getLinks());
  }

  getLinks(){
    this.links = this.ls.getLastCheckedInLocations(this.offset).pipe(map(response => {
      return {
        isDone: response.isDone,
        data: response.data.map(val => {
          let pic: string;

          switch (val.eventType) {
            case EventTypeEnums.HANGOUT: {
              pic = 'assets/ping_markers/hangout100_activity.png';
              break;
            }
            case EventTypeEnums.PROFESSIONAL: {
              pic = 'assets/ping_markers/networking100_activity.png';
              break;
            }
            case EventTypeEnums.PARTY: {
              pic = 'assets/ping_markers/party100_activity.png';
              break;
            }
            default:{
              break;
            }
          }

          return {
            user: val.user,
            eventName: val.eventName,
            eventId: val.eventId,
            eventType: pic
          }
        })
      }
    }));
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

  async openEventModal(id:string) {
    const modal = await this.modalController.create({
        component: MarkercreatorPage,
        componentProps: {
            eventID: id
        }
    });
    return await modal.present();
}
}
