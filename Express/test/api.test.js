
var app = require('../app'); // Link to server file
const supertest = require('supertest');
const request = supertest(app);

// Define different endpoints to test
let e1 = '/api/audit/urinal/'
let o1 = e1 + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset=0&sorta=334';
let o2 = e1 + 'bad';
let o3 = e1 + '/194?13[get]=01-20-2000';

test('Test api/audit endpoint', function (done) {
    request
        .get(e1)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 404);
            done();
        });
});

test('Test invalid feature', function (done) {
    request
        .get(o1)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            expect(res.text).toBe('Bad Request 2201: feature_urinal is not a valid feature')
            done();
        });
});

test('Test invalid non-numeric ID', function (done) {
    request
        .get(o2)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            expect(res.text).toBe('Bad Request 1601: bad must be numeric')
            done();
        });
});

test('Test invalid operator', function (done) {
    request
        .get(o3)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
           // expect(res.text).toBe('Bad Request 1603: get is not a valid operator');
            done();
        });
});

// Helper functions
function checkResponse(res, status) {
    if (!expect(res).toBeDefined() || !expect(res.status).toBe(status)) {
        return false;
    }
    return true;
}

