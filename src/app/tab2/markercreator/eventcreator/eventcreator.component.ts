import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {Calendar} from '@ionic-native/calendar/ngx';
import {AlertController, ModalController} from '@ionic/angular';
import {environment} from '../../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {Observable} from 'rxjs';
import { UsersService } from 'src/app/services/users.service';
import { AuthHandler } from 'src/app/services/authHandler.service';
import { UtilsService } from 'src/app/services/utils.service';
import { EventsService } from 'src/app/services/events.service';
import { LinkSelectorPage } from '../link-selector/link-selector.page';

@Component({
    selector: 'app-eventcreator',
    templateUrl: './eventcreator.component.html',
    styleUrls: ['./eventcreator.component.scss'],
    providers:[]
})
export class EventcreatorComponent implements OnInit, AfterViewInit {
    map: mapboxgl.Map;
    currentUser: any;
    geocoder: any;
    eventName: string;
    location: Array<any>;
    isPublic: boolean;
    links: Observable<any>;
    eventDes: string;
    eventType: string;
    @Input() eventID: string;
    editMode: boolean;
    isCreator: boolean;
    eventCreator: any;
    eventCreatorName: string;

    constructor(private cal: Calendar, private alertController: AlertController, private modalController: ModalController, 
        private utils: UtilsService,
                private us: UsersService, private auth: AuthHandler, private es: EventsService) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
        this.isPublic = false;
    }


    ngOnInit() {
        this.editMode = this.eventID !== '';
        (document.getElementById('startTime') as HTMLInputElement).value = new Date().toISOString();
        (document.getElementById('endTime') as HTMLInputElement).value = new Date().toISOString();
        if (this.editMode) {
           this.renderEditMode();
        } else {
            this.renderNewMode();
        }
    }

    renderNewMode(){
        this.isCreator = true;
        this.us.getUserBasic(this.auth.getUID()).subscribe((userRef: any) => {
            this.eventCreatorName = userRef.data.name;
        });
    }

    renderEditMode(){
           this.es.getEventDetails(this.eventID).subscribe((ref:any) => {
            const data = ref.data;
            (document.getElementById('startTime') as HTMLInputElement).value = data.startTime;
            (document.getElementById('endTime') as HTMLInputElement).value = data.endTime;
            this.eventName = data.name;
            this.eventCreator = data.creator.id;
            this.eventCreatorName = data.creator.name;
            this.eventDes = data.description;
            this.isPublic = data.isPrivate;
            this.eventType = data.type;
            this.location = [data.position.latitude,data.position.longitude];
            this.map.flyTo({
                center: this.location,
                essential: true
            });
            // if (this.isPublic) {
            //     this.members = data.members;
            // }
            this.isCreator = data.creator.id === this.auth.getUID();
            new mapboxgl.Marker().setLngLat(this.location).addTo(this.map);
        }, () => {

        }, () => {
        });
    }

    ngAfterViewInit() {
        this.buildMap();
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.width = '100%';
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.height = 'auto';
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
        if (!this.isPublic) {
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
    }

    // isChecked(id: string){
    //     for(const member of this.members) {
    //         if(member.id === id) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    async manageEvent() {
        const toggle = (document.getElementsByTagName('ion-checkbox') as unknown as Array<any>);
        if (this.eventName === '' || (document.getElementById('startTime') as HTMLInputElement).value === '' || (document.getElementById('endTime') as HTMLInputElement).value === '' || this.eventDes === '' || this.eventType === ''
            || typeof this.location === 'undefined') {
            this.utils.presentToast('Whoops! You have an empty entry');
        } else if (new Date((document.getElementById('startTime') as HTMLInputElement).value) > new Date((document.getElementById('startTime') as HTMLInputElement).value)) {
            this.utils.presentToast('Whoops! Your event ended before it started');
        } else {

            // TODO propogate changes
            const data = {
                name: this.eventName,
                creator: this.auth.getUID(),
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
                isPrivate: this.isPublic
            };

            // const userArray = [];
            // if (this.isPublic) {
            //     for (const element of toggle) {
            //         if (element.checked) {
            //             userArray.push(element.id);
            //         }
            //         if (userArray.length > 15) {
            //             this.utils.presentToast('Whoops! You have more than 15 people');
            //             return;
            //         }
            //     }

            //     // @ts-ignore
            //     data.members = userArray;
            // } else if (this.editMode) {
            //     // @ts-ignore
            //     data.members = firebase.firestore.FieldValue.delete();
            // }

            // TODO Share

            if (!this.editMode) {
                this.es.createEvent(data).subscribe(val => {
                    this.utils.presentToast('Event Created!');
                    this.closeModal();
                }, err => {
                    console.error(err);
                    this.utils.presentToast('Whoops! Problem making event');
                });
            } else {
                this.es.editEvent(this.eventID, data).subscribe(val => {
                    this.utils.presentToast('Event Created!');
                    this.closeModal();
                }, err => {
                    console.error(err);
                    this.utils.presentToast('Whoops! Problem making event');
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
                        })
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
        // using the injected ModalController this page
        // can "dismiss" itself and optionally pass back data
        this.modalController.dismiss({
            dismissed: true
        });
    }

}
