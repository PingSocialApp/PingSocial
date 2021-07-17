import {
	AfterViewInit,
	Component,
	OnDestroy,
	OnInit
} from '@angular/core';
import {
	IonSearchbar,
	ModalController,
	Platform
} from '@ionic/angular';
import {
	environment
} from '../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import {
	Geolocation,
	Position
} from '@capacitor/geolocation'
import {
	forkJoin,
	merge,
	Subscription
} from 'rxjs';
import {
	AngularFireDatabase
} from '@angular/fire/database';
import {
	MarkercreatorPage
} from '../markercreator/markercreator.page';
import {
	RatingPage
} from '../../rating/rating.page';
import {
	MarkersService
} from 'src/app/services/markers.service';
import {
	UsersService
} from 'src/app/services/users.service';
import {
	AuthHandler
} from 'src/app/services/authHandler.service';
import {
	EventsService
} from 'src/app/services/events.service';
import {
	UtilsService
} from 'src/app/services/utils.service';

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
				}, (position, err) => {
					this.renderCurrent(position);
					this.refreshContent(true);
				});
			});
		}).catch((error) => {
			console.error('Error getting location', error);
		});
	}

	ngOnDestroy() {
		this.linksSub.unsubscribe();
		this.markersSub.unsubscribe();
	}

	refreshContent(reset = false) {
		// this.renderLinks(reset);

		const coords = this.map.getCenter();

		const sub = merge(this.ms.getRelevantEvents(coords.lat, coords.lng, 1000000000, reset),
			this.ms.getRelevantGeoPings(coords.lat, coords.lng, 1000000000, reset));
		this.markersSub = sub.subscribe((markerSet: any) => {
			// console.log(markerSet[0]);
			// console.log(markerSet[1]);
			// needs to change after geoping integration
			// const markerArr = markerSet;
			// console.log("marker arr", markerSet);
			if (markerSet.length !== 0) {
				this.presentCollectedData(markerSet);
			}
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

	getRadius() {
		return (78271 / (2 ** this.map.getZoom())) * 256;
	}

	renderLinks(reset) {
		const coords = this.map.getCenter();

		this.linksSub = this.ms.getLinks(coords.lat, coords.lng, this.getRadius(), reset).subscribe((res: any) => {
			this.allUserMarkers.forEach(tempMarker => {
				tempMarker.remove();
			});
			res.data.features.forEach(doc => {
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

	updateLocation(coords) {
		this.us.setUserLocation({
			longitude: coords.longitude,
			latitude: coords.latitude,
		}).subscribe((val: any) => console.log(val), (err: any) => console.error(err));
	}

	presentCollectedData(pointData) {
		if (pointData.data.features) {
			return;
		}

		const data = pointData.data;

		if (!this.map.getSource('events')) {
			this.map.addSource('events', {
				type: 'geojson',
				// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
				// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
				data: {
					type: 'FeatureCollection',
					features: data
				},
				cluster: true,
				clusterMaxZoom: 14, // Max zoom to cluster points on
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

		if (!pointData.data.features) {
			pointData.data.forEach(event => {
				if (event.properties.entity === 'event') {
					this.renderEvent(event);
				} else {
					this.renderPings(event);
				}
			})
		}
		// zooms in on clusters
		this.map.on('click', 'clusters', function (e) {
			const features = this.queryRenderedFeatures(e.point, {
				layers: ['clusters']
			});
			const clusterId = features[0].properties.cluster_id;
			const zoomLevel = this.getZoom() + 2;
			this.easeTo({
				center: features[0].geometry.coordinates,
				zoom: zoomLevel
			})
			//
		});

		const tempThis = this;

		this.map.on('moveend', function (e) {
			// all event objects
			// let points = this.querySourceFeatures('events');
			// all cluster objects
			const feat = this.queryRenderedFeatures(e.point, {
				layers: ['clusters']
			});
			const cc = this.getContainer();
			// all html of event objects
			const eventH = cc.getElementsByClassName('marker-style mapboxgl-marker mapboxgl-marker-anchor-center');
			// removes duplicate html objects
			for (let i = 0; i < eventH.length; i++) {
				for (let j = 0; j < eventH.length; j++) {
					if (eventH[i] && eventH[j]) {
						if ((eventH[i].id === eventH[j].id) && (i !== j)) {
							console.log('removed from array', eventH[i].id);
							document.getElementById(eventH[i].id).remove();
						}
					}
				}
			}
			// displays html points that are within events ((not within a cluster))
			for (const id of eventH) {
				// visually removes all html ponts
				// TODO: rewrite to turn off ones needed not turn on ones needed
				document.getElementById(id).setAttribute('in-cluster', 'false');
			}
			// current point to find distance from clusters
			let currentPoint;
			// finding points within cluster to color correctly
			for (const feature of feat) {
				// creation of new cluster marker html
				const el = document.createElement('div');
				el.className = 'marker-style';
				el.title = 'null';
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/zqmJ4Nq4yYFFjPv5laAkk0TmCn8VSyCHiVYG-PEeA2AnM8OCT1H4Zxrkd8AYeGQvjdQ01G3Tsl_7gOedKhQdNz4_A1A5qWTioVIbuc8kJQcKaaOdSR9Jm_BvSFMusetOtjfIhX80tA=w2400)';
				el.id = feature.id;
				el.setAttribute('in-cluster', 'true');

				try {
					const marker = new mapboxgl.Marker(el);
					marker.setLngLat(feature.geometry.coordinates).addTo(this);
					el.title = 'null';
				} catch (e) {
					console.log(e.message);
				}
				// array for point distances from cluster, smallest to largest
				const distArr = new Array(data.length);
				// array for points based on distances from cluster, smallest to largest (using above numbers)
				const pointArr = new Array(data.length);
				// puts distance and point into arrays
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
				// sets image and title of cluster html
				for (let j = 0; j < feature.properties.point_count; j++) {
					if (el !== null) {
						// if(document.getElementById(pointArr[j].properties.id)){
						for (const element of eventH) {
							if (element.id === pointArr[j].properties.id) {
								if (element.getAttribute('data-type') === 'party') {
									// set marker
									if (el.title === 'null') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/D8S67QwWNF7eTsPexMOtA1ouY2M_4yCwA9tkTPRENNZt065Y9VNgh53jPSLqRTKPuOdOQhurkFJ45ZnoDfNdrd54ZC42quXg5R19A2mX6sUVmiq4W0faltbInNS-va-8PsqmUOTgaA=w2400)';
										el.title = 'party';
										// marker set to professional
									} else if (el.title === 'professional') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/b5D-JjEPpnm7J24r_d_lGiC0WVqP7q70qj6p6daDLRvFT8MlFMi1qrGl4nWUShOd7brlDH7pzQ_oIx2MZubxZVWRbhbM_a88O_lOrl-bE-4eFgEnefbg6a8o-SBLfHBguQbA2RAAJQ=w2400)';
										el.title = 'partyprofessional';
										// marker set to hangout
									} else if (el.title === 'hangout') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/WYUFnZCCxln57EIFJIYwuO2ZtshK926bFLHfg6HPEsXO-WlPu22z-pvZdWPqpj59Q625zGZxcSyrb_1Lz9et2QCnsdugM13GQFsNDsh__1kmqOulYvr_3qVV5ojbzQDJ6qe44b85OA=w2400)';
										el.title = 'partyhangout';
										// cluster of all 3
									} else if (el.title === 'professionalhangout') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/ayMVFp_WBsb5JYEsnzi3m8wOuGMJ5dx-GubOdQ0gPlbAlN2RQn03X_RZxrMrUP8tr-52aAgrHf_mnwmr50wDCpHE-Lzashd9YV17bbtnQPU_EqQSe6Fy-RNigYCpYaqAZVNqzXmsMg=w2400)';
										el.title = 'all';
									}
								} else if (element.getAttribute('data-type') === 'professional') {
									// set marker
									if (el.title === 'null') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/sNPI9CircqQ0do5-wBNJD9npQdgblVv2-rL41yGw4UwBTY_BOWsc_kXYtYrQnMvlD0JL4tOSOE0TjujwgItL5YhQGMvVX3hzqebV7tm5_ScSCvBxA5sz8l2IKdclFmWBwT11wOn6_Q=w2400)';
										el.title = 'professional';
										// marker set to party
									} else if (el.title === 'party') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/b5D-JjEPpnm7J24r_d_lGiC0WVqP7q70qj6p6daDLRvFT8MlFMi1qrGl4nWUShOd7brlDH7pzQ_oIx2MZubxZVWRbhbM_a88O_lOrl-bE-4eFgEnefbg6a8o-SBLfHBguQbA2RAAJQ=w2400)';
										el.title = 'partyprofessional'
										// marker set to hangout
									} else if (el.title === 'hangout') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/2YvgzQe2QhF9VFhsVUCMM41xST5gFmsfyphoKFxfYIGIR6XHGp9iP7Zbx6Xzmrihxz8FWSjk_wSzWQ-SVf3LaHRwYIFJ6Tmnpezl4ikhuDiQ7574-3p7ndzewnIJp2rbIaVSVsLiKg=w2400)';
										el.title = 'professionalhangout';
										// cluster of all 3
									} else if (el.title === 'partyhangout') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/ayMVFp_WBsb5JYEsnzi3m8wOuGMJ5dx-GubOdQ0gPlbAlN2RQn03X_RZxrMrUP8tr-52aAgrHf_mnwmr50wDCpHE-Lzashd9YV17bbtnQPU_EqQSe6Fy-RNigYCpYaqAZVNqzXmsMg=w2400)';
										el.title = 'all';
									}
								} else if (element.getAttribute('data-type') === 'hangout') {
									// set marker
									if (el.title === 'null') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/eOx1U2_GUNNrtpcCszSp0cyXdDZWUGWFCc6XkkR05VKP7qYonD6HeWd8OQDRYUdC8qoMx9ONBXgb_H192XHvvRdJpeklIa5eJF2ZeKHYpUwTIGXAkWcqP8IZh9BnRGjFs4XvELE4sg=w2400)';
										el.title = 'hangout';
										// marker set to professional
									} else if (el.title === 'professional') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/2YvgzQe2QhF9VFhsVUCMM41xST5gFmsfyphoKFxfYIGIR6XHGp9iP7Zbx6Xzmrihxz8FWSjk_wSzWQ-SVf3LaHRwYIFJ6Tmnpezl4ikhuDiQ7574-3p7ndzewnIJp2rbIaVSVsLiKg=w2400)';
										el.title = 'professionalhangout';
										// marker set to party
									} else if (el.title === 'party') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/WYUFnZCCxln57EIFJIYwuO2ZtshK926bFLHfg6HPEsXO-WlPu22z-pvZdWPqpj59Q625zGZxcSyrb_1Lz9et2QCnsdugM13GQFsNDsh__1kmqOulYvr_3qVV5ojbzQDJ6qe44b85OA=w2400)';
										el.title = 'partyhangout';
										// cluster of all 3
									} else if (el.title === 'partyprofessional') {
										el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/ayMVFp_WBsb5JYEsnzi3m8wOuGMJ5dx-GubOdQ0gPlbAlN2RQn03X_RZxrMrUP8tr-52aAgrHf_mnwmr50wDCpHE-Lzashd9YV17bbtnQPU_EqQSe6Fy-RNigYCpYaqAZVNqzXmsMg=w2400)';
										el.title = 'all';
									}
								}
								if (el.title === 'all') {
									el.style.backgroundPosition = '45% 50%';
								}
								document.getElementById(element.id).setAttribute('in-cluster', 'true');
							}
						}
					}
				}
			}
			for (const id of eventH) {
				document.getElementById(id).style.display = document.getElementById(id).getAttribute('in-cluster') === 'false' ? 'inline' : 'none';
			}
		});
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
		el.id = doc.id;
		if (!!document.getElementById(el.id)) {
			document.getElementById(el.id).remove();
		}

		el.addEventListener('click', (e) => {
			this.showEventDetails = false;
			this.showUserDetails = false;
			this.showPing = true;
			this.pingMessage = pingInfo.sentMessage;
			// this.pingDate = this.convertTime(Date.now() - pingInfo.timeCreate.toDate());
			this.pingImg = pingInfo.creatorProfilePic;
			this.pingAuthor = pingInfo.creatorName;
		});

		el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/zqmJ4Nq4yYFFjPv5laAkk0TmCn8VSyCHiVYG-PEeA2AnM8OCT1H4Zxrkd8AYeGQvjdQ01G3Tsl_7gOedKhQdNz4_A1A5qWTioVIbuc8kJQcKaaOdSR9Jm_BvSFMusetOtjfIhX80tA=w2400)';
		el.className += ' ping-marker';
		el.setAttribute('is-event', doc.entity);
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
			el = document.getElementById(eventInfo.id)
		} else {
			el = this.createMarker();
		}
		el.setAttribute('in-cluster', 'false');
		el.setAttribute('data-name', eventInfo.eventName);
		el.setAttribute('data-private', eventInfo.isPrivate);
		el.setAttribute('data-type', eventInfo.type);
		el.setAttribute('is-event', eventInfo.entity);
		el.id = eventInfo.id;

		const startTime = new Date(eventInfo.startTime);
		const endTime = new Date(eventInfo.endTime);
		let startMinutes = startTime.getMinutes() < 10 ? '0' : '';
		startMinutes += startTime.getMinutes();
		let endMinutes = startTime.getMinutes() < 10 ? '0' : '';
		endMinutes += startTime.getMinutes();

		el.setAttribute('data-time', eventInfo.startTime);
		if (!!document.getElementById(el.id)) {
			document.getElementById(el.id).remove();
		}
		// total event time
		const check = (endTime.getTime() - startTime.getTime());
		// current itme
		const currentTime = new Date().getTime();
		// figures out time for specific image on marker
		if ((startTime.getTime()) + (check) * 0.25 >= currentTime) {
			if (eventInfo.type === 'party') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/D8S67QwWNF7eTsPexMOtA1ouY2M_4yCwA9tkTPRENNZt065Y9VNgh53jPSLqRTKPuOdOQhurkFJ45ZnoDfNdrd54ZC42quXg5R19A2mX6sUVmiq4W0faltbInNS-va-8PsqmUOTgaA=w2400)';
			} else if (eventInfo.type === 'professional') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/sNPI9CircqQ0do5-wBNJD9npQdgblVv2-rL41yGw4UwBTY_BOWsc_kXYtYrQnMvlD0JL4tOSOE0TjujwgItL5YhQGMvVX3hzqebV7tm5_ScSCvBxA5sz8l2IKdclFmWBwT11wOn6_Q=w2400)';
			} else {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/eOx1U2_GUNNrtpcCszSp0cyXdDZWUGWFCc6XkkR05VKP7qYonD6HeWd8OQDRYUdC8qoMx9ONBXgb_H192XHvvRdJpeklIa5eJF2ZeKHYpUwTIGXAkWcqP8IZh9BnRGjFs4XvELE4sg=w2400)';
			}
		} else if ((startTime.getTime()) + (check) * 0.5 >= currentTime) {
			if (eventInfo.type === 'party') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/u3_6-40YDItN7xRsctrM7Hn0wu1EHA2cqHHuADOZ72ligPMAMmx1DlKAfgZBr67ldOIaaAla0LtEQ4C3kqhdRD3F0Xca_rBW6yiOcke5XhqjIR_Q7SSsfr8LHLii4E_uzpNMY9VwQg=w2400)';
			} else if (eventInfo.type === 'professional') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/BGlAGEj3IYFj1fjwRi1p32x84V-3ZP_PpBvqoRLVtgzOeM1WdGTS3SSm8-dI5zXH8LvXKaqRTH7fDNHwobmMysgA9eUbW7CA8-EA73W87Q9hvTUAER6dTG8ZcVm41Vcdc592q5xzKQ=w2400)';
			} else {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/NuoFsmbqn02anGT1vpMG64BcgobiM1lTm2v22vH-j5BargEnp-wNVUYRlTot3jY7Snz3T8vVyBfQQlieW2Vl5RmvOfECK3hRPNl3lePeLyezcHU2Tl7aaKqyiPwHp3ge7fS5jnRd0w=w2400)';
			}
		} else if ((startTime.getTime()) + (check) * 0.75 >= currentTime) {
			console.log('half');
			if (eventInfo.type === 'party') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/LFGeHzwmpOeBePnUZzlNBdwTfCwoTw5P6kAx7o8uUCdPwUvXvC_3mvPROpPF3oYkcxXG8Ap-letv0KR_qTRGA_cNvp6Nv6pXeSmmyDCmJ3AhwraQUxXP9QFswNYrEkCBn2CweIsN6g=w2400)';
			} else if (eventInfo.type === 'professional') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/ll7lT3lmwMBshUtRjzGfj_zXTOpEbB7R7ueDUz8iJx3bhoXI5yjfZ9Wx9w5Ou49ynxBsfEgwMI2XEJ3wWxgSZx5HSu3mB600HuFGXC9m0gq5IxG48SJfUjAk4w2jhqSuzVL-UsMgCw=w2400)';
			} else {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/-5d8hnDLbFZbkISW0J8bvPGyDZgdO24j3P2lRdvRWITGMqsBi3AhHt1BUT7bKaPQSBRvVM_clcMbtO38FkzMObntvJjB4798cggE1gFSxVZIqgKKXEfkfF0DC6wKYiLs3WI0AtS9Xg=w2400)';
			}
		} else if ((endTime.getTime()) >= currentTime) {
			console.log('three quarters');
			if (eventInfo.type === 'party') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/f29YV14ebVAcftjiNcVpiKvzy52j0je6o4rgfgVSyVVfeVyNZgc86c7NiaoyddKckJAMY7LbmYmJsU1-HsxHQs_OuP9riSmS_5-ujLVAc1tG-y94V9K9UP9DKL_Uk4LypQ81vpQ5EQ=w2400)';
			} else if (eventInfo.type === 'professional') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/kGtGgAcoVv8zj4l6tHJribovAKnR4ug8830Ovbaz8c3IhgKiC_u2IFHFyPSN_GTLa-uRKPEdeUOateKFhnfQfUYTiCHHWccVgqwRuTH-Fvw_-YEBF3aUZK29ZKQN6aaDe1ydWUOeNA=w2400)';
			} else {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/52Y56xNR9OzwcTzyaZzaF-nXJK14Dy3NXZTT12gzx6reMLNUg-i7GTKz4Zq6SQ6kXIhgeY_xB-b_63hukdfTgzB6G8Ubq_LWaPQvuO5JboY88K7l0ZWxgz3AKolT0nReL0QhidXDnQ=w2400)';
			}
		} else {
			if (eventInfo.type === 'party') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/f29YV14ebVAcftjiNcVpiKvzy52j0je6o4rgfgVSyVVfeVyNZgc86c7NiaoyddKckJAMY7LbmYmJsU1-HsxHQs_OuP9riSmS_5-ujLVAc1tG-y94V9K9UP9DKL_Uk4LypQ81vpQ5EQ=w2400)';
			} else if (eventInfo.type === 'professional') {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/kGtGgAcoVv8zj4l6tHJribovAKnR4ug8830Ovbaz8c3IhgKiC_u2IFHFyPSN_GTLa-uRKPEdeUOateKFhnfQfUYTiCHHWccVgqwRuTH-Fvw_-YEBF3aUZK29ZKQN6aaDe1ydWUOeNA=w2400)';
			} else {
				el.style.backgroundImage = 'url(https://lh3.googleusercontent.com/52Y56xNR9OzwcTzyaZzaF-nXJK14Dy3NXZTT12gzx6reMLNUg-i7GTKz4Zq6SQ6kXIhgeY_xB-b_63hukdfTgzB6G8Ubq_LWaPQvuO5JboY88K7l0ZWxgz3AKolT0nReL0QhidXDnQ=w2400)';
			}
		}
		el.addEventListener('click', (e) => {
			this.showEventDetails = true;
			this.showUserDetails = false;
			this.showPing = false;
			this.currentEventTitle = 'Filler name';
			// this.currentEventTitle = eventInfo.name;
			this.currentEventDes = eventInfo.type + ' @ ' + startTime.toDateString() + ' ' +
				startTime.getHours() + ':' + startMinutes + ' - ' + endTime.getHours() + ':' + endMinutes;
			this.currentEventId = el.id;
		});
		try {
			const marker = new mapboxgl.Marker(el);
			marker.setLngLat(doc.geometry.coordinates).addTo(this.map);
		} catch (e) {
			console.log(e.message);
		}
	}

	createMarker() {
		const el = document.createElement('div');
		el.className = 'marker-style';
		return el;
	}

	presentCurrentLocation() {
		const el = this.createMarker();
		el.style.width = '30px';
		el.style.height = '30px';

		this.us.getUserBasic(this.auth.getUID()).subscribe((val: any) => {
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
			if ((await this.checkOut()).data.isSuccesful) {
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

	getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
		const earthRadiusKm = 6371;

		const dLat = this.degreesToRadians(lat2 - lat1);
		const dLon = this.degreesToRadians(lon2 - lon1);

		lat1 = this.degreesToRadians(lat1);
		lat2 = this.degreesToRadians(lat2);

		const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return earthRadiusKm * c;
	}

	degreesToRadians(degrees) {
		return degrees * Math.PI / 180;
	}
}