import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UsersService} from '../../services/users.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {IonSlides} from '@ionic/angular';
import {Router} from '@angular/router';
import { UtilsService } from 'src/app/services/utils.service';
import { StatusBar } from '@capacitor/status-bar';

@Component({
    selector: 'app-registration',
    templateUrl: './registration.page.html',
    styleUrls: ['./registration.page.scss'],
    providers: [UsersService, AngularFireStorage]
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

    constructor(private r: Router,
                private us: UsersService, public auth: AngularFireAuth, private utils: UtilsService) {
    }

    ngOnInit() {
        StatusBar.hide();
        this.currentProgress = 1/3;
    }

    ngOnDestroy(){

    }

    slideChanged(){
        this.slides.getActiveIndex().then(index => {
            this.currentProgress = (index + 1) * 1/3;
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
        this.us.handleFile(files);
    }

    async createProfile() {
        if ((document.getElementById('username') as HTMLInputElement).value === '') {
            this.utils.presentToast('Whoops! Looks like you forgot your name', 'warning');
            return;
        }

        const loading = await this.utils.presentAlert('Creating Profile...');
        this.us.updateProfile().subscribe(() => {
            Promise.all([loading.dismiss(),this.r.navigate(['/registration/tutorial'])]);
        }, async (err) => {
            loading.dismiss();
            console.error(err);
        });
    }
}
