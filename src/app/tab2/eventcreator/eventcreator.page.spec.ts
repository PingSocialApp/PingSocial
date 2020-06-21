import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {IonicModule} from '@ionic/angular';

import {EventcreatorPage} from './eventcreator.page';

describe('EventcreatorPage', () => {
    let component: EventcreatorPage;
    let fixture: ComponentFixture<EventcreatorPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EventcreatorPage],
            imports: [IonicModule.forRoot()]
        }).compileComponents();

        fixture = TestBed.createComponent(EventcreatorPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
