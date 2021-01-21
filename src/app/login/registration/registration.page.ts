import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UpdateProfileService} from '../../services/update-profile.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {IonSlides, LoadingController} from '@ionic/angular';
import {Router} from '@angular/router';

@Component({
    selector: 'app-registration',
    templateUrl: './registration.page.html',
    styleUrls: ['./registration.page.scss'],
    providers: [UpdateProfileService, AngularFireStorage, AngularFirestore]
})
export class RegistrationPage implements OnInit, OnDestroy {
    @ViewChild('fileinput', {static: false}) fileinput: ElementRef;
    @ViewChild('mySlider') slides: IonSlides;

    slideOpts = {
        initialSlide: 0,
        speed: 400
    };

    name: string;
    currentProgress: number;
    orgType: string;
    info: string;

    constructor(private loadingController: LoadingController, private r: Router,
                private updateProfileService: UpdateProfileService, public auth: AngularFireAuth) {
        this.currentProgress = 0.25;
        this.orgType = 'Independant';
        this.info = 'per';
    }

    ngOnInit() {

    }

    ngOnDestroy(){

    }

    slideChanged(){
        this.slides.getActiveIndex().then(index => {
            this.currentProgress = (index + 1) * 0.25;
        });
    }

    swipeNext() {
        this.slides.slideNext();
    }

    swipeBack(){
        this.slides.slidePrev();
    }

    captureImage() {
        this.fileinput.nativeElement.click();
    }

    handleFile(files: FileList) {
        this.updateProfileService.handleFile(files);
    }

    async createProfile() {
        const loading = await this.loadingController.create({
            message: 'Creating Profile...',
            duration: 2000
        });
        await loading.present();
        if ((document.getElementById('username') as HTMLInputElement).value === '') {
            this.updateProfileService.presentToast('Whoops! Looks like you forgot your name');
            return;
        }
        this.updateProfileService.updateSettings().then(() => {
            loading.dismiss();
            this.r.navigate(['']);
        });
    }

    changeOrg($event: any) {
        this.orgType = $event.detail.value;
    }

    changeInfo($event: any) {
        this.info = $event.detail.value;
    }
}
