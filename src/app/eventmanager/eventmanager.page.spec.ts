import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventmanagerPage } from './eventmanager.page';

describe('EventmanagerPage', () => {
  let component: EventmanagerPage;
  let fixture: ComponentFixture<EventmanagerPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventmanagerPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventmanagerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
