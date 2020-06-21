import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {IonicModule} from '@ionic/angular';

import {ReplypopoverComponent} from './replypopover.component';

describe('ReplypopoverComponent', () => {
    let component: ReplypopoverComponent;
    let fixture: ComponentFixture<ReplypopoverComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ReplypopoverComponent],
            imports: [IonicModule.forRoot()]
        }).compileComponents();

        fixture = TestBed.createComponent(ReplypopoverComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
