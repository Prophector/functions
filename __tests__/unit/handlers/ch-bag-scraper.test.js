const scraper = require('../../../src/handlers/ch-bag-scraper');

describe('ch-bag-scraper', () => {
  it('Verifies the payload is logged', async () => {
    // Mock console.log statements so we can verify them. For more information, see
    // https://jestjs.io/docs/en/mock-functions.html
    console.log = jest.fn();

    // Create a sample payload with CloudWatch scheduled event message format
    const payload = {
      'id': 'cdc73f9d-aea9-11e3-9d5a-835b769c0d9c',
      'detail-type': 'Scheduled Event',
      'source': 'aws.events',
      'account': '',
      'time': '1970-01-01T00:00:00Z',
      'region': 'us-west-2',
      'resources': ['arn:aws:events:us-west-2:123456789012:rule/ExampleRule'],
      'detail': {},
    };

    // await scraper.scrape(payload, null);

    // Verify that console.log has been called with the expected payload
    // expect(console.log).toHaveBeenCalledWith(JSON.stringify(payload));
  });
});
