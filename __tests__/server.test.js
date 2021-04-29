'use strict';

process.env.SECRET = "test";
const supergoose = require('@code-fellows/supergoose');
const { server } = require('../src/server.js');

const mockRequest = supergoose(server);

describe('AUTH ROUTES TESTS:', () => {
  it('should have POST /signup create a new user and send an obj with the user and the token to the client', async () => {
    const response = await mockRequest.post('/signup').send({ username: 'admin', password: 'password', role: 'admin' });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.user).toBe('object');
  });

  it('should have POST /signin with basic auth headers logs in a user and send an obj with user and token', async () => {
    const response = await mockRequest.post('/signin').auth('admin', 'password');

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.user).toBe('object');
  });
});

describe('V1 ROUTES TESTS:', () => {

  it('should have POST/api/v1/:model add an item to the DB and return an obj with added item', async () => {
    const response = await mockRequest.post('/api/v1/clothes').send({ name: 'Shirt', color: 'Blue', size: 'Small' });

    expect(response.status).toEqual(201);
    expect(response.body._id).toBeDefined();
    expect(typeof response.body).toBe('object');
  });

  it('should have GET/api/v1/:model return a list of items', async () => {
    const response = await mockRequest.get('/api/v1/clothes');

    expect(response.status).toEqual(200);
    expect(response.body[0].name).toEqual('Shirt');
  });

  it('should have GET/api/v1/:model/ID return item by ID', async () => {
    const jacket = await mockRequest.post('/api/v1/clothes').send({ name: 'Jacket', color: 'Red', size: 'Small' });
    const response = await mockRequest.get(`/api/v1/clothes/${jacket.body._id}`);

    expect(response.body._id).toEqual(jacket.body._id);
  });

  it('should have PUT/api/v1/:model/ID return a single, updated item by ID', async () => {
    const pants = await mockRequest.post('/api/v1/clothes').send({ name: 'Pants', color: 'Black', size: 'Small' });

    const response = await mockRequest.put(`/api/v1/clothes/${pants.body._id}`).send({ name: 'Pants', color: 'Black', size: 'Large'});

    expect(response.body.size).toEqual('Large');
    expect(response.body._id).toEqual(pants.body._id);
  });

  it('should have DELETE/api/v1/:model/ID return an empty object', async () => {
    const shoes = await mockRequest.post('/api/v1/clothes').send({ name: 'shoes', color: 'Black', size: '10' });

    const response = await mockRequest.delete(`/api/v1/clothes/${shoes.body._id}`);
    
    expect(response.status).toEqual(200);
    
    const getResponse = await mockRequest.get(`/api/v1/clothes/${shoes.body._id}`);
    expect(getResponse.body).toEqual(null);
  });
});

describe('V2 ROUTES TESTS:', () => {
  let admin, token;

  beforeAll(async () => {
    admin = await mockRequest.post('/signup').send({ username: 'testAdmin', password: 'password', role: 'admin' });
    token = admin.body.token;
  });

  it('allow a user with bearer token create and add an item on POST/api/v2/:model', async () => {
    const response = await mockRequest.post('/api/v2/clothes').send({ name: 'Shirt', color: 'Blue', size: 'Small' }).auth(token, { type: 'bearer'});

    expect(response.status).toEqual(201);
    expect(response.body._id).toBeDefined();
  });
  
  it('should have GET/api/v2/:model w bearer token return a list of items', async () => {
    const response = await mockRequest.get('/api/v2/clothes').auth(token, { type: 'bearer' });

    expect(response.status).toEqual(200);
    expect(response.body[0].name).toEqual('Shirt');
  });

  it('should have GET/api/v2/:model/ID with bearer token return item by ID', async () => {
    const jacket = await mockRequest.post('/api/v2/clothes').send({ name: 'Jacket', color: 'Red', size: 'Small' }).auth(token, { type: 'bearer' });
    const response = await mockRequest.get(`/api/v2/clothes/${jacket.body._id}`).auth(token, { type: 'bearer' });

    expect(response.body._id).toEqual(jacket.body._id);
  });

  it('should have PUT/api/v2/:model/ID with bearer token return a single, updated item by ID', async () => {
    const pants = await mockRequest.post('/api/v1/clothes').send({ name: 'Pants', color: 'Black', size: 'Small' }).auth(token, { type: 'bearer' });

    const response = await mockRequest.put(`/api/v1/clothes/${pants.body._id}`).send({ name: 'Pants', color: 'Black', size: 'Large'}).auth(token, { type: 'bearer' });

    expect(response.body.size).toEqual('Large');
    expect(response.body._id).toEqual(pants.body._id);
  });

  it('should have DELETE/api/v2/:model/ID with bearer token delete an item', async () => {
    const shoes = await mockRequest.post('/api/v1/clothes').send({ name: 'shoes', color: 'Black', size: '10' }).auth(token, { type: 'bearer' });

    const response = await mockRequest.delete(`/api/v1/clothes/${shoes.body._id}`).auth(token, { type: 'bearer' });
    
    expect(response.status).toEqual(200);
    
    const getResponse = await mockRequest.get(`/api/v1/clothes/${shoes.body._id}`).auth(token, { type: 'bearer' });
    expect(getResponse.body).toEqual(null);
  });

});