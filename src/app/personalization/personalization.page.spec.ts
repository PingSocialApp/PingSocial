import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PersonalizationPage } from './personalization.page';

describe('PersonalizationPage', () => {
  let component: PersonalizationPage;
  let fixture: ComponentFixture<PersonalizationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PersonalizationPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PersonalizationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
