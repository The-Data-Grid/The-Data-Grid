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
const organizationSubmission = JSON.parse(fs.readFileSync(__dirname + '/json/user/submissionObject2.json'));
const createUser = JSON.parse(fs.readFileSync(__dirname + '/json/user/newUserObject1.json'));
const createUser2 = JSON.parse(fs.readFileSync(__dirname + '/json/user/newUserObject2.json'));
const setAdminRole = JSON.parse(fs.readFileSync(__dirname + '/json/user/setRoleObject1.json'));
const setAuditorRole = JSON.parse(fs.readFileSync(__dirname + '/json/user/setRoleObject2.json'));

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
    organizationID: ['organizationID', 3],
    userID: ['userID', 4],
};

// Endpoints to test
const userAPI = '/api/user';
const auditUploadAPI = '/api/audit/submission'

/**
 * TESTS
 * 
 * Tests flow described in the 'Access Management' section of the Architecture Documentation
 */

// Create a new organizaiton
test('Superuser can create a new organization through the Audit Upload API', done => {
    request
        .post(auditUploadAPI)
        .send(organizationSubmission)
        .set(...superuserCredentials.privilege)
        .set(...superuserCredentials.role)
        .set(...superuserCredentials.organizationID)
        .set(...superuserCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(() => {
// Create a new account
// test('Anybody can create a new user through the User Management API', done => {
    request
        .post(userAPI)
        .send(createUser)
        .set(...guestCredentials.privilege)
        .set(...guestCredentials.role)
        .set(...guestCredentials.organizationID)
        .set(...guestCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(() => {
// Grant admin role by superuser
// test('Superuser can grant the admin role to a user', done => {
    request
        .put(userAPI + '/role')
        .send(setAdminRole)
        .set(...superuserCredentials.privilege)
        .set(...superuserCredentials.role)
        .set(...superuserCredentials.organizationID)
        .set(...superuserCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(() => {
// Create a new account
// test('Anybody can create a new user through the User Management API (again)', done => {
    request
        .post(userAPI)
        .send(createUser2)
        .set(...guestCredentials.privilege)
        .set(...guestCredentials.role)
        .set(...guestCredentials.organizationID)
        .set(...guestCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(() => {
// Grant auditor role by organization admin
// test('Organization admin can grant the auditor role to a user', done => {
    request
        .put(userAPI + '/role')
        .send(setAuditorRole)
        .set(...adminCredentials.privilege)
        .set(...adminCredentials.role)
        .set(...adminCredentials.organizationID)
        .set(...adminCredentials.userID)
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(finishTest(done))
// JavaScript is so pretty...
})})})})});

function finishTest(done) {
    return (err, res) => {
        if (err) {
            //console.log(`API Error: ${err.status} - ${err.body}`)
            return done(err);
        }
        return done();
      }
}
