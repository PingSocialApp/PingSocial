import {Component, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import * as mapboxgl from 'mapbox-gl';
import {environment} from '../../../environments/environment';

@Component({
    selector: 'app-eventcreator',
    templateUrl: './eventcreator.page.html',
    styleUrls: ['./eventcreator.page.scss'],
})
export class EventcreatorPage implements OnInit {
    map: mapboxgl.Map;
    geocoder: any;
    startTime: string;
    endTime: string;

    constructor(private modalCtrl: ModalController) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.buildMap();
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.width = '100%';
        (document.querySelector('#choosermap .mapboxgl-canvas') as HTMLElement).style.height = 'auto';
        this.startTime = new Date().toISOString();
    }

    buildMap() {
        this.map = new mapboxgl.Map({
            container: 'choosermap',
            style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y',
            zoom: 2,
        });
        // @ts-ignore
        this.geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl
        });
        document.getElementById('geocoder-container').appendChild(this.geocoder.onAdd(this.map));
    }

    closeModal() {
        this.modalCtrl.dismiss({
            dismissed: true
        });
    }

}
