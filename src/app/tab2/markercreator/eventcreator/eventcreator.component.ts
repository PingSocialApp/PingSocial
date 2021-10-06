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
import { EventTypeEnums } from './events.model';

@Component({
    selector: 'app-eventcreator',
    templateUrl: './eventcreator.component.html',
    styleUrls: ['./eventcreator.component.scss'],
    providers:[]
})

export class EventcreatorComponent implements OnInit, AfterViewInit, OnDestroy {
    map: mapboxgl.Map;
    currentUser: any;
    geocoder: mapboxgl.geocoder;
    eventName: string;
    location: Array<number>;
    isPrivate: boolean;
    links: Array<string>;
    eventDes: string;
    eventType: string;
    @Input() eventID: string;
    @Input() tapLocation: Array<any>;
    editMode: boolean;
    isCreator: boolean;
    eventCreator: any;
    eventCreatorName: string;
    eventsSub: Subscription;
    linksSub: Subscription;
    availableStartDays: string;
    availableStartMonths: string;
    availableStartYears: string;
    availableEndDays: string;
    availableEndMonths: string;
    availableEndYears: string;
    minimumStartTime: string;
    minimumEndTime: string;
    maximumStartTime: string;
    maximumEndTime: string;
    afterStartTime: boolean;
    afterEndTime: boolean;
    @Input() currentLocation: Array<number>;
    offset: any
    isEnded: boolean;
    EventType: any;

    constructor(private cal: Calendar, private alertController: AlertController, private modalController: ModalController,
        private utils: UtilsService,
                private us: UsersService, private auth: AuthHandler, private es: EventsService) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.isPrivate = false;
        this.EventType = EventTypeEnums;
    }

    ngOnInit() {
        this.isCreator = true;
        this.afterStartTime = false;
        this.editMode = this.eventID !== '';
        this.offset = (new Date().getTimezoneOffset())*60000;
        this.minimumStartTime = new Date(new Date(new Date().toDateString()).getTime() - this.offset).toISOString();
        this.maximumStartTime = new Date(new Date(new Date().toDateString()).getTime() - this.offset + 604800000 - 500).toISOString();
        this.minimumEndTime = new Date(new Date(new Date().toDateString()).getTime() - this.offset).toISOString();
        this.maximumEndTime = new Date(new Date(new Date().toDateString()).getTime() + 86400000 - this.offset).toISOString();

        this.location = [0,0];

        this.eventName = '';
        this.eventDes = '';

        if(this.editMode) {
            (document.getElementById('startTime') as HTMLInputElement).value = new Date().toISOString();
            (document.getElementById('endTime') as HTMLInputElement).value = new Date().toISOString();
            this.renderEditMode();
        } else {
            this.renderNewMode();
        }
    }

    updateEndTimeMinimum(){
      this.minimumEndTime = new Date(new Date(new Date((document.getElementById('startTime') as HTMLInputElement).value)
        .toDateString()
      ).getTime() - this.offset + 300000).toISOString();
       this.maximumEndTime = new Date(new Date(new Date(this.minimumEndTime).toDateString()).getTime()
       + 86400000*3 - this.offset - 60000).toISOString();
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
        this.eventCreatorName = this.us.myObj.name;
        this.links = [];
    }

    renderEditMode(){
        this.links = [];

        this.eventsSub = this.es.getEventDetails(this.eventID).subscribe((ref:any) => {
            const data = ref.data;
            this.afterStartTime = new Date().getTime() - new Date(data.startTime).getTime() >= 300000;
            this.afterEndTime = new Date().getTime() >= new Date(data.endTime).getTime();

            (document.getElementById('startTime') as HTMLInputElement).value = data.startTime;
            (document.getElementById('endTime') as HTMLInputElement).value = data.endTime;
            this.eventName = data.eventName;
            this.eventCreator = data.creator.uid;
            this.eventCreatorName = data.creator.name;
            this.eventDes = data.description;
            this.isPrivate = data.isPrivate;
            this.eventType = data.type;
            this.isEnded = data.isEnded;
            this.location = [data.location.latitude,data.location.longitude];
            this.map.flyTo({
                center: this.location,
                essential: true
            });
            this.isCreator = data.creator.uid === this.auth.getUID();
            new mapboxgl.Marker().setLngLat(this.location).addTo(this.map);
        }, (error) => {
            this.utils.presentToast('Whoops! Unable to get Event Details', 'error');
            console.error(error)
        });

        if(!this.isPrivate){
            this.linksSub = this.es.getEventShares(this.eventID, 0).subscribe((ref:any) => {
                for(const object of ref.data){
                    this.links.push(object.uid);
                }
            }, (error) => {
                console.error(error);
                this.utils.presentToast('Whoops! Unable to get links', 'error');
            });
        }
    }

    buildMap() {
        let tempLocation = [];
        if(this.tapLocation){
          tempLocation = this.tapLocation;
        }else{
          tempLocation = this.currentLocation;
        }
        this.map = new mapboxgl.Map({
            container: 'choosermap',
            style: environment.mapbox.style,
            zoom: 15,
            center: tempLocation
        });
        const marker = new mapboxgl.Marker({color: '#8FDEE6'});
        if(this.tapLocation){
          marker.setLngLat(this.tapLocation);
        }else{
          marker.setLngLat(this.currentLocation);
        }
        marker.addTo(this.map);

        if(!this.editMode){
          if(this.tapLocation){
            this.location = [this.tapLocation[1],this.tapLocation[0]];
          }else{
            this.location = [this.currentLocation[1],this.currentLocation[0]];
          }
        }

        if(this.isCreator && !this.afterStartTime){
            // @ts-ignore
            this.geocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl,
                marker: false
            });
            const marker = new mapboxgl.Marker({draggable: true}).setLngLat(this.currentLocation).addTo(this.map);
            marker.on('dragend', () => {
                const lngLat = marker.getLngLat();
                this.location = [lngLat.lat,lngLat.lng];
            });

            document.getElementById('geocoder-container').appendChild(this.geocoder.onAdd(this.map));
            this.geocoder.on('result', (res) => {
                marker.setLngLat(res.result.geometry.coordinates);
                this.location = [res.result.geometry.coordinates[1],res.result.geometry.coordinates[0]];
            });
        }

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
        if(this.eventName === ''){
            this.utils.presentToast('Whoops! Missing Event Name', 'warning');
        }else if(this.eventDes === ''){
            this.utils.presentToast('Whoops! Missing Event Des', 'warning');
        }else if((document.getElementById('startTime') as HTMLInputElement).value === undefined){
        this.utils.presentToast('Whoops! Missing Start Time', 'warning');
        }else if(this.eventType === '' || this.eventType === null || this.eventType === undefined){
            this.utils.presentToast('Whoops! Missing Event Type', 'warning');
        }else if((document.getElementById('endTime') as HTMLInputElement).value === undefined){
            this.utils.presentToast('Whoops! Missing End Time', 'warning');
        }else if(new Date((document.getElementById('startTime') as HTMLInputElement).value) >
                    new Date((document.getElementById('endTime') as HTMLInputElement).value)){
            this.utils.presentToast('Whoops! Your event ended before it started', 'warning');
        }else if(this.isPrivate && this.links.length === 0){
            this.utils.presentToast('Whoops! Your didn\'t invite anyone', 'warning');
        }else {
            const data = {
                eventName: this.eventName,
                location: {
                    latitude: this.location[this.editMode ? 1 : 0],
                    longitude: this.location[this.editMode ? 0 : 1]
                },
                startTime: (document.getElementById('startTime') as HTMLInputElement).value,
                endTime: (document.getElementById('endTime') as HTMLInputElement).value,
                description: this.eventDes,
                type: this.eventType,
                isPrivate: this.isPrivate
            };

            if (!this.editMode) {
                const loading = await this.utils.presentAlert('Creating Event');

                this.es.createEvent(data).pipe(switchMap((output:any) => {
                    if(this.isPrivate){
                        return this.es.inviteAttendee(output.data.id, this.links, true);
                    }else{
                        return of('');
                    }
                })).subscribe(() => {
                    Promise.all([loading.dismiss(),this.utils.presentToast('Event Created!', 'success'),this.closeModal()]);
                }, err => {
                    console.error(err);
                    Promise.all([this.utils.presentToast('Whoops! Problem making event', 'error'),loading.dismiss()]);
                });
            } else {
                const loading = await this.utils.presentAlert('Updating Event');

                this.es.editEvent(this.eventID, data).pipe(switchMap(() => {
                    if(this.isPrivate){
                        return this.es.inviteAttendee(this.eventID, this.links, true);
                    }else{
                        return of('');
                    }
                })).subscribe(() => {
                    Promise.all([loading.dismiss(),this.utils.presentToast('Event Updated!', 'success'),this.closeModal()]);
                }, err => {
                    console.error(err);
                    Promise.all([this.utils.presentToast('Whoops! Problem updating event', 'error'),loading.dismiss()]);
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
                            this.utils.presentToast('Whoops! Event Delete Failed', 'error');
                        });
                    }
                }
            ]
        });

        await alert.present();
    }

    async endEvent() {
            const alert = await this.alertController.create({
            header: 'Confirm Event End',
            message: 'Are you sure you want to end this event?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary'
                }, {
                    text: 'End',
                    handler: () => {
                        this.es.endEvent(this.eventID).subscribe(() => {
                            this.modalController.dismiss();
                        }, (err) => {
                            console.error(err);
                            this.utils.presentToast('Whoops! Event Ending Failed', 'error');
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
                    this.utils.presentToast('Event Downloaded!', 'success');
                }).catch(error => {
                    console.error(error);
                    this.utils.presentToast('Whoops! Unable to create calendar event', 'error');
                });
            }).catch(error => {
                console.error(error);
                this.utils.presentToast('Whoops! Unable to create calendar event', 'error');
            });
    }

    closeModal() {
        this.modalController.dismiss();
    }

}
