import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {environment} from '../../../../environments/environment';
import {ModalController} from '@ionic/angular';
import {Geolocation} from '@capacitor/geolocation';
import {LinkSelectorPage} from '../link-selector/link-selector.page';
import { AuthHandler } from 'src/app/services/authHandler.service';
import { GeopingsService } from 'src/app/services/geopings.service';
import { concatMap } from 'rxjs/operators';
import { UtilsService } from 'src/app/services/utils.service';
import { Observable, of } from 'rxjs';

@Component({
    selector: 'app-geo-ping',
    templateUrl: './geo-ping.component.html',
    styleUrls: ['./geo-ping.component.scss'],
    providers: []
})
export class GeoPingComponent implements OnInit, AfterViewInit, OnDestroy {
    textAmt: number;
    message: string;
    isPublic: boolean;
    durationString: string;
    showPublic: boolean;
    links: Array<string>;
    map: mapboxgl.Map;
    geocoder: any;
    private location: any;
    customAlertOptions: any = {
        header: 'Geo-Ping Duration',
        translucent: true
    };


    constructor(private utils: UtilsService, private auth: AuthHandler, private gs: GeopingsService,
         private modalController: ModalController) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
    }

    ngOnInit() {
        this.textAmt = 0;
        this.showPublic = false;
        this.isPublic = true;
        this.durationString = '5 Min';
        this.links = [];
    }

    ngOnDestroy() {
        this.textAmt = 0;
        this.showPublic = false;
        this.isPublic = true;
        this.durationString = '5 Min';
        this.links = [];
    }

    ngAfterViewInit() {
        Geolocation.getCurrentPosition().then((resp) => {
            // resp.coords.latitude
            // resp.coords.longitude
            this.location = [resp.coords.latitude, resp.coords.longitude];
        }).catch((error) => {
            console.error('Error getting location', error);
            this.location = [0,0];
        }).finally(() => {
            this.buildMap();
            (document.querySelector('#pingmap .mapboxgl-canvas') as HTMLElement).style.width = '100%';
            (document.querySelector('#pingmap .mapboxgl-canvas') as HTMLElement).style.height = 'auto';
        });
    }

    buildMap() {
        this.map = new mapboxgl.Map({
            container: 'pingmap',
            style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
            zoom: 7,
            center: [this.location[1], this.location[0]]
        });
        new mapboxgl.Marker().setLngLat([this.location[1], this.location[0]]).addTo(this.map);
        // @ts-ignore
        this.geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl
        });
        document.getElementById('geocoder-container-geoping').appendChild(this.geocoder.onAdd(this.map));
        this.geocoder.on('result', (res) => {
            this.location = [res.result.geometry.coordinates[1], res.result.geometry.coordinates[0]];
        });
    }

    showLocation() {
        if (document.getElementById('mapContainer').style.display === 'none'
            || document.getElementById('mapContainer').style.display === '') {
            document.getElementById('mapContainer').style.display = 'block';
        } else {
            document.getElementById('mapContainer').style.display = 'none';
        }
        this.showPublic = false;
    }

    setValue($event: any) {
        this.durationString = $event.detail.value;
    }

    togglePublic() {
        this.isPublic = !this.isPublic;
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

    closeModal() {
        this.modalController.dismiss();
    }

    sendPing() {
        let duration;
        if (this.durationString === '5 Min') {
            duration = 5;
        } else if (this.durationString === '1 Hour') {
            duration = 60;
        } else {
            duration = 24*60;
        }

        if (!this.isPublic) {
            if (this.links.length > 20) {
                this.utils.presentToast('Whoops! You have more than 20 people');
                return;
            } else if(this.links.length === 0) {
                this.utils.presentToast('Whoops! You didn\'t add anyone');
                return;
            }
        }

        const geoPing = {
            sentMessage: this.message,
            location: {
                latitude: this.location[0],
                longitude: this.location[1]
            },
            isPrivate: !this.isPublic,
            timeLimit: duration
        }

        //this.gs.createGeoPing(geoPing).pipe(concatMap((val:any) => {
        this.gs.createGeoPing(geoPing).pipe(concatMap((val:any) => {
            if(this.isPublic){
              return of("");
            }
            return this.gs.shareGeoPing(val.data.id, this.links);
        })).subscribe(() => {
            this.utils.presentToast('GeoPing Made!');
            this.closeModal();
        }, err => {
            this.utils.presentToast('Whoops! Unexpected Problem');
            console.log(err);
        });
    }
}
