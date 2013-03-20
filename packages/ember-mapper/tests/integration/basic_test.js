var container, App;

module("EmberMapper", {
  setup: function() {
    container = new Ember.Container();
    window.App = App = Ember.Namespace.create({
      toString: function() { return "App"; }
    });
  },

  teardown: function() {
    container = undefined;
    window.App = undefined;
  }
});

test("Mapping to from and back again", function() {

  App.Address = EM.Model.extend({
    street:  EM.Model.attr("string")
  });

  App.Thing = EM.Model.extend({
    name: EM.Model.attr("string")
  });

  App.Foo = EM.Model.extend({
    name: EM.Model.attr("string")
  });

  App.Person = EM.Model.extend({
    name:      EM.Model.attr("string"),
    someValue: EM.Model.attr("string"),
    address:   EM.Model.hasOne(App.Address),
    addresses: EM.Model.hasMany(App.Address),
    things:    EM.Model.hasMany(App.Thing),
    poly:      EM.Model.hasOne("polymorph") // name is ignored for polymorphic currently
  });

  container.register("model:person", App.Person);
  container.register("model:thing", App.Thing);
  container.register("model:foo", App.Foo);
  container.register("model:address", App.Address);

  var person   = App.Person.create({name: "Bob Johnson", someValue: "Thing"});
  var address1 = App.Address.create({street: "1 Acacia Avenue"});
  var address2 = App.Address.create({street: "2 Acacia Avenue"});
  var thing    = App.Thing.create({id: "123", name: "A Thing"});
  var poly     = App.Foo.create({id: "69", name: "Polymorph"});

  // make sure poly's in the identity map
  // TODO - use load or something to warm the cache
  EM.storeFor("foo", container)._identityMap.store(poly);

  person.set("address", address1);
  person.set("addresses", [address1, address2]);
  person.set("things", [thing]);
  person.set("poly", poly);

  App.PersonMapper = EM.Mapper.extend({
    name:    EM.Mapper.attr({key: "fullName"}),
    address: EM.Mapper.hasOne({key: "myAddress"}),
    things:  EM.Mapper.hasMany({embedded: false, sideload: true}),
    poly:    EM.Mapper.hasOne({polymorphic: true, embedded: false})
  });

  container.register("mapper:person", App.PersonMapper);

  var mapper     = EM.mapperFor(App.Person, container);
  var serialized = mapper.serialize(person);

  deepEqual(serialized, {
    full_name: "Bob Johnson",
    some_value: "Thing",
    my_address: {
      street: "1 Acacia Avenue"
    },
    addresses: [
      {street: "1 Acacia Avenue"},
      {street: "2 Acacia Avenue"}
    ],
    thing_ids: ["123"],
    poly_id: "69",
    poly_type: "foo"
  });

  var deserialized = mapper.deserialize(serialized);

  equal(deserialized.get("things.firstObject.name"), undefined, "hasn't yet sideloaded");
  equal(deserialized.get("things.firstObject.id"), "123", "has the ID ready");

  equal(deserialized.get("addresses.firstObject.street"), "1 Acacia Avenue", "has the address");

  equal(deserialized.get("name"), "Bob Johnson", "has the name back");
  equal(deserialized.get("someValue"), "Thing", "has the value back");

  equal(deserialized.get("poly.name"), "Polymorph");
  equal(deserialized.get("poly.id"),   "69");
  equal(deserialized.get("poly") instanceof App.Foo, true);

  mapper.sideload({
    things: [{
      id: "123", name: "Sideloaded Thing"
    }]
  });

  equal(deserialized.get("things.firstObject.name"), "Sideloaded Thing", "re-materializes from sideloading");

});