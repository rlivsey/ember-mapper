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

  App.Person = EM.Model.extend({
    name:      EM.Model.attr("string"),
    someValue: EM.Model.attr("string"),
    address:   EM.Model.hasOne(App.Address),
    addresses: EM.Model.hasMany(App.Address),
    things:    EM.Model.hasMany(App.Thing)
  });

  var person   = App.Person.create({name: "Bob Johnson", someValue: "Thing"});
  var address1 = App.Address.create({street: "1 Acacia Avenue"});
  var address2 = App.Address.create({street: "2 Acacia Avenue"});
  var thing    = App.Thing.create({id: "123", name: "A Thing"});

  person.set("address", address1);
  person.set("addresses", [address1, address2]);
  person.set("things", [thing]);

  App.PersonMapper = EM.Mapper.extend({
    name:    EM.Mapper.attr({key: "fullName"}),
    address: EM.Mapper.hasOne({key: "myAddress"}),
    things:  EM.Mapper.hasMany({embedded: false, sideload: true})
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
    thing_ids: ["123"]
  });

  var deserialized = mapper.deserialize(serialized);

  equal(deserialized.get("things.firstObject.name"), undefined, "hasn't yet sideloaded");
  equal(deserialized.get("things.firstObject.id"), "123", "has the ID ready");

  equal(deserialized.get("addresses.firstObject.street"), "1 Acacia Avenue", "has the address");

  equal(deserialized.get("name"), "Bob Johnson", "has the name back");
  equal(deserialized.get("someValue"), "Thing", "has the value back");

  mapper.sideload({
    things: [{
      id: "123", name: "Sideloaded Thing"
    }]
  });

  equal(deserialized.get("things.firstObject.name"), "Sideloaded Thing", "re-materializes from sideloading");

});