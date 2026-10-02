// Tests for Node.js/JavaScript
const assert = require('assert');
const request = require('supertest');
const app = require('./app');

describe('API Tests', () => {
  it('should return all items', async () => {
    const response = await request(app)
      .get('/api/items')
      .expect(200);

    assert.equal(response.body.success, true);
    assert.deepEqual(response.body.data, [
      {
        _id: '1',
        name: 'Item 1',
        price: 10.99,
        createdAt: '2022-01-01T00:00:00',
        updatedAt: '2022-01-01T00:00:00'
    },
    {
      _id: '2',
      name: 'Item 2',
      price: 20.99,
     createdAt: '2022-01-01T00:00:00',
     updatedAt: '2022-01-01T00:00:00'
    }
  ]);
  });
  });
});