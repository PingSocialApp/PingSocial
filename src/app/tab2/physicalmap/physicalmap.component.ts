import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {IonSearchbar, ModalController, Platform} from '@ionic/angular';
import {environment} from '../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {Geolocation, Position} from '@capacitor/geolocation'
import {forkJoin, Subscription} from 'rxjs';
import {AngularFireDatabase} from '@angular/fire/database';
import {MarkercreatorPage} from '../markercreator/markercreator.page';
import {RatingPage} from '../../rating/rating.page';
import { MarkersService } from 'src/app/services/markers.service';
import { UsersService } from 'src/app/services/users.service';
import { AuthHandler } from 'src/app/services/authHandler.service';
import { EventsService } from 'src/app/services/events.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
    selector: 'app-physicalmap',
    templateUrl: './physicalmap.component.html',
    styleUrls: ['./physicalmap.component.scss'],
    providers: []
})
export class PhysicalmapComponent implements OnInit, AfterViewInit, OnDestroy {
    showPing: boolean;
    map: mapboxgl.Map;
    currentLocationMarker: any;
    showFilter: boolean;
    allUserMarkers: any;
    currentEventTitle: string;
    currentEventDes: string;
    showEventDetails: any;
    queryStatus = 'All';
    queryType = 'All';
    queryDate: boolean;
    queryLink: boolean;
    currentEventId: string;
    showUserDetails: boolean;
    otherUserName = '';
    otherUserLocation: any;
    otherUserStatus = '';
    otherUserId: string;

    // puts marker on the map with user info
    pingMessage: string;
    pingImg: string;
    pingAuthor: string;
    pingDate: string;
    private linksSub: Subscription;
    private markersSub: Subscription;
    showCheckIn: boolean;
    location: any;
    checkedIn: string;

    constructor(private rtdb: AngularFireDatabase, private ms: MarkersService, private us: UsersService, private platform: Platform,
                private modalController: ModalController, public auth: AuthHandler, private es: EventsService,
                private utils: UtilsService) {
        mapboxgl.accessToken = environment.mapbox.accessToken;
    }

    async ngOnInit() {
        this.allUserMarkers = [];
        this.location = [];
        this.showFilter = false;
        this.showEventDetails = false;
        this.showUserDetails = false;
        this.showPing = false;
        this.checkedIn = null;
    }

    ngAfterViewInit() {
        Geolocation.getCurrentPosition().then((resp) => {
            this.buildMap(resp.coords);
            // this.updateLocation(resp.coords);
        }).then(() => {
            this.map.on('load', () => {
                this.presentCurrentLocation();
                this.refreshContent(true);
                Geolocation.watchPosition({
                    enableHighAccuracy: true,
                },(position, err) => {
                    this.renderCurrent(position);
                    this.presentEvents();
                });
            });
        }).catch((error) => {
            console.log('Error getting location', error);
        });
    }

    ngOnDestroy() {
        this.linksSub.unsubscribe();
        this.markersSub.unsubscribe();
    }

    refreshContent(reset = false) {
        this.renderLinks(reset);

        const coords = this.map.getCenter();

        this.markersSub = forkJoin([this.ms.getRelevantEvents(coords.lat, coords.lng, this.getRadius(), reset),
        this.ms.getRelevantGeoPings(coords.lat, coords.lng, this.getRadius(), reset)]).subscribe((markerSet:any) => {
            const markerArr = [...markerSet[0], ...markerSet[1]];
            // TODO render Markers
        }, err => console.error(err));
    }

    renderCurrent(pos: Position) {
        // update current user location
            const lng = pos.coords.longitude;
            const lat = pos.coords.latitude;

            this.location = [lng, lat];

            // const locationRef = this.rtdb.database.ref('/location/' + this.currentUserId);
            // this.updateStatus(locationRef);

            // use api to get location
            // this.renderUser(this.currentLocationMarker, lng, lat);

            // just to fly to current user on map
            this.map.flyTo({
                center: [lng, lat],
                essential: true
            });
    }

    getRadius(){
        return (78271/(2**this.map.getZoom()))*256;
    }

    renderLinks(reset) {
        const coords = this.map.getCenter();

        this.linksSub = this.ms.getLinks(coords.lat,coords.lng,this.getRadius(),reset).subscribe((res:any) => {
            this.allUserMarkers.forEach(tempMarker => {
                tempMarker.remove();
            });
            res.forEach(doc => {
                // create marker and style it
                const el = this.createMarker();
                el.style.width = '30px';
                el.style.height = '30px';
                el.style.backgroundImage = 'url(' + doc.profilepic + ')';
                // get other users longitude, latitude, and lastOnline vals
                const longi = doc.geometry[0];
                const latid = doc.geometry[1];
                // const locat = vals.place;

                // const lastOn = vals.lastOnline;
                // const oStat = vals.isOnline ? 'Online' : this.convertTime(Date.now() - lastOn);

                el.id = doc.id;
                const oMark = new mapboxgl.Marker(el);
                this.allUserMarkers.push(oMark);
                el.addEventListener('click', async (e) => {
                    this.showUserDetails = true;
                    this.showEventDetails = false;
                    this.otherUserName = doc.properties.name;
                    // this.otherUserStatus = oStat;
                    // this.otherUserLocation = locat;
                    this.otherUserId = doc.id
                });
                this.renderUser(oMark, longi, latid);
            });
        });
    }

    renderUser(marker, lng, lat) {
        try {
            marker.setLngLat([lng, lat])
                .addTo(this.map);
        } catch (e) {
            console.log(e.message);
        }
    }

    convertTime(t) {
        if (t >= 86_400_000) {
            // days
            return Math.floor(t / 86_400_000) + 'd ago';
        } else if (t >= 3_600_000) {
            // hours
            return Math.floor(t / 3_600_000) + 'h ago';
        } else if (t >= 60_000) {
            // mins
            return Math.floor(t / 60_000) + 'm ago';
        } else if (t >= 1000) {
            // secs
            return Math.floor(t / 1000) + 's ago';
        } else {
            return 'Just Now';
        }
    }

    updateLocation(coords) {
        this.us.setUserLocation({
            longitude: coords.longitude,
            latitude: coords.latitude,
        }).subscribe((val: any) => console.log(val) ,(err: any) => console.error(err));
    }

    presentEvents() {
            // const nowString = firestore.Timestamp.now();

            // const query1 = this.afs.collection('events', ref => ref.where('isPrivate', '==', false)
            //     .where('endTime', '>=', nowString));
            // const query2 = this.afs.collection('events', ref => ref.where('creator', '==', this.currentUserRef.ref)
            //     .where('endTime', '>=', nowString));
            // const query3 = this.afs.collection('events', ref => ref.where('members', 'array-contains', this.currentUserRef.ref)
            //     .where('endTime', '>=', nowString));

            // const events = merge(query1.snapshotChanges(), query2.snapshotChanges(), query3.snapshotChanges());

            // this.eventSub = events.subscribe(eventData => {
            //     eventData.forEach((event) => {
            //         this.renderEvent(event.payload.doc);
            //     });
            // });

            const data = [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [-95.6618, 32.349]
                    },
                    properties: {
                        name: "Event 1",
                        isPrivate: false,
                        rating: 3,
                        startTime: new Date('21 June 2021 20:48 UTC'),
                        endTime: new Date('22 June 2021 20:48 UTC'),
                        hostName: "Billy",
                        profilePic: "LINKTOPROFILEPIC",
                        type: "hangout"
                    },
                    id: "1"
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [-95.6628, 32.61]
                    },
                    properties: {
                        name: "Event 2",
                        isPrivate: false,
                        rating: 3,
                        startTime: new Date('21 June 2021 20:48 UTC'),
                        endTime: new Date('22 June 2021 20:48 UTC'),
                        hostName: "Billy",
                        profilePic: "LINKTOPROFILEPIC",
                        type: "networking"
                    },
                    id: "2"
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [-95.6618, 31.349]
                    },
                    properties: {
                        name: "Event 3",
                        isPrivate: false,
                        rating: 3,
                        startTime: new Date('19 June 2021 14:48 UTC'),
                        endTime: new Date('20 June 2021 14:48 UTC'),
                        hostName: "Billy",
                        profilePic: "LINKTOPROFILEPIC",
                        type: "hangout"
                    },
                    id: "3"
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [-95.6618, 31.49]
                    },
                    properties: {
                        name: "Event 4",
                        isPrivate: false,
                        rating: 3,
                        startTime: new Date('21 June 2021 16:00 UTC'),
                        endTime: new Date('21 June 2021 17:00 UTC'),
                        hostName: "Billy",
                        profilePic: "LINKTOPROFILEPIC",
                        type: "hangout"
                    },
                    id: "4"
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [-95.6618, 31.347]
                    },
                    properties: {
                        name: "Event 5",
                        isPrivate: false,
                        rating: 3,
                        startTime: new Date('21 June 2021 14:48 UTC'),
                        endTime: new Date('21 June 2021 16:48 UTC'),
                        hostName: "Billy",
                        profilePic: "LINKTOPROFILEPIC",
                        type: "party"
                    },
                    id: "5"
                }
            ]

            this.map.addSource('events', {
                type: 'geojson',
                // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
                // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
                data: {
    							"type": "FeatureCollection",
    							"features": data
    						},
                cluster: true,
                clusterMaxZoom: 14, // Max zoom to cluster points on
                clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
                clusterProperties: {
                  coordinates: ['max', ['get', 'coordinates']]
                }
            });

            this.map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'events',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-opacity': 0.0
                },
                includeGeometry: true
            });

            data.forEach(event => {
                this.renderEvent(event);
            })

            this.map.on('moveend', function(e){
              var points = this.querySourceFeatures('events');
              var feat = this.queryRenderedFeatures(e.point, {layers: ['clusters']});
              var cc = this.getContainer();
              var els = cc.getElementsByClassName('marker-style mapboxgl-marker mapboxgl-marker-anchor-center');
            //  const el = document.createElement('div');
              console.log("beginning of mov");
              for(var i = 0; i < feat.length; i++){
                // console.log(feat[i]);
                // console.log(feat[i].id);
                // const el = document.createElement('div');
                // el.className = 'marker-style';
                // el.title = "null";
                // el.style.background = null;
                // el.id = feat[i].id;
                // console.log(el);
                // try {
                //     const marker = new mapboxgl.Marker(el);
                //     marker.setLngLat(feat[i].geometry.coordinates).addTo(this);
                //     console.log(marker);
                //     el.title = "null";
                // } catch (e) {
                //     console.log(e.message);
                // }
              }
              for(var i = 0; i < els.length; i++){
                for(var j = 0; j < els.length; j++){
                  if((els[i].id === els[j].id) && (i !== j)){
                    document.getElementById(els[i].id).remove();
                  }
                }
              }
              for(var i = 0; i < els.length; i++){
                document.getElementById(els[i].id).style.display = "none";
              }
              for(var m = 0; m < els.length; m++){
                for(var i = 0; i < points.length; i++){
                  if(parseInt(els[m].id) === points[i].id){
                    document.getElementById(els[m].id).style.display = "inline";
                    break;
                  }
                }
              }
              console.log("reached");
              var currentPoint;
              for(var i = 0; i < feat.length; i++){
                console.log(feat[i].id);
                const el = document.createElement('div');
                el.className = 'marker-style';
                el.title = "null";
                el.style.background = null;
                el.id = feat[i].id;
                console.log(el);
                try {
                    const marker = new mapboxgl.Marker(el);
                    marker.setLngLat(feat[i].geometry.coordinates).addTo(this);
                    console.log(marker);
                    el.title = "null";
                } catch (e) {
                    console.log(e.message);
                }
                var distArr = new Array(data.length);
                var pointArr = new Array(data.length);
                var x = 0;
                for(var k = 0; k < els.length; k++){
                  for(var j = 0; j < data.length; j++){
                    if((document.getElementById(els[k].id).style.display === "none") && (els[k].id === data[j].id)){
                      currentPoint = data[j].geometry;
                      var squareDistX = (feat[i].geometry.coordinates[0] - currentPoint.coordinates[0])*(feat[i].geometry.coordinates[0] - currentPoint.coordinates[0]);
                      var squareDistY = (feat[i].geometry.coordinates[1] - currentPoint.coordinates[1])*(feat[i].geometry.coordinates[1] - currentPoint.coordinates[1]);
                      var currentDist = Math.sqrt(squareDistX + squareDistY);
                      distArr[x] = currentDist;
                      pointArr[x] = data[j];
                      x++;
                      console.log(data[j].id);
                    }
                 }
                }
                console.log(distArr);
                console.log(pointArr);
                for(var j = 0; j < distArr.length; j++){
                  for(var k = j; k < distArr.length; k++){
                    if((distArr[j] > distArr[k]) && (j !== k)){
                      var tempD = distArr[k];
                      var tempP = pointArr[k];
                      distArr[k] = distArr[j];
                      pointArr[k] = pointArr[j];
                      distArr[j] = tempD;
                      pointArr[j] = tempP;
                    }
                  }
                }
                console.log(feat[i].properties.point_count);
                for(var j = 0; j < feat[i].properties.point_count; j++){
                  console.log(pointArr[j].properties.type);
                  console.log(feat[i].id);
                  console.log(feat[i]);
                  console.log(feat[i].id);
                  console.log(el);
                  if(el !== null){
                    if(document.getElementById(pointArr[j].id).getAttribute('data-type') === 'party'){
                      console.log("found party", pointArr[j].id);
              //set marker
                      if(el.title === "null"){
                        el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/D8S67QwWNF7eTsPexMOtA1ouY2M_4yCwA9tkTPRENNZt065Y9VNgh53jPSLqRTKPuOdOQhurkFJ45ZnoDfNdrd54ZC42quXg5R19A2mX6sUVmiq4W0faltbInNS-va-8PsqmUOTgaA=w2400)';
                        el.title = "party";
                //marker set to networking
                      }else if(el.title === "networking"){
                        el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/b5D-JjEPpnm7J24r_d_lGiC0WVqP7q70qj6p6daDLRvFT8MlFMi1qrGl4nWUShOd7brlDH7pzQ_oIx2MZubxZVWRbhbM_a88O_lOrl-bE-4eFgEnefbg6a8o-SBLfHBguQbA2RAAJQ=w2400)';
                        el.title = "partynetworking";
                //marker set to hangout
                      }else if(el.title === "hangout"){
                        el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/WYUFnZCCxln57EIFJIYwuO2ZtshK926bFLHfg6HPEsXO-WlPu22z-pvZdWPqpj59Q625zGZxcSyrb_1Lz9et2QCnsdugM13GQFsNDsh__1kmqOulYvr_3qVV5ojbzQDJ6qe44b85OA=w2400)';
                        el.title = "partyhangout";
                //cluster of all 3
                      }else if(el.title === "networkinghangout"){
                        el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/ayMVFp_WBsb5JYEsnzi3m8wOuGMJ5dx-GubOdQ0gPlbAlN2RQn03X_RZxrMrUP8tr-52aAgrHf_mnwmr50wDCpHE-Lzashd9YV17bbtnQPU_EqQSe6Fy-RNigYCpYaqAZVNqzXmsMg=w2400)';
                        el.title = "all";
                      }
                  }else if(document.getElementById(pointArr[j].id).getAttribute('data-type') === 'networking'){
                    console.log("found networking", pointArr[j].id);
              //set marker
                    if(el.title === "null"){
                      el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/sNPI9CircqQ0do5-wBNJD9npQdgblVv2-rL41yGw4UwBTY_BOWsc_kXYtYrQnMvlD0JL4tOSOE0TjujwgItL5YhQGMvVX3hzqebV7tm5_ScSCvBxA5sz8l2IKdclFmWBwT11wOn6_Q=w2400)';
                      el.title = "networking";
              //marker set to party
                    }else if(el.title === "party"){
                      el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/b5D-JjEPpnm7J24r_d_lGiC0WVqP7q70qj6p6daDLRvFT8MlFMi1qrGl4nWUShOd7brlDH7pzQ_oIx2MZubxZVWRbhbM_a88O_lOrl-bE-4eFgEnefbg6a8o-SBLfHBguQbA2RAAJQ=w2400)';
                      el.title = "partynetworking"
              //marker set to hangout
            }else if(el.title === "hangout"){
                      el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/2YvgzQe2QhF9VFhsVUCMM41xST5gFmsfyphoKFxfYIGIR6XHGp9iP7Zbx6Xzmrihxz8FWSjk_wSzWQ-SVf3LaHRwYIFJ6Tmnpezl4ikhuDiQ7574-3p7ndzewnIJp2rbIaVSVsLiKg=w2400)';
                      el.title = "networkinghangout";
              //cluster of all 3
            }else if(el.title === "partyhangout"){
                      el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/ayMVFp_WBsb5JYEsnzi3m8wOuGMJ5dx-GubOdQ0gPlbAlN2RQn03X_RZxrMrUP8tr-52aAgrHf_mnwmr50wDCpHE-Lzashd9YV17bbtnQPU_EqQSe6Fy-RNigYCpYaqAZVNqzXmsMg=w2400)';
                      el.title = "all";
                    }
                }else if(document.getElementById(pointArr[j].id).getAttribute('data-type') === 'hangout'){
                  console.log("found hangout", pointArr[j].id);
            //set marker
                  if(el.title === "null"){
                    el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/eOx1U2_GUNNrtpcCszSp0cyXdDZWUGWFCc6XkkR05VKP7qYonD6HeWd8OQDRYUdC8qoMx9ONBXgb_H192XHvvRdJpeklIa5eJF2ZeKHYpUwTIGXAkWcqP8IZh9BnRGjFs4XvELE4sg=w2400)';
                    el.title = "hangout";
              //marker set to networking
                  }else if(el.title === "networking"){
                    el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/2YvgzQe2QhF9VFhsVUCMM41xST5gFmsfyphoKFxfYIGIR6XHGp9iP7Zbx6Xzmrihxz8FWSjk_wSzWQ-SVf3LaHRwYIFJ6Tmnpezl4ikhuDiQ7574-3p7ndzewnIJp2rbIaVSVsLiKg=w2400)';
                    el.title = "networkinghangout";
            //marker set to party
                  }else if(el.title === "party"){
                    el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/WYUFnZCCxln57EIFJIYwuO2ZtshK926bFLHfg6HPEsXO-WlPu22z-pvZdWPqpj59Q625zGZxcSyrb_1Lz9et2QCnsdugM13GQFsNDsh__1kmqOulYvr_3qVV5ojbzQDJ6qe44b85OA=w2400)';
                    el.title = "partyhangout";
            //cluster of all 3
                  }else if(el.title === "partynetworking"){
                    el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/ayMVFp_WBsb5JYEsnzi3m8wOuGMJ5dx-GubOdQ0gPlbAlN2RQn03X_RZxrMrUP8tr-52aAgrHf_mnwmr50wDCpHE-Lzashd9YV17bbtnQPU_EqQSe6Fy-RNigYCpYaqAZVNqzXmsMg=w2400)';
                    el.title = "all";
                  }
                }
                  }
            }
          }
          });
        }

    presentGeoPing() {
        const data = [
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [125.6, 10.1]
                },
                properties: {
                    sentMessage: "Dinagat Islands",
                    isPrivate: true,
                    timeCreate: "TIMESTRIGN",
                    pingId: "UNIQUE_ID",
                    creatorName: "John",
                    creatorPRofilePIc: "LINKTOPROFILEPIC"
                }
            }
        ]

        data.forEach(event => {
            this.renderPings(event);
        })


    }

    renderPings(doc) {
        const pingInfo = doc;
        const el = this.createMarker();

        el.id = doc.id;
        if (!!document.getElementById(el.id)) {
            document.getElementById(el.id).remove();
        }

        el.addEventListener('click', (e) => {
            this.showEventDetails = false;
            this.showUserDetails = false;
            this.showPing = true;
            this.pingMessage = pingInfo.message;
            // this.pingDate = this.convertTime(Date.now() - pingInfo.timeCreate.toDate());
            this.pingImg = pingInfo.creator.profilepic;
            this.pingAuthor = pingInfo.creator.name;
        });

        el.style.backgroundImage = 'url(\'../assets/chatbubble.svg\')';
        el.className += ' ping-marker';

        const marker = new mapboxgl.Marker(el);
        try {
            marker.setLngLat([pingInfo.position.longitude, pingInfo.position.latitude]).addTo(this.map);
        } catch (e) {
            console.error(e.message);
        }
    }

    renderEvent(doc) {
      console.log("render func");
      this.newRenderFunc(doc);
        // const eventInfo = doc.data();
        // const el = this.createMarker();
        // el.setAttribute('data-name', eventInfo.name);
        // el.setAttribute('data-private', eventInfo.isPrivate);
        // el.setAttribute('data-type', eventInfo.type);
        // if (eventInfo.creator.id === this.currentUserId || eventInfo.isPrivate) {
        //     el.setAttribute('data-link', 'true');
        // } else {
        //     this.currentUserRef.collection('links', ref => ref.where('otherUser', '==', eventInfo.creator)
        //         .where('pendingRequest', '==', false)).get().pipe(first()).subscribe(val => {
        //         el.setAttribute('data-link', val.empty ? 'false' : 'true');
        //     });
        // }
        // el.setAttribute('data-time', eventInfo.startTime);
        // el.id = doc.id;
        // if (!!document.getElementById(el.id)) {
        //     document.getElementById(el.id).remove();
        // }
        // // @ts-ignore
        // if (eventInfo.type === 'party') {
        //     el.style.backgroundImage = 'url(\'../assets/undraw_having_fun_iais.svg\')';
        // } else if (eventInfo.type === 'hangout') {
        //     el.style.backgroundImage = 'url(\'../assets/undraw_hang_out_h9ud.svg\')';
        // } else {
        //     el.style.backgroundImage = 'url(\'../assets/undraw_business_deal_cpi9.svg\')';
        // }
        // const startTime = eventInfo.startTime.toDate();
        // // console.log(startTime);
        // let minutes = startTime.getMinutes() < 10 ? '0' : '';
        // minutes += startTime.getMinutes();
        //
        // el.addEventListener('click', (e) => {
        //     this.showEventDetails = true;
        //     this.showUserDetails = false;
        //     this.showPing = false;
        //     this.currentEventTitle = eventInfo.name;
        //     this.currentEventDes = eventInfo.type + ' @ ' + startTime.toDateString() + ' ' + startTime.getHours() + ':' + minutes;
        //     this.currentEventId = el.id;
        //     this.showCheckIn = this.geofirex.distance(this.geofirex.point(this.location[1], this.location[0]),
        //         eventInfo.position) < 0.025 && startTime < new Date();
        // });
        // const marker = new mapboxgl.Marker(el);
        // try {
        //     marker.setLngLat([eventInfo.position.geopoint.longitude, eventInfo.position.geopoint.latitude]).addTo(this.map);
        // } catch (e) {
        //     console.log(e.message);
        // }
    }

    newRenderFunc(doc){
      console.log("newRenderFunc");
      const eventInfo = doc.properties;
      const el = this.createMarker();
      console.log(el);
      el.setAttribute('data-name', eventInfo.name);
      el.setAttribute('data-private', eventInfo.isPrivate);
      el.setAttribute('data-type', eventInfo.type);
      // if (eventInfo.creator.id === this.currentUserId || eventInfo.isPrivate) {
      //     el.setAttribute('data-link', 'true');
      // } else {
      //     this.currentUserRef.collection('links', ref => ref.where('otherUser', '==', eventInfo.creator)
      //         .where('pendingRequest', '==', false)).get().pipe(first()).subscribe(val => {
      //         el.setAttribute('data-link', val.empty ? 'false' : 'true');
      //     });
      // }
      const startTime = eventInfo.startTime.toISOString();
      console.log(startTime);
      let minutes = eventInfo.startTime.getMinutes() < 10 ? '0' : '';
      console.log(minutes);
      minutes += eventInfo.startTime.getMinutes();

      el.setAttribute('data-time', eventInfo.startTime);
      el.id = doc.id;
      if (!!document.getElementById(el.id)) {
          document.getElementById(el.id).remove();
      }
      var check = (eventInfo.endTime - eventInfo.startTime);
      var currentTime = (new Date()).toISOString();
      if((eventInfo.startTime ) + (check)*0.25 >= currentTime){
        if (eventInfo.type === 'party') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/D8S67QwWNF7eTsPexMOtA1ouY2M_4yCwA9tkTPRENNZt065Y9VNgh53jPSLqRTKPuOdOQhurkFJ45ZnoDfNdrd54ZC42quXg5R19A2mX6sUVmiq4W0faltbInNS-va-8PsqmUOTgaA=w2400)';
        } else if (eventInfo.type === 'networking') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/sNPI9CircqQ0do5-wBNJD9npQdgblVv2-rL41yGw4UwBTY_BOWsc_kXYtYrQnMvlD0JL4tOSOE0TjujwgItL5YhQGMvVX3hzqebV7tm5_ScSCvBxA5sz8l2IKdclFmWBwT11wOn6_Q=w2400)';
        } else {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/eOx1U2_GUNNrtpcCszSp0cyXdDZWUGWFCc6XkkR05VKP7qYonD6HeWd8OQDRYUdC8qoMx9ONBXgb_H192XHvvRdJpeklIa5eJF2ZeKHYpUwTIGXAkWcqP8IZh9BnRGjFs4XvELE4sg=w2400)';
        }
      }else if((eventInfo.startTime) + (check)*0.5 >= currentTime){
        if (eventInfo.type === 'party') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/u3_6-40YDItN7xRsctrM7Hn0wu1EHA2cqHHuADOZ72ligPMAMmx1DlKAfgZBr67ldOIaaAla0LtEQ4C3kqhdRD3F0Xca_rBW6yiOcke5XhqjIR_Q7SSsfr8LHLii4E_uzpNMY9VwQg=w2400)';
        } else if (eventInfo.type === 'networking') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/BGlAGEj3IYFj1fjwRi1p32x84V-3ZP_PpBvqoRLVtgzOeM1WdGTS3SSm8-dI5zXH8LvXKaqRTH7fDNHwobmMysgA9eUbW7CA8-EA73W87Q9hvTUAER6dTG8ZcVm41Vcdc592q5xzKQ=w2400)';
        } else {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/NuoFsmbqn02anGT1vpMG64BcgobiM1lTm2v22vH-j5BargEnp-wNVUYRlTot3jY7Snz3T8vVyBfQQlieW2Vl5RmvOfECK3hRPNl3lePeLyezcHU2Tl7aaKqyiPwHp3ge7fS5jnRd0w=w2400)';
        }
      }else if((eventInfo.startTime) + (check)*0.75 >= currentTime){
        if (eventInfo.type === 'party') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/LFGeHzwmpOeBePnUZzlNBdwTfCwoTw5P6kAx7o8uUCdPwUvXvC_3mvPROpPF3oYkcxXG8Ap-varv0KR_qTRGA_cNvp6Nv6pXeSmmyDCmJ3AhwraQUxXP9QFswNYrEkCBn2CweIsN6g=w2400)';
        } else if (eventInfo.type === 'networking') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/ll7lT3lmwMBshUtRjzGfj_zXTOpEbB7R7ueDUz8iJx3bhoXI5yjfZ9Wx9w5Ou49ynxBsfEgwMI2XEJ3wWxgSZx5HSu3mB600HuFGXC9m0gq5IxG48SJfUjAk4w2jhqSuzVL-UsMgCw=w2400)';
        } else {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/-5d8hnDLbFZbkISW0J8bvPGyDZgdO24j3P2lRdvRWITGMqsBi3AhHt1BUT7bKaPQSBRvVM_clcMbtO38FkzMObntvJjB4798cggE1gFSxVZIqgKKXEfkfF0DC6wKYiLs3WI0AtS9Xg=w2400)';
        }
      }else if((eventInfo.endTime) >= currentTime){
        if (eventInfo.type === 'party') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/f29YV14ebVAcftjiNcVpiKvzy52j0je6o4rgfgVSyVVfeVyNZgc86c7NiaoyddKckJAMY7LbmYmJsU1-HsxHQs_OuP9riSmS_5-ujLVAc1tG-y94V9K9UP9DKL_Uk4LypQ81vpQ5EQ=w2400)';
        } else if (eventInfo.type === 'networking') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/kGtGgAcoVv8zj4l6tHJribovAKnR4ug8830Ovbaz8c3IhgKiC_u2IFHFyPSN_GTLa-uRKPEdeUOateKFhnfQfUYTiCHHWccVgqwRuTH-Fvw_-YEBF3aUZK29ZKQN6aaDe1ydWUOeNA=w2400)';
        } else {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/52Y56xNR9OzwcTzyaZzaF-nXJK14Dy3NXZTT12gzx6reMLNUg-i7GTKz4Zq6SQ6kXIhgeY_xB-b_63hukdfTgzB6G8Ubq_LWaPQvuO5JboY88K7l0ZWxgz3AKolT0nReL0QhidXDnQ=w2400)';
        }
      }else{
        if (eventInfo.type === 'party') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/QWA2htyQ1RpyFOcfUEfuCSbfBUnspNyjudf3gWYtVkHJJdSNsyOkmC9N0YrnDPwTdRQ-QLApSQ5Q6IW6weBfGbbkMnIhlhwxtSVcEtTJY27VhpmLJowg1iyK8WTdIf4AgjWRSqJtEw=w2400)';
        } else if (eventInfo.type === 'networking') {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/uMWsfzMX-h0vkJACrHBqn0HBB6fA9ZyuhMD3SFJWnk9OgBgIp_zfwC5_RPlQ2evwL4iwaeMegZtHHEUAof0MX7ML2B1ANB1qaxsZ7pcw5Ch5_ujJ1EuzzUbjDGHvvk219c2pnWHmKw=w2400)';
        } else {
            el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/vybjXk9YzgqeTZg__ICKBoi9egT7xx4zRNhbqd7iWw7TkPpH7Y9GzxpIpbRb44c82s-HoDtDCwTt8M9JjYmTvDujl62WU2if-RGkObEGpA1WArj6z9A7W6gVkHFnW_s1XwWPnO3-vg=w2400)';
        }
      }
        el.addEventListener('click', (e) => {
            this.showEventDetails = true;
            this.showUserDetails = false;
            this.showPing = false;
            this.currentEventTitle = eventInfo.name;
            this.currentEventDes = eventInfo.type + ' @ ' + eventInfo.startTime.toDateString() + ' ' + eventInfo.startTime.getHours() + ':' + minutes;
            this.currentEventId = el.id;
            //this.showCheckIn = this.geofirex.distance(this.geofirex.point(this.location[1], this.location[0]),
            //    eventInfo.position) < 0.025 && startTime < new Date();
        });
        console.log(el);
        //const marker = new mapboxgl.Marker(el);
        try {
            console.log('made');
            const marker = new mapboxgl.Marker(el);
            marker.setLngLat(doc.geometry.coordinates).addTo(this.map);
          //var marker = new mapboxgl.Marker().setLngLat(doc.geometry.coordinates).addTo(this.map);

            console.log(marker);
        } catch (e) {
            console.log(e.message);
            console.log('it');
        }
  }

    createMarker() {
      console.log("createMarker");
        const el = document.createElement('div');
        el.className = 'marker-style';
        return el;
    }

    presentCurrentLocation() {
        const el = this.createMarker();
        el.style.width = '30px';
        el.style.height = '30px';

        this.us.getUserBasic(this.auth.getUID()).subscribe((val:any) => {
            el.style.backgroundImage = 'url(' + val.data.profilepic + ')';
            el.addEventListener('click', (e) => {
                this.showUserDetails = true;
                this.showEventDetails = false;
                this.showPing = false;
                this.otherUserName = val.data.name;
                this.otherUserStatus = 'Online';
                this.otherUserId = 'currentLocation';
                this.otherUserLocation = 'Here';
                this.checkedIn = val.data.checkedIn;
            });
            el.id = 'currentLocation';
            this.currentLocationMarker = new mapboxgl.Marker(el);
        })
    }

    buildMap(coords: any) {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/sreegrandhe/ckak2ig0j0u9v1ipcgyh9916y?optimize=true',
            zoom: 18,
            center: [coords.longitude, coords.latitude]
        });
        this.map.on('dragstart', () => {
            this.showEventDetails = false;
            this.showUserDetails = false;
            this.showPing = false;
        });
        this.map.on('dragend', () => {
            this.refreshContent();
        });
    }

    async presentFilter() {
        this.showFilter = !this.showFilter;
        if (!this.showFilter) {
            const elements = document.getElementsByClassName('mapboxgl-marker');
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < elements.length; i++) {
                (elements[i] as HTMLElement).style.display = 'block';
            }
        }
    }

    filterMarkers() {
        const elements = document.getElementsByClassName('mapboxgl-marker');
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < elements.length; i++) {
            (elements[i] as HTMLElement).style.display = 'block';
            if (elements[i].id === 'currentLocation') {
                continue;
            }
            let elementStatus = elements[i].getAttribute('data-private');
            const elementType = elements[i].getAttribute('data-type');
            const elementTime = new Date(elements[i].getAttribute('data-time'));
            const currentDate = new Date();

            if (this.queryDate && !(elementTime.getFullYear() === currentDate.getFullYear() &&
                elementTime.getMonth() === currentDate.getMonth() && elementTime.getDate() === currentDate.getDate())) {
                (elements[i] as HTMLElement).style.display = 'none';
                continue;
            }

            if (this.queryLink) {
                (elements[i] as HTMLElement).style.display = elements[i].getAttribute('data-link') === 'false' ? 'none' : null;
                continue;
            }

            if (this.queryStatus !== 'All') {
                elementStatus = elementStatus === 'false' ? 'Public' : ' Private';
            } else {
                elementStatus = 'All';
            }

            if (elementType !== this.queryType && this.queryType !== 'All' || this.queryStatus !== elementStatus) {
                (elements[i] as HTMLElement).style.display = 'none';
                continue;
            }

            (document.getElementById('searchbar') as unknown as IonSearchbar).getInputElement().then((input) => {
                const shouldShow = elements[i].getAttribute('data-name').toLowerCase().indexOf(input.value.toLowerCase()) > -1;
                (elements[i] as HTMLElement).style.display = !shouldShow ? 'none' : (elements[i] as HTMLElement).style.display;
            });
        }
    }

    async presentEventCreatorModal(data: string) {
        const modal = await this.modalController.create({
            component: MarkercreatorPage,
            componentProps: {
                eventID: data
            }
        });
        // TODO Auto Refresh on Create Marker
        return await modal.present();
    }

    async checkIn() {
        if (this.checkedIn) {
            if((await this.checkOut()).data.isSuccesful){
                this.es.checkin(this.currentEventId).subscribe((val) => {
                    this.utils.presentToast('Welcome to ' + this.currentEventTitle);
                }, (err) => console.error(err));
            }
        }
    }

    async checkOut() {
        const modal = await this.modalController.create({
            component: RatingPage,
            componentProps: {
                eventID: this.currentEventId,
            }
        });
        await modal.present();
        this.utils.presentToast('Goodbye from ' + this.currentEventTitle);
        return modal.onDidDismiss();
    }

    getDistance(lat1, lon1, lat2, lon2) {
        const earthRadiusKm = 6371;

        const dLat = this.degreesToRadians(lat2-lat1);
        const dLon = this.degreesToRadians(lon2-lon1);

        lat1 = this.degreesToRadians(lat1);
        lat2 = this.degreesToRadians(lat2);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return earthRadiusKm * c;
    }

    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }
}
