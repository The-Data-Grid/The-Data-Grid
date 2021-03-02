
// Set the app to Testing mode first
process.argv[2] = '--test'
// Link to server file
var app = require('../app'); 

const supertest = require('supertest');
const request = supertest(app);

// Define different endpoints to test
let observationBase = '/api/audit/observation/sink/';
let itemBase = '/api/audit/item/sink/';
let invalidBase = '/api/audit/observation/invalid/'

let o1 = observationBase + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset=0&sorta=334';
let o2 = observationBase + 'bad';
let o3 = observationBase + '194?13[get]=01-20-2000';
let o4 = observationBase + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&sorta=334';
let o5 = observationBase + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset=0';
let o6 = observationBase + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset=0&sorta=334&sortd=421';
let o7 = observationBase + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset=0&sorta=334&sorta=356';
let o8 = observationBase + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset[dne]&sorta=334';
let o9 = observationBase + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=0&offset=0&sorta=334';
let o10 = observationBase + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset=-10&sorta=334';
let e2 = '/api/audit/flower';
let o11 = observationBase + '194&334&78&35?13[gte]=01-20-2000&65[lte]=01-20-2020&limit=50&offset=0&sorta=abc'

test('Test api/audit endpoint', function (done) {
    request
        .get(observationBase)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 404);
            done();
        });
});

test('Test invalid feature', function (done) {
    request
        .get(invalidBase)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            expect(res.text).toBe('Bad Request 2201: invalid is not a valid feature')
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

test('Test limit requiring offset', function (done) {
    request
        .get(o4)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 2208: Limit requires offset');
            done();
        });
});

test('Test offset requiring sorta or sortd', function (done) {
    request
        .get(o5)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 2207: Offset requires either sorta or sortd');
            done();
        });
});

test('Test not using both sorta and sortd', function (done) {
    request
        .get(o6)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 2206: Cannot use both sorta and sortd');
            done();
        });
});

test('Test duplication of filters', function (done) {
    request
        .get(o7)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 2205: Cannot have duplicate filters');
            done();
        });
});

test('Test invalid operator for filter', function (done) {
    request
        .get(o8)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 2204: [dne] is not a valid operator for the offset filter');
            done();
        });
});

test('Test positive integer for filter ', function (done) {
    request
        .get(o9)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 2210: Field for limit must be a positive integer');
            done();
        });
});

test('Test positive integer or zero for filter', function (done) {
    request
        .get(o10)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 2209: Field for offset must be zero or a positive integer');
            done();
        });
});

test('Test for valid feature', function (done) {
    request
        .get(e2)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 2201: flower is not a valid feature' );
            done();
        });
});

test('Test for valid number for filter', function (done) {
    request
        .get(o11)
        .end(function (err, res) {
            if (err) return done(err);
            checkResponse(res, 400);
            console.log(res);
            expect(res.text).toBe('Bad Request 1602: Filter identifier: abc must be numeric' );
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

