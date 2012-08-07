var get = Ember.get, set = Ember.set;

var identity, object, object2, client_id, client_id2;

module("EmberMapper.IdentityMap", {
  setup: function() {
    identity = EmberMapper.IdentityMap.create();
  },

  teardown: function() {
    identity = null;
    object = null;
    client_id = null;
    client_id2 = null;
  }
});

test("stores objects by their ID and gives them a client ID", function() {

  object = Ember.Object.create({id: 1234});

  client_id = identity.store(object);

  ok(!!client_id, "returns a client id");
  equal(object.get("_im_cid"), client_id);

  client_id2 = identity.store(object);
  equal(object.get("_im_cid"), client_id);
  equal(client_id, client_id2, "storing the same object twice shouldn't make a new CID");

});

test("fetches objects", function() {

  object  = Ember.Object.create({id: 1234});
  object2 = Ember.Object.create({id: 2345});

  client_id  = identity.store(object);
  client_id2 = identity.store(object2);

  equal(object,  identity.fetchByID(1234));
  equal(object2, identity.fetchByID(2345));

  equal(object,  identity.fetchByClientID(client_id));
  equal(object2, identity.fetchByClientID(client_id2));

});

test("clears out objects", function() {

  object  = Ember.Object.create({id: 1234});
  object2 = Ember.Object.create({id: 2345});

  client_id  = identity.store(object);
  client_id2 = identity.store(object2);

  identity.clear();

  ok(!identity.fetchByID(1234));
  ok(!identity.fetchByID(2345));
  ok(!identity.fetchByClientID(client_id));
  ok(!identity.fetchByClientID(client_id2));
});