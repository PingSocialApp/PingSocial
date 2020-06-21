import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {IonicModule} from '@ionic/angular';

import {CircledashPage} from './circledash.page';

describe('CircledashPage', () => {
    let component: CircledashPage;
    let fixture: ComponentFixture<CircledashPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CircledashPage],
            imports: [IonicModule.forRoot()]
        }).compileComponents();

        fixture = TestBed.createComponent(CircledashPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
