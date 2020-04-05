import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { UserprofilePage } from './userprofile.page';

describe('UserprofilePage', () => {
  let component: UserprofilePage;
  let fixture: ComponentFixture<UserprofilePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserprofilePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(UserprofilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
