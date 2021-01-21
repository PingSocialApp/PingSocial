import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LinkSelectorPage } from './link-selector.page';

describe('LinkSelectorPage', () => {
  let component: LinkSelectorPage;
  let fixture: ComponentFixture<LinkSelectorPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LinkSelectorPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LinkSelectorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
