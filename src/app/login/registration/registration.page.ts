import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UsersService} from '../../services/users.service';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireAuth} from '@angular/fire/auth';
import {IonSlides, LoadingController} from '@ionic/angular';
import {Router} from '@angular/router';
import { UtilsService } from 'src/app/services/utils.service';

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

    constructor(private loadingController: LoadingController, private r: Router,
                private us: UsersService, public auth: AngularFireAuth, private utils: UtilsService) {
    }

    ngOnInit() {
        this.currentProgress = 1/3;
    }

    ngOnDestroy(){

    }

    slideChanged(){
        this.slides.getActiveIndex().then(index => {
            this.currentProgress = (index + 1) * 1/3;
            console.log(this.currentProgress);
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
        const loading = await this.loadingController.create({
            message: 'Creating Profile...',
            duration: 2000
        });
        if ((document.getElementById('username') as HTMLInputElement).value === '') {
            await this.utils.presentToast('Whoops! Looks like you forgot your name');
            return;
        }
        await loading.present();
        this.us.updateProfile().subscribe(() => {
            loading.dismiss();
            this.r.navigate(['']);
        }, async (err) => {
            loading.dismiss();
            const errorToast = await this.loadingController.create({
                message: 'Whoops! Something happened. Try again!',
                duration: 2000
            });
            console.error(err);
            errorToast.present();
        });
    }
}
