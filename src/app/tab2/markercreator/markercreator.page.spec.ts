import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {IonicModule} from '@ionic/angular';

import {MarkercreatorPage} from './markercreator.page';

describe('MarkercreatorPage', () => {
    let component: MarkercreatorPage;
    let fixture: ComponentFixture<MarkercreatorPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MarkercreatorPage],
            imports: [IonicModule.forRoot()]
        }).compileComponents();

        fixture = TestBed.createComponent(MarkercreatorPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
