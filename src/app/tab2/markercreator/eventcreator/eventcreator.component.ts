import {AfterViewInit, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Calendar} from '@ionic-native/calendar/ngx';
import {AlertController, ModalController} from '@ionic/angular';
import {environment} from '../../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import { UsersService } from 'src/app/services/users.service';
import { AuthHandler } from 'src/app/services/authHandler.service';
import { UtilsService } from 'src/app/services/utils.service';
import { EventsService } from 'src/app/services/events.service';
import { LinkSelectorPage } from '../link-selector/link-selector.page';
import { of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-eventcreator',
    templateUrl: './eventcreator.component.html',
    styleUrls: ['./eventcreator.component.scss'],
    providers:[]
})
export class EventcreatorComponent implements OnInit, AfterViewInit, OnDestroy {
    map: mapboxgl.Map;
    currentUser: any;
    geocoder: any;
    eventName: string;
    location: Array<any>;
    isPrivate: boolean;
    links: Array<string>;
    eventDes: string;
    eventType: string;
    @Input() eventID: string;
    editMode: boolean;
    isCreator: boolean;
    eventCreator: any;
    eventCreatorName: string;
    eventsSub: Subscription;
    linksSub: Subscription;
    //NEELEY
    availableStartDays: string;
    availableStartMonths: string;
    availableStartYears: string;
    availableEndDays: string;
    availableEndMonths: string;
    availableEndYears: string;

    constructor(private cal: Calendar, private alertController: AlertController, private modalController: ModalController,
        private utils: UtilsService,
                private us: UsersService, private auth: AuthHandler, private es: EventsService) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.isPrivate = false;
    }


    ngOnInit() {
        this.createTimeString();
        this.editMode = this.eventID !== '';
        (document.getElementById('startTime') as HTMLInputElement).value = new Date().toISOString();
        (document.getElementById('endTime') as HTMLInputElement).value = new Date().toISOString();
        if (this.editMode) {
           this.renderEditMode();
        } else {
            this.renderNewMode();
        }
    }

    createTimeString(){
      let currentDay = (new Date()).getDate();
      let currentMonth = ((new Date()).getMonth() + 1);
      let currentYear = (new Date()).getFullYear();
      let nextDay = 0;
      let nextMonth = 0;
      let nextYear = 0;
      this.availableStartDays = currentDay.toString();
      this.availableEndDays = currentDay.toString();
      //year
      if((currentDay + 7) > 31 && currentMonth === 12){
        nextYear = currentYear++;
        this.availableStartYears = currentYear.toString() + ", " + nextYear.toString();
      }else{
        this.availableStartYears = currentYear.toString();
      }
      if((currentDay + 8) > 31 && currentMonth === 12){
        nextYear = currentYear++;
        this.availableEndYears = currentYear.toString() + ", " + nextYear.toString();
      }else{
        this.availableEndYears = currentYear.toString();
      }
      //month
      //feb: 28 or 29 && year % 4 = 0; april, june, september, nov: 30
      if((currentMonth === 2 && (currentDay + 7) > 28 && currentYear % 4 !== 0) ||
        (currentMonth === 2 && (currentDay + 7) > 29 && currentYear % 4 === 0) ||
        (currentMonth === 4 || currentMonth === 6 || currentMonth === 9 || currentMonth === 11)
          && ((currentDay + 7) > 30)){
        nextMonth = currentMonth++;
        this.availableStartMonths = currentMonth.toString() + ", " + nextMonth.toString();
      //december
      }else if(currentMonth === 12 && (currentDay + 7) > 31){
        nextMonth = 1;
        this.availableStartMonths = currentMonth.toString() + ", " + nextMonth.toString();
      }else{
        this.availableStartMonths = currentMonth.toString();
      }
      if((currentMonth === 2 && (currentDay + 8) > 28 && currentYear % 4 !== 0) ||
        (currentMonth === 2 && (currentDay + 8) > 29 && currentYear % 4 === 0) ||
        (currentMonth === 4 || currentMonth === 6 || currentMonth === 9 || currentMonth === 11)
          && ((currentDay + 8) > 30)){
        nextMonth = currentMonth++;
        this.availableEndMonths = currentMonth.toString() + ", " + nextMonth.toString();
      //december
      }else if(currentMonth === 12 && (currentDay + 8) > 31){
        nextMonth = 1;
        this.availableEndMonths = currentMonth.toString() + ", " + nextMonth.toString();
      }else{
        this.availableEndMonths = currentMonth.toString();
      }
      //day
      currentDay++;
      let currentDayHold = currentDay;
      for(var i = 0; i < 7; i++){
        if((currentMonth === 2 && (currentDayHold + 7) > 28 && currentYear % 4 !== 0) ||
          (currentMonth === 2 && (currentDayHold + 7) > 29 && currentYear % 4 === 0) ||
          (currentMonth === 4 || currentMonth === 6 || currentMonth === 9 || currentMonth === 11)
            && ((currentDayHold + 7) > 30)){
          currentDayHold = 1;
        }
        this.availableStartDays += ", " + currentDayHold.toString();
        currentDayHold++;
      }
      for(var i = 0; i < 8; i++){
        if((currentMonth === 2 && (currentDay + 8) > 28 && currentYear % 4 !== 0) ||
          (currentMonth === 2 && (currentDay + 8) > 29 && currentYear % 4 === 0) ||
          (currentMonth === 4 || currentMonth === 6 || currentMonth === 9 || currentMonth === 11)
            && ((currentDay + 8) > 30)){
          currentDay = 1;
        }
        this.availableEndDays += ", " + currentDay.toString();
        currentDay++;
      }
    }


    ngAfterViewInit() {
        this.buildMap();
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.width = '100%';
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.height = 'auto';
    }

    ngOnDestroy() {
        this.eventsSub?.unsubscribe();
        this.linksSub?.unsubscribe();
    }

    renderNewMode(){
        this.isCreator = true;
        this.us.getUserBasic(this.auth.getUID()).subscribe((userRef: any) => {
            this.eventCreatorName = userRef.data.name;
        });
        this.links = [];
    }

    renderEditMode(){
        this.links = [];

        this.eventsSub = this.es.getEventDetails(this.eventID).subscribe((ref:any) => {
            const data = ref.data;
            (document.getElementById('startTime') as HTMLInputElement).value = data.startTime;
            (document.getElementById('endTime') as HTMLInputElement).value = data.endTime;
            this.eventName = data.eventName;
            this.eventCreator = data.creator.id;
            this.eventCreatorName = data.creator.name;
            this.eventDes = data.description;
            this.isPrivate = data.isPrivate;
            this.eventType = data.type;
            this.location = [data.location.latitude,data.location.longitude];
            this.map.flyTo({
                center: this.location,
                essential: true
            });
            this.isCreator = data.creator.uid === this.auth.getUID();
            new mapboxgl.Marker().setLngLat(this.location).addTo(this.map);
        }, (error) => console.error(error));

        if(!this.isPrivate){
            this.linksSub = this.es.getEventShares(this.eventID, 0).subscribe((ref:any) => {
                for(const object of ref.data){
                    this.links.push(object.uid);
                }
                console.log(this.links);
            }, (error) => console.error(error));
        }
    }

    buildMap() {
        if (this.editMode) {
            this.map = new mapboxgl.Map({
                container: 'choosermap',
                style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
                zoom: 15,
                center: this.location
            });
        } else {
            this.map = new mapboxgl.Map({
                container: 'choosermap',
                style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
                zoom: 2,
            });
        }
        // @ts-ignore
        this.geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl
        });
        document.getElementById('geocoder-container').appendChild(this.geocoder.onAdd(this.map));
        this.geocoder.on('result', (res) => {
            this.location = res.result.geometry.coordinates;
        });
    }

    async showLinks() {
        const modal = await this.modalController.create({
            component: LinkSelectorPage,
            componentProps: {
                ids: this.links
            }
        });

        modal.onDidDismiss().then(data => {
            this.links = data.data;
        });

        return await modal.present();
    }

    async manageEvent() {
        if (this.eventName === '' || (document.getElementById('startTime') as HTMLInputElement).value === '' || (document.getElementById('endTime') as HTMLInputElement).value === '' || this.eventDes === '' || this.eventType === ''
            || typeof this.location === 'undefined') {
            this.utils.presentToast('Whoops! You have an empty entry');
        } else if (new Date((document.getElementById('startTime') as HTMLInputElement).value) > new Date((document.getElementById('startTime') as HTMLInputElement).value)) {
            this.utils.presentToast('Whoops! Your event ended before it started');
        } else {

            // TODO propogate changes
            const data = {
                eventName: this.eventName,
                location: {
                    latitude: this.location[1],
                    longitude: this.location[0]
                },
                // tslint:disable-next-line:max-line-length
                startTime: (document.getElementById('startTime') as HTMLInputElement).value,
                // tslint:disable-next-line:max-line-length
                endTime: (document.getElementById('endTime') as HTMLInputElement).value,
                description: this.eventDes,
                type: this.eventType,
                isPrivate: this.isPrivate
            };

            if (!this.editMode) {
                this.es.createEvent(data).pipe(switchMap((output:any) => {
                    if(this.isPrivate){
                        return this.es.inviteAttendee(output.data.id, this.links);
                    }else{
                        return of("");
                    }
                })).subscribe(() => {
                    this.utils.presentToast('Event Created!');
                    this.closeModal();
                }, err => {
                    console.error(err);
                    this.utils.presentToast('Whoops! Problem making event');
                });
            } else {
                this.es.editEvent(this.eventID, data).subscribe(() => {
                    if(this.isPrivate){
                        this.es.inviteAttendee(this.eventID, this.links).subscribe(() => {
                            this.utils.presentToast('Event Updated!');
                            this.closeModal();
                        }, (error)=>console.error(error));
                    }
                    this.utils.presentToast('Event Updated!');
                    this.closeModal();
                }, err => {
                    console.error(err);
                    this.utils.presentToast('Whoops! Problem updating event');
                });
            }
        }
    }

    handleInput(event) {
        const query = event.target.value.toLowerCase();
        for (let i = 0; i < document.getElementsByTagName('ion-item').length; i++) {
            const shouldShow = document.getElementsByTagName('h2')[i].textContent.toLowerCase().indexOf(query) > -1;
            document.getElementsByTagName('ion-item')[i].style.display = shouldShow ? 'block' : 'none';
        }
    }

    async deleteEvent() {
        const alert = await this.alertController.create({
            header: 'Confirm Event Delete',
            message: 'Are you sure you want to delete this event?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: 'Delete',
                    handler: () => {
                        this.es.deleteEvent(this.eventID).subscribe(() => {
                            this.modalController.dismiss();
                        }, (err) => {
                            console.error(err);
                            this.utils.presentToast('Whoops! Event Delete Failed');
                        });
                    }
                }
            ]
        });

        await alert.present();
    }

    downloadEvent() {
        const reqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + this.location[0] + ',' + this.location[1] + '.json?access_token=' +
            mapboxgl.accessToken;

        // get info from api
        fetch(reqStr).then(response => response.json())
            .then(data => {
                this.cal.createEventInteractively(this.eventName, data.features[0].place_name, this.eventDes,
                    new Date((document.getElementById('startTime') as HTMLInputElement).value),
                    new Date((document.getElementById('endTime') as HTMLInputElement).value)).then(r => {
                    this.utils.presentToast('Event Downloaded!');
                });
            });
    }

    closeModal() {
        this.modalController.dismiss();
    }

}
