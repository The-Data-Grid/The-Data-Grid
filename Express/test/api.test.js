
var app = require('../app'); // Link to server file
const supertest = require('supertest');
const request = supertest(app);

// Define different endpoints to test
let e1 = '/api/audit/urinal/'
let o1 = e1 + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset=0&sorta=334';
let o2 = e1 + 'bad';
let o3 = e1 + '194?13[get]=01-20-2000';

let o4 = e1 + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&sorta=334';
let o5 = e1 + '194&334&78&35?13[gte]=01-20-2000&65[gte]=01-22-2020&limit=50&offset=0&sorta=334';
let o6 = e1 + '194&334&78&35?nofilter[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset=0&sorta=334';


//page 5 to see constructs

test('Test api/audit endpoint', function (done) {
    request
        .get(e1)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 404);
            done();
        });
});


//1601
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

//1602

test('Test invalid non-numeric filter identifier', function (done) {
    request
        .get(o6)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            expect(res.text).toBe('Bad Request 1602: nofilter must be numeric')
            done();
        });
});


//1603
test('Test invalid operator', function (done) {
    request
        .get(o3)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 1603: get is not a valid operator');
            done();
        });
});

//2201
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

//2205
test('Test invalid same operators', function (done) {
    request
        .get(o5)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            expect(res.text).toBe('Bad Request 2205: Cannot have duplicate filters')
            done();
        });
});


//2208
test('Test invalid feature', function (done) {
    request
        .get(o4)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            expect(res.text).toBe('Bad Request 2208: Limit requires offset')
            done();
        });
});


//1604-1606


// Helper functions
function checkResponse(res, status) {
    if (!expect(res).toBeDefined() || !expect(res.status).toBe(status)) {
        return false;
    }
    return true;
}

