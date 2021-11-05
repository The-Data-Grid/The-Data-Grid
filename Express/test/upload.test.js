/**
 * CONFIG
 */
// Set the app to Testing mode first
process.argv[2] = '--test'
// Link to server file
const app = require('../app'); 
const fs = require('fs');

const supertest = require('supertest');
const request = supertest(app);

// Shape of Object matcher
const { toMatchOneOf, toMatchShapeOf } = require('jest-to-match-shape-of');
expect.extend({
  toMatchOneOf,
  toMatchShapeOf,
});

// Request Objects
const submissionObject1 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject1.json'));
const submissionObject2 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject2.json'));
const submissionObject3 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject3.json'));
const submissionObject4 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject4.json'));
const submissionObject5 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject5.json'));
const submissionObject6 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject6.json'));
const submissionObject7 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject7.json'));
const submissionObject8 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject8.json'));
const submissionObject9 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject9.json'));
const submissionObject10 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject10.json'));
const submissionObject11 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject11.json'));
const submissionObject12 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject12.json'));
const submissionObject13 = JSON.parse(fs.readFileSync(__dirname + '/json/upload/submissionObject13.json'));

// Requester Credentials
const superuserCredentials = {
    privilege: ['privilege', 'superuser'],
    role: ['role', 'admin'],
    organizationID: ['organizationID', 2],
    userID: ['userID', 1],
};
const guestCredentials = {
    privilege: ['privilege', 'guest'],
    role: ['role', null],
    organizationID: ['organizationID', null],
    userID: ['userID', null],
};
const adminCredentials = {
    privilege: ['privilege', 'user'],
    role: ['role', 'admin'],
    organizationID: ['organizationID', 1],
    userID: ['userID', 2],
};

// Endpoints to test
const uploadAPI = '/api/audit/submission';

/**
 * TESTS
 */
/*
test('Create items that reference eachother with existing global item is unauthorized for guest', done => {
    request
        .post(uploadAPI)
        .send(submissionObject1)
        .set(...guestCredentials.privilege)
        .set(...guestCredentials.role)
        .set(...guestCredentials.organizationID)
        .set(...guestCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(401)
        .end(finishTest(done));
});

test('Create items that reference eachother with existing global item', done => {
    request
        .post(uploadAPI)
        .send(submissionObject1)
        .set(...superuserCredentials.privilege)
        .set(...superuserCredentials.role)
        .set(...superuserCredentials.organizationID)
        .set(...superuserCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(finishTest(done));
});

// create every default location based item
// submissionObject2
test('Create every default location based item', done => {
    request
    .post(uploadAPI)
    .send(submissionObject2)
    .set(...superuserCredentials.privilege)
    .set(...superuserCredentials.role)
    .set(...superuserCredentials.organizationID)
    .set(...superuserCredentials.userID)
    .set('Content-Type', 'application/json')
    .expect(201)
    .end(finishTest(done));
});
// create other default items
// submissionObject3
test('Create other default items', done => {
    request
    .post(uploadAPI)
    .send(submissionObject3)
    .set(...adminCredentials.privilege)
    .set(...adminCredentials.role)
    .set(...adminCredentials.organizationID)
    .set(...adminCredentials.userID)
    .set('Content-Type', 'application/json')
    .expect(201)
    .end(finishTest(done));
});


// create global and audit
// submissionObject4
test('Create global and audit', done => {
    request
        .post(uploadAPI)
        .send(submissionObject4)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(finishTest(done));
});
    
// update and delete item
// submissionObject5, submissionObject6, submissionObject7
test('Create, update, and delete item', done => {
// Create item
    request
        .post(uploadAPI)
        .send(submissionObject5)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(() => {
// Update item
    request
        .post(uploadAPI)
        .send(submissionObject6)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(() => {
// Delete item
    request
        .post(uploadAPI)
        .send(submissionObject7)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(finishTest(done));
})})});

// create observation that references existing item
// submissionObject8
test('Create observation that references existing item', done => {
    request
        .post(uploadAPI)
        .send(submissionObject8)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(finishTest(done));
});
*/
// create observation that references created item
// submissionObjet9
test('Create observation that references created item', done => {
    request
        .post(uploadAPI)
        .send(submissionObject9)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(finishTest(done));
});
/*
// update and delete observation
// submissionObject10, submissionObject11, submissionObject12, submissionObject13
test('Create, update, and delete observation', done => {
// Create item
    request
        .post(uploadAPI)
        .send(submissionObject10)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(() => {
// Create observation
    request
        .post(uploadAPI)
        .send(submissionObject11)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(() => {
// Update observation
    request
        .post(uploadAPI)
        .send(submissionObject12)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(() => {
// Delete observation
    request
        .post(uploadAPI)
        .send(submissionObject13)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(finishTest(done));
})})})});
*/

function finishTest(done) {
    return (err, res) => {
        if (err) {
            //console.log(`API Error: ${err.status} - ${err.body}`)
            return done(err);
        }
        return done();
      }
}
