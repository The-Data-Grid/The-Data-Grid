/**
 * CONFIG
 */
// Set the app to Testing mode first
process.argv[2] = '--test'
// Link to server file
var app = require('../app'); 

const supertest = require('supertest');
const request = supertest(app);

// Shape of Object matcher
const { toMatchOneOf, toMatchShapeOf } = require('jest-to-match-shape-of')
 
expect.extend({
  toMatchOneOf,
  toMatchShapeOf,
})

/**
 * ENDPOINTS
 */
// Define different endpoints to test
let submission = '/api/audit/submission';

/**
 * OBJECTS
 */

/**
 * TESTS
 */

test('Upload Item 1: Sink, Room, Building', done => {
    // TODO: add example_createItemObject.js here
})


// Helper functions
function checkResponse(res, status) {
    if (!expect(res).toBeDefined() || !expect(res.status).toBe(status)) {
        return false;
    }
    return true;
}

