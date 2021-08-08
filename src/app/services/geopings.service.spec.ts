import { TestBed } from '@angular/core/testing';

import { GeopingsService } from './geopings.service';

describe('GeopingsService', () => {
  let service: GeopingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeopingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
