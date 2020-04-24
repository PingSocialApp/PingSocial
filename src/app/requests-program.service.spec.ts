import { TestBed } from '@angular/core/testing';

import { RequestsProgramService } from './requests-program.service';

describe('RequestsProgramService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RequestsProgramService = TestBed.get(RequestsProgramService);
    expect(service).toBeTruthy();
  });
});
