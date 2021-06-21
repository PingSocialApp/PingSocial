import { TestBed } from '@angular/core/testing';

import { AuthHandler } from './authHandler.service';

describe('RestServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AuthHandler = TestBed.get(AuthHandler);
    expect(service).toBeTruthy();
  });
});
