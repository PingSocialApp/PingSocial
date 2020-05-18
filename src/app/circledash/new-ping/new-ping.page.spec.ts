import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NewPingPage } from './new-ping.page';

describe('NewPingPage', () => {
  let component: NewPingPage;
  let fixture: ComponentFixture<NewPingPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewPingPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NewPingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
