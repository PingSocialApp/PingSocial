import {AfterViewInit, Component, OnInit} from '@angular/core';
import leaflet from 'leaflet';
import {IonSearchbar, ModalController} from '@ionic/angular';
import {EventcreatorPage} from '../tab2/eventcreator/eventcreator.page';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireStorage} from '@angular/fire/storage';

@Component({
    selector: 'app-digitalmap',
    templateUrl: './digitalmap.component.html',
    styleUrls: ['./digitalmap.component.scss'],
    providers: [AngularFireStorage,AngularFireAuth,AngularFirestore]
})
export class DigitalmapComponent implements OnInit, AfterViewInit {
    mtd: number
    private digitalmap: any;
    queryStatus = 'All';
    queryType = 'All';
    queryDate: boolean;
    queryLink: boolean;
    showFilter: boolean;
    private currentUserId: string;
    private currentUserRef: any;

    constructor(private modalController: ModalController,private firestore: AngularFirestore, private auth: AngularFireAuth,
                private storage: AngularFireStorage) {
        this.mtd = 1 / 111139;
        this.showFilter = false;

        this.currentUserId = this.auth.auth.currentUser.uid;
        this.currentUserRef = this.firestore.collection('users').doc(this.currentUserId);
    }

    ngOnInit() {
        this.digitalmap = leaflet.map('digitalmap', {
            zoomControl: false,
            center: [0, 0],
            zoom: 16,
            attributionControl: false,
            minZoom: 15,
            maxZoom: 21,
            layers: [
                leaflet.imageOverlay(
                    'https://i.pinimg.com/originals/74/43/a3/7443a31b6a19e5630b94a6538ff9bdd1.gif',
                    [leaflet.latLng(-2000 * this.mtd, -2000 * this.mtd), leaflet.latLng(2000 * this.mtd, 2000 * this.mtd)],
                    {
                        opacity: 0.1
                    }
                )
            ],
            maxBounds: leaflet.latLngBounds(
                leaflet.latLng(-1000 * this.mtd, -1000 * this.mtd),
                leaflet.latLng(1000 * this.mtd, 1000 * this.mtd)
            )
        });

        // this.digitalmap.on('movestart', () => {
        //     // Remove Overlay
        // });

        // Patch Solution
        setTimeout(() => {
            this.digitalmap.invalidateSize()
        }, 50);
    }

    ngAfterViewInit() {
        for (let i = 6; i >= 1; i--) {
            leaflet.circle([0, 0], {
                radius: i * 150,
                color: '#7ec3ca'
            })
                .bindPopup(6 - i + ' thing(s) in common')
                .addTo(this.digitalmap);
        }
        this.digitalmap.on('zoom', (event) => {
            const markers = document.getElementsByClassName('custom-event-marker');
            const zoom = this.digitalmap.getZoom();
            // tslint:disable-next-line:prefer-for-of
            for (let k = 0; k < markers.length; k++) {
                const num = 20 + Math.ceil(Math.pow(2, zoom - 16)) + 'px';
                (markers[k] as HTMLElement).style.width = num;
                (markers[k] as HTMLElement).style.height = num;
            }
        });

        this.currentUserRef.snapshotChanges().subscribe(ref => {
            const div = document.createElement('div');
            div.className = 'custom-marker marker';
            const data = ref.payload;
            if (data.get('profilepic').startsWith('h')) {
                div.style.backgroundImage = 'url(' + data.get('profilepic') + ')';
            } else {
                this.storage.storage.refFromURL(data.get('profilepic')).getDownloadURL().then(url => {
                    div.style.backgroundImage = 'url(' + url + ')';
                });
            }
            leaflet.marker([0, 0], {
                icon: leaflet.divIcon({
                    className: '',
                    iconAnchor: [28, 28],
                    html: div
                })
            }).addTo(this.digitalmap);
        });

        for (let i = 1; i <= 5; i++) {
            const seed = Math.floor(Math.random() * 10);
            const n = (2 * Math.PI) / seed;
            const layer = [];
            for (let j = 1; j <= seed; j++) {
                const div = document.createElement('div');
                div.className = 'custom-event-marker marker';
                div.style.backgroundImage = 'url(\'https://picsum.photos/20\')';
                const eventIcon = leaflet.divIcon({
                    className: '',
                    iconAnchor: [13, 13],
                    html: div
                });
                const offset =
                    seed < 10
                        ? ((Math.floor(Math.random() * (2 * 5 + 1)) - 5) * Math.PI) / 180
                        : 0;
                const sf = this.mtd * i * 150;
                const angle = n * j + offset;
                layer.push(
                    leaflet.marker([sf * Math.sin(angle), sf * Math.cos(angle)], {
                        icon: eventIcon
                    }).bindPopup('Event ' + Math.floor(Math.random() * 1000))
                );
            }
            leaflet.layerGroup(layer).addTo(this.digitalmap);
        }
    }

    filterMarkers() {

    }

    async presentEventCreatorModal(s: string) {
        const modal = await this.modalController.create({
            component: EventcreatorPage,
            componentProps: {
                eventID: s
            }
        });
        return await modal.present();
    }

    presentFilter() {
        this.showFilter = !this.showFilter;
        if (!this.showFilter) {
            // const elements = document.getElementsByClassName('mapboxgl-marker');
            // // tslint:disable-next-line:prefer-for-of
            // for (let i = 0; i < elements.length; i++) {
            //     (elements[i] as HTMLElement).style.display = 'block';
            // }
        }
    }
}
