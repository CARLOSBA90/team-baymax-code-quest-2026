import { AppService } from './app.service.js';

describe('AppService', () => {
  const service = new AppService();

  it('returns the API health contract', () => {
    expect(service.getHealth()).toEqual({ data: { status: 'ok' } });
  });

  it('returns a fresh response instead of sharing mutable health state', () => {
    const firstResponse = service.getHealth();
    firstResponse.data.status = 'changed';

    expect(service.getHealth()).toEqual({ data: { status: 'ok' } });
  });
});
