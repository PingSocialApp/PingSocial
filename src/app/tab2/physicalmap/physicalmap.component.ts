import {AfterViewInit,Component,OnDestroy,OnInit} from '@angular/core';
import {
    // IonSearchbar,
ModalController,} from '@ionic/angular';
import {environment} from '../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {Geolocation,Position} from '@capacitor/geolocation'
import {combineLatest,Subscription} from 'rxjs';
import {MarkercreatorPage} from '../markercreator/markercreator.page';
import {RatingPage} from '../../rating/rating.page';
import {MarkersService} from 'src/app/services/markers.service';
import {UsersService} from 'src/app/services/users.service';
import {AuthHandler} from 'src/app/services/authHandler.service';
import {EventsService} from 'src/app/services/events.service';
import {UtilsService} from 'src/app/services/utils.service';

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
	// queryStatus = 'All';
	// queryType = 'All';
	// queryDate: boolean;
	// queryLink: boolean;
	currentEventId: string;
	showUserDetails: boolean;
	otherUserName = '';
	otherUserLocation: any;
	otherUserStatus = '';
	otherUserId: string;
	showClusterDetails: boolean;
	markerArray: Array<any>;
	markerArrayForCluster: Array<any>;
	clusterArray: Array<any>;

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

	constructor(private ms: MarkersService, private us: UsersService, private modalController: ModalController,
        public auth: AuthHandler, private es: EventsService, private utils: UtilsService) {
		mapboxgl.accessToken = environment.mapbox.accessToken;
	}

	ngOnInit() {
		this.allUserMarkers = [];
		this.location = [];
		this.showFilter = false;
		this.showEventDetails = false;
		this.showUserDetails = false;
		this.showPing = false;
		this.showClusterDetails = false;
		this.checkedIn = null;
	}

    ngAfterViewInit() {
        let pos = null;
        Geolocation.getCurrentPosition().then((resp) => {
            this.buildMap(resp.coords);
            this.updateLocation(resp.coords);
            pos = [resp.coords.latitude, resp.coords.longitude];
        }).then(() => {
            this.map.on('load', () => {
                this.presentCurrentLocation();
								this.map.resize();
                this.refreshContent(true);
                Geolocation.watchPosition({
                    enableHighAccuracy: true,
                },(position, err) => {
                    if(this.getDistance(pos[0], pos[1], position.coords.latitude, position.coords.longitude) >= 0.005){
                        this.updateLocation(position.coords);
                    }

                    this.renderCurrent(position);

                    pos = [position.coords.latitude, position.coords.longitude];

                    if(err){
                        console.error(err);
                    }
                });
            });
        }).catch((error) => {
            console.error('Error getting location', error);
        });
    }


    // TODO call on page kill or logout
    // https://blog.devgenius.io/where-ngondestroy-fails-you-54a8c2eca0e0
    ngOnDestroy() {
        this.linksSub.unsubscribe();
        this.markersSub.unsubscribe();
        this.currentLocationMarker.remove();
    }


		refreshContent(reset = false) {
			const coords = this.map.getCenter();
			this.renderLinks(reset, coords);

	        // TODO change radius
			const sub = combineLatest([this.ms.getRelevantEvents(coords.lat, coords.lng, 1000000000, reset),
				this.ms.getRelevantGeoPings(coords.lat, coords.lng, 1000000000, reset)
			]);
			this.markersSub = sub.subscribe((markerSet: any) => {
				const newSet = [...markerSet[0].data.features, ...markerSet[1].data.features];
				this.removeEvents(newSet);
			}, err => console.error(err));
		}

		removeEvents(newSet){
			if (newSet.length !== 0) {
				 if(this.markerArray){
					const dummyNewSet = newSet;
					for(const marker of this.markerArray){
						let flag = false;
						for(const dummyMarker of dummyNewSet){
							// NEELEY TODO: should work when stops sending old events; need to check
							if((marker.properties.id === dummyMarker.properties.id)){
								flag = true;
								break;
							}
						}
						if(!flag){
							if(document.getElementById(marker.properties.id)){
								document.getElementById(marker.properties.id).style.display = 'none';
								document.getElementById(marker.properties.id).remove();
							}
						}
					}
				 }
				this.markerArray = newSet;
				this.presentCollectedData({
					data: newSet
				});

			} else if(this.markerArray.length !== 0){
				for(const marker of this.markerArray){
					if(document.getElementById(marker.properties.id)){
						document.getElementById(marker.properties.id).style.display = 'none';
						document.getElementById(marker.properties.id).remove();
					}
				}
			}
		}

	getRadius() {
		return (78271 / (2 ** this.map.getZoom())) * 2560000;
	}

	renderUser(marker, lng, lat) {
		try {
			marker.setLngLat([lng, lat])
				.addTo(this.map);
		} catch (e) {
			console.error(e.message);
		}
	}

	convertTime(t) {
		if (t >= 86400000) {
			// days
			return Math.floor(t / 86400000) + 'd ago';
		} else if (t >= 3600000) {
			// hours
			return Math.floor(t / 3600000) + 'h ago';
		} else if (t >= 60000) {
			// mins
			return Math.floor(t / 60000) + 'm ago';
		} else if (t >= 1000) {
			// secs
			return Math.floor(t / 1000) + 's ago';
		} else {
			return 'Just Now';
		}
	}

	presentCollectedData(pointData) {
		// to call functions within file
		const tempThis = this;
		// if no data, don't rerender nothing
		if (!pointData.data) {
			return;
		}
		// geojson format
		const data = pointData.data;
		// sets up source and cluster layer
		tempThis.clusterSetUp(data);
		// rendering individual events and geopings
		if (data) {
			data.forEach(event => {
				if (!event.properties.sentMessage) {
					this.renderEvent(event);
				} else {
					this.renderPings(event);
				}
			})
		}

		this.map.on('moveend', function (e) {
			// all event objects
			// let points = this.querySourceFeatures('events');
			// all cluster objects
			const feat = this.queryRenderedFeatures(e.point, {
				layers: ['clusters']
			});
			tempThis.clusterArray = feat;
			const cc = this.getContainer();
			// all html of event objects
			const eventH = cc.getElementsByClassName('marker-style mapboxgl-marker mapboxgl-marker-anchor-center');
			// removes duplicate html objects
			tempThis.htmlDataSetUp(eventH);
			// current point to find distance from clusters
			tempThis.renderClusters(feat, data, eventH);
			for (const html of eventH) {
				if(html.id === undefined){
					document.getElementById(html.id).style.display = 'none';
					eventH.remove(html);
					break;
				}
				for (const cluster of feat) {
					if ((document.getElementById(html.id).getAttribute('in-cluster') === 'false')
							|| ((document.getElementById(html.id).getAttribute('in-cluster') === 'is-cluster')
							&& (parseInt(html.id, 10) === cluster.id))) {
								document.getElementById(html.id).style.display = 'inline';
								break;
					} else {
						document.getElementById(html.id).style.display = 'none';
					}
				}
				if(feat.length === 0){
					if(document.getElementById(html.id).getAttribute('in-cluster') === 'is-cluster'){
						document.getElementById(html.id).style.display = 'none';
					}else{
						document.getElementById(html.id).style.display = 'inline';
					}
				}
			}
		});
	}

	// start of subfunctions
	// sets up map for sources, clusters, and cluster click functions
	clusterSetUp(data) {
		// creates or updates source
		if (!this.map.getSource('events')) {
			this.map.addSource('events', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: data
				},
				cluster: true,
				clusterMaxZoom: 19, // Max zoom to cluster points on
				clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
				clusterProperties: {
					coordinates: ['max', ['get', 'coordinates']]
				}
			});
		} else {
			this.map.getSource('events').setData({
				type: 'FeatureCollection',
				features: data
			});
		}
		// creates cluster layer
		if (!this.map.getLayer('clusters')) {
			this.map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'events',
				filter: ['has', 'point_count'],
				paint: {
					'circle-opacity': 0.0
				}
			});
		}
	}
	// removes any duplicate html markers, prep to cluster
	htmlDataSetUp(events) {
		// removes duplicate html objects
		for (let i = 0; i < events.length; i++) {
			for (let j = 0; j < events.length; j++) {
				if (events[i] && events[j]) {
					if ((events[i].id === events[j].id) && (i !== j)) {
						document.getElementById(events[i].id).remove();
					}
				}
			}
		}
		// displays html points that are within events ((not within a cluster))
		for (const html of events) {
			// says all individual points not in cluster (set later if found in cluster)
			if (document.getElementById(html.id).getAttribute('in-cluster') !== 'is-cluster') {
				document.getElementById(html.id).setAttribute('in-cluster', 'false');
			}
		}
	}
	// renders clusters
	renderClusters(clusters, data, events) {
		// array for point distances from cluster, smallest to largest
		let distArr = new Array(data.length);
		// array for points based on distances from cluster, smallest to largest (using above numbers)
		let pointArr = new Array(data.length);
		// finding points within cluster to color correctly
		for (const feature of clusters) {
			// creation of new cluster marker html
			const el = this.createMarker();
			el.className += ' cluster';
			el.className += ' ping';
			el.id = feature.id;
			el.setAttribute('in-cluster', 'is-cluster');
			// TODO:
			// reposition more details button
			el.addEventListener('click', (e: any) => {
				if(((this.location[0] + 0.125 >= feature.geometry.coordinates[0])
				 && (this.location[0] - 0.125 <= feature.geometry.coordinates[0]))
						&& ((this.location[1] + 0.125 >= feature.geometry.coordinates[1]) && (this.location[1] - 0.125 <= feature.geometry.coordinates[1]))){
							this.showCheckIn = true;
						}
				const markerArray = this.markerArray;
				if(this.map.getZoom() >= 10.5){
					const srcElem = e.srcElement;
					const idValue = srcElem.id;
					for(const cluster of this.clusterArray){
						if(cluster.id === parseInt(idValue,10)){
							distArr = new Array(markerArray.length);
							pointArr = new Array(markerArray.length);
							this.markerArrayForCluster = this.getClusterDistances(cluster, markerArray, distArr, pointArr);
							pointArr.length = cluster.properties.point_count;
							// this.markerArray = pointArr;
							this.clusterArray = cluster;
							this.showEventDetails = false;
							this.showUserDetails = false;
							this.showPing = false;
							this.showClusterDetails = true;
							for(const element of this.markerArrayForCluster){
								if(element.properties.sentMessage){
									const timeBetween = (new Date(element.properties.timeExpire)).getTime() - (new Date()).getTime();
									let timeBetweenString = null;
									if(timeBetween <= 3600000){
										const temp = Math.ceil(timeBetween/60000) + 1;
										timeBetweenString = (temp).toString() + ' minutes remaining';
									}else{
										const temp = Math.ceil(timeBetween/3600000) + 1;
										timeBetweenString = (temp).toString() + ' hours remaining';
									}
									element.properties.timeCreate = timeBetweenString;
								}else{
									const startTime = new Date(element.properties.startTime);
									let startMinutes = startTime.getMinutes() < 10 ? '0' : '';
									startMinutes += startTime.getMinutes();
									element.properties.startTime = startTime.toDateString() + ' ' + startTime.getHours() + ':' + startMinutes;
								}
							}
							break;
						}
					}
				}else{
					const zoomLevel = this.map.getZoom() + 2;
      		this.map.easeTo({
        		center: feature.geometry.coordinates,
        		zoom: zoomLevel
      		})
				}
			});
			try {
				const marker = new mapboxgl.Marker(el);
				marker.setLngLat(feature.geometry.coordinates).addTo(this.map);
			} catch (e) {
				console.error(e.message);
			}
			// puts distance and point into arrays
			this.getClusterDistances(feature, data, distArr, pointArr);
			// sets image and title of cluster html
			for (let j = 0; j < feature.properties.point_count; j++) {
				if (el !== null) {
					// if(document.getElementById(pointArr[j].properties.id)){
					for (const element of events) {
						if (pointArr[j]) {
							if (element.id === pointArr[j].properties.id) {
								this.setClusterImage(el, element);
								if (document.getElementById(element.id).getAttribute('in-cluster') !== 'is-cluster') {
									document.getElementById(element.id).setAttribute('in-cluster', 'true');
								}
							}
						}
					}
				}
			}
		}
	}
	// gets distance from points to given cluster
	getClusterDistances(feature, data, distArr, pointArr) {
		let currentPoint;
		for (let j = 0; j < data.length; j++) {
			currentPoint = data[j].geometry;
			const squareDistX =
				(feature.geometry.coordinates[0] - currentPoint.coordinates[0]) * (feature.geometry.coordinates[0] - currentPoint.coordinates[0]);
			const squareDistY =
				(feature.geometry.coordinates[1] - currentPoint.coordinates[1]) * (feature.geometry.coordinates[1] - currentPoint.coordinates[1]);
			const currentDist = Math.sqrt(squareDistX + squareDistY);
			distArr[j] = currentDist;
			pointArr[j] = data[j];
		}

		// sorts arrays smallest to largest based on distance
		for (let j = 0; j < distArr.length; j++) {
			for (let k = j; k < distArr.length; k++) {
				if ((distArr[j] > distArr[k]) && (j !== k)) {
					const tempD = distArr[k];
					const tempP = pointArr[k];
					distArr[k] = distArr[j];
					pointArr[k] = pointArr[j];
					distArr[j] = tempD;
					pointArr[j] = tempP;
				}
			}
		}
		return pointArr;
	}
	// sets background image of cluster
	// el.classList.contains(className);
	// el.classList.remove(className)
	setClusterImage(el, element) {
		if (element.getAttribute('data-type') === 'party') {
			// set marker
			if (el.classList.contains('ping')) {
				el.classList.remove('ping');
				el.classList += ' party';
			} else if (el.classList.contains('professional')) {
				el.classList.remove('professional');
				el.classList += ' partyprofessional';
			} else if (el.classList.contains('hangout')) {
				el.classList.remove('hangout');
				el.classList += ' partyhangout';
			} else if (el.classList.contains('professionalhangout')) {
				el.classList.remove('professionalhangout');
				el.classList += ' all';
			}
		} else if (element.getAttribute('data-type') === 'professional') {
			// set marker
			if (el.classList.contains('ping')) {
				el.classList.remove('ping');
				el.classList += ' professional';
			} else if (el.classList.contains('party')) {
				el.classList.remove('party');
				el.classList += ' partyprofessional';
			} else if (el.classList.contains('hangout')) {
				el.classList.remove('hangout');
				el.classList += ' professionalhangout';
			} else if (el.classList.contains('partyhangout')) {
				el.classList.remove('partyhangout');
				el.classList += ' all';
			}
		} else if (element.getAttribute('data-type') === 'hangout') {
			// set marker
			if (el.classList.contains('ping')) {
				el.classList.remove('ping');
				el.classList += ' hangout';
			} else if (el.classList.contains('professional')) {
				el.classList.remove('professional');
				el.classList += ' professionalhangout';
			} else if (el.classList.contains('party')) {
				el.classList.remove('party');
				el.classList += ' partyhangout';
			} else if (el.classList.contains('partyprofessional')) {
				el.classList.remove('partyprofessional');
				el.classList += ' all';
			}
		}
		if (el.classList.contains('all')) {
			el.style.backgroundPosition = '45% 50%';
		}
	}

	renderPings(doc) {
		if (document.getElementById(doc.properties.id)) {
			return;
		}
		const pingInfo = doc.properties;
		let el = null;
		if (document.getElementById(pingInfo.id)) {
			el = document.getElementById(pingInfo.id);
		} else {
			el = this.createMarker();
		}
		el.id = pingInfo.id;
		if (!!document.getElementById(el.id)) {
			document.getElementById(el.id).remove();
		}

		const timeBetween = (new Date(pingInfo.timeExpire)).getTime() - (new Date()).getTime();
		let timeBetweenString = null;
		if(timeBetween <= 3600000){
			const temp = Math.ceil(timeBetween/60000) + 1;
			timeBetweenString = (temp).toString() + ' minutes remaining';
		}else{
			const temp = Math.ceil(timeBetween/3600000) + 1;
			timeBetweenString = (temp).toString() + ' hours remaining';
		}
		el.addEventListener('click', (e) => {
			this.showEventDetails = false;
			this.showUserDetails = false;
			this.showPing = true;
			this.showClusterDetails = false;
			this.pingMessage = pingInfo.sentMessage;
			this.pingDate = timeBetweenString;
			this.pingImg = pingInfo.creator.profilepic;
			this.pingAuthor = pingInfo.creator.name;
		});

		el.className += ' ping-marker';
		el.setAttribute('in-cluster', 'false');
		try {
			const marker = new mapboxgl.Marker(el);
			marker.setLngLat(doc.geometry.coordinates).addTo(this.map);
		} catch (e) {
			console.error(e.message);
		}
	}

	renderEvent(doc) {
		// create point html
		const eventInfo = doc.properties;
		let el = null;
		if (document.getElementById(eventInfo.id)) {
			el = document.getElementById(eventInfo.id);
			el.className = 'marker-style';

		} else {
			el = this.createMarker();
		}
		el.setAttribute('in-cluster', 'false');
		el.setAttribute('data-name', eventInfo.eventName);
		el.setAttribute('data-private', eventInfo.isPrivate);
		el.setAttribute('data-type', eventInfo.type);
		el.id = eventInfo.id;

		const startTime = new Date(eventInfo.startTime);
		const endTime = new Date(eventInfo.endTime);
		let startMinutes = startTime.getMinutes() < 10 ? '0' : '';
		startMinutes += startTime.getMinutes();
		let endMinutes = endTime.getMinutes() < 10 ? '0' : '';
		endMinutes += endTime.getMinutes();

		el.setAttribute('data-time', eventInfo.startTime);
		if (!!document.getElementById(el.id)) {
			document.getElementById(el.id).remove();
		}
		// total event time
		const check = (endTime.getTime() - startTime.getTime());
		// current itme
		const currentTime = new Date().getTime();
		// set type of event
		if (eventInfo.type === 'party') {
			el.className += ' party-marker';
		} else if (eventInfo.type === 'professional') {
			el.className += ' professional-marker';
		} else if (eventInfo.type === 'hangout') {
			el.className += ' hangout-marker';
		}
		// time left on event
		if ((startTime.getTime()) + (check) * 0.25 >= currentTime) {
			el.className += ' full';
		} else if ((startTime.getTime()) + (check) * 0.5 >= currentTime) {
			el.className += ' three-quarters';
		} else if ((startTime.getTime()) + (check) * 0.75 >= currentTime) {
			el.className += ' half'
		} else if ((endTime.getTime()) >= currentTime) {
			el.className += ' quarter';
		} else {
			el.className += ' empty';
		}
		el.addEventListener('click', (e) => {
			this.showEventDetails = true;
			this.showUserDetails = false;
			this.showPing = false;
			this.showClusterDetails = false;
			this.currentEventTitle = eventInfo.name;
			this.currentEventDes = eventInfo.type + ' @ ' + startTime.toDateString() + ' ' +
				startTime.getHours() + ':' + startMinutes + ' - ' + endTime.toDateString() + ' ' +
				endTime.getHours() + ':' + endMinutes;
			this.currentEventId = el.id;
			if(((this.location[0] + 0.125 >= doc.geometry.coordinates[0])
			 && (this.location[0] - 0.125 <= doc.geometry.coordinates[0]))
					&& ((this.location[1] + 0.125 >= doc.geometry.coordinates[1]) && (this.location[1] - 0.125 <= doc.geometry.coordinates[1]))){
						this.showCheckIn = true;
					}
		});
		try {
			const marker = new mapboxgl.Marker(el);
			marker.setLngLat(doc.geometry.coordinates).addTo(this.map);
		} catch (e) {
			console.error(e.message);
		}
	}

	createMarker() {
		const el = document.createElement('div');
		el.className = 'marker-style';
		return el;
	}

	async close() {
		this.showClusterDetails = false;
	}

	buildMap(coords: any) {
		this.map = new mapboxgl.Map({
			container: 'map',
			style: environment.mapbox.style,
			zoom: 17,
			maxZoom:17,
            minZoom: 10,
			center: [coords.longitude, coords.latitude]
		});
		this.map.on('dragstart', () => {
			this.showEventDetails = false;
			this.showUserDetails = false;
			this.showPing = false;
			this.showClusterDetails = false;
			this.showCheckIn = false;
		});
		this.map.on('dragend', () => {
			this.refreshContent();
		});
	}

	async checkOut(id) {
		this.checkedIn = '';
		const modal = await this.modalController.create({
			component: RatingPage,
			componentProps: {
				eventID: id,
			}
		});
		await modal.present();
		return modal.onDidDismiss();
	}

    renderCurrent(pos: Position) {
        // update current user location
            const lng = pos.coords.longitude;
            const lat = pos.coords.latitude;

            this.location = [lng, lat];

            // use api to get location
            this.renderUser(this.currentLocationMarker, lng, lat);
    }

    renderLinks(reset, coords) {
        this.linksSub = this.ms.getLinks(coords.lat,coords.lng,this.getRadius(),reset).subscribe((res:any) => {
			this.allUserMarkers.forEach(tempMarker => {
                tempMarker.remove();
            });
            res.data.features.forEach(doc => {
                // create marker and style it
                const el = this.createMarker();
                el.className += ' person-location';
                el.style.backgroundImage = 'url(' + doc.properties.profilepic + ')';
                // get other users longitude, latitude, and lastOnline vals
                const longi = doc.geometry.coordinates[0];
                const latid = doc.geometry.coordinates[1];

						// 		const reqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + longi + ',' + latid + '.json?access_token=' +
            			// mapboxgl.accessToken;

        				// get info from api
        				// fetch(reqStr).then(response => response.json())
            			// 	.then(data => {
						// 					this.otherUserLocation = data.features[3].text;
						// 				});

                // const lastOn = vals.lastOnline;
                // const oStat = vals.isOnline ? 'Online' : this.convertTime(Date.now() - lastOn);

                el.id = doc.properties.uid;
                const oMark = new mapboxgl.Marker(el);
                this.allUserMarkers.push(oMark);
                el.addEventListener('click', async (e) => {
                    this.showUserDetails = true;
                    this.showEventDetails = false;
                    this.otherUserName = doc.properties.name;
					const reqStr = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + longi + ',' + latid + '.json?access_token=' +
		            			mapboxgl.accessToken;
		        	fetch(reqStr).then(response => response.json())
		        		.then(data => {
							this.otherUserLocation = data.features[3].text;
						});
                    this.otherUserId = doc.properties.uid
                });
                this.renderUser(oMark, longi, latid);
            });
        }, error => {
            console.error(error);
            this.utils.presentToast('Whoops! Unable to get links');
        });
    }

    updateLocation(coords) {
			this.us.setUserLocation({
					location: {
						longitude: coords.longitude,
						latitude: coords.latitude,
					}
			}).subscribe((val: any) => console.log(val.data) ,(err: any) => console.error(err));
    }

    presentCurrentLocation() {
        const el = this.createMarker();
        el.className += ' person-location';

        this.us.getUserBasic(this.auth.getUID()).subscribe((val:any) => {
            el.style.backgroundImage = 'url(' + val.data.profilepic + ')';
			this.checkedIn = val.data.checkedIn;

            el.addEventListener('click', (e) => {
                this.showUserDetails = true;
                this.showEventDetails = false;
                this.showPing = false;
                this.otherUserName = val.data.name;
                this.otherUserStatus = 'Online';
                this.otherUserId = 'currentLocation';
                this.otherUserLocation = 'Here';
            });
            el.id = 'currentLocation';
            this.currentLocationMarker = new mapboxgl.Marker(el);
        }, err => {
            console.error(err);
            this.utils.presentToast('Whoops! Unable to get your marker');
        });
    }

    // async presentFilter() {
    //     this.showFilter = !this.showFilter;
    //     if (!this.showFilter) {
    //         const elements = document.getElementsByClassName('mapboxgl-marker');
    //         // tslint:disable-next-line:prefer-for-of
    //         for (let i = 0; i < elements.length; i++) {
    //             (elements[i] as HTMLElement).style.display = 'block';
    //         }
    //     }
    // }

    // filterMarkers() {
    //     const elements = document.getElementsByClassName('mapboxgl-marker');
    //     // tslint:disable-next-line:prefer-for-of
    //     for (let i = 0; i < elements.length; i++) {
    //         (elements[i] as HTMLElement).style.display = 'block';
    //         if (elements[i].id === 'currentLocation') {
    //             continue;
    //         }
    //         let elementStatus = elements[i].getAttribute('data-private');
    //         const elementType = elements[i].getAttribute('data-type');
    //         const elementTime = new Date(elements[i].getAttribute('data-time'));
    //         const currentDate = new Date();

    //         if (this.queryDate && !(elementTime.getFullYear() === currentDate.getFullYear() &&
    //             elementTime.getMonth() === currentDate.getMonth() && elementTime.getDate() === currentDate.getDate())) {
    //             (elements[i] as HTMLElement).style.display = 'none';
    //             continue;
    //         }

    //         if (this.queryLink) {
    //             (elements[i] as HTMLElement).style.display = elements[i].getAttribute('data-link') === 'false' ? 'none' : null;
    //             continue;
    //         }

    //         if (this.queryStatus !== 'All') {
    //             elementStatus = elementStatus === 'false' ? 'Public' : ' Private';
    //         } else {
    //             elementStatus = 'All';
    //         }

    //         if (elementType !== this.queryType && this.queryType !== 'All' || this.queryStatus !== elementStatus) {
    //             (elements[i] as HTMLElement).style.display = 'none';
    //             continue;
    //         }

    //         (document.getElementById('searchbar') as unknown as IonSearchbar).getInputElement().then((input) => {
    //             const shouldShow = elements[i].getAttribute('data-name').toLowerCase().indexOf(input.value.toLowerCase()) > -1;
    //             (elements[i] as HTMLElement).style.display = !shouldShow ? 'none' : (elements[i] as HTMLElement).style.display;
    //         });
    //     }
    // }

    async presentEventCreatorModal(data: string) {
				this.showEventDetails = false;
        const modal = await this.modalController.create({
            component: MarkercreatorPage,
            componentProps: {
                eventID: data
            }
        });
        modal.onDidDismiss().then(() => this.refreshContent());
        return await modal.present();
    }

    async checkIn(id: string, title: string) {
		if(this.checkedIn === ''){
			this.es.checkin(id).subscribe(() => {
				this.utils.presentToast('Welcome to ' + title);
				this.checkedIn = id;
			}, (err) => {
				console.error(err);
				this.utils.presentToast('Whoops! Unable to checkin');
			});
		}
    }

    getDistance(lat1:number, lon1:number, lat2:number, lon2:number) {
        const earthRadiusKm = 6371;

        const dLat = this.degreesToRadians(lat2-lat1);
        const dLon = this.degreesToRadians(lon2-lon1);

        lat1 = this.degreesToRadians(lat1);
        lat2 = this.degreesToRadians(lat2);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return earthRadiusKm * c; // KM
    }

    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }
}
