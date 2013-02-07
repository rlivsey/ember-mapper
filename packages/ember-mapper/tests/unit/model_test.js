var get = Ember.get, set = Ember.set;

var Person, array;

module("EM.Model", {
  setup: function() {
    Person = EM.Model.extend({
      name: EM.Model.attr('string')
    });
  },

  teardown: function() {
    Person = null;
  }
});

test("can have a property set on it", function() {
  var record = Person.create();
  set(record, 'name', 'bar');

  equal(get(record, 'name'), 'bar', "property was set on the record");
});

test("a record reports its unique id via the `id` property", function() {
  var record = Person.create({id: 1});
  equal(get(record, 'id'), 1, "reports id as id by default");
});

test("a record's id is included in its toString represenation", function() {
  var record = Person.create({id: 1});
  equal(record.toString(), '<(subclass of EM.Model):'+Ember.guidFor(record)+':1>', "reports id in toString");
});

test("trying to set an `id` attribute should raise", function() {
  Person = EM.Model.extend({
    id: EM.Model.attr('number'),
    name: "Scumdale"
  });

  raises(function() {
    var person = Person.create({id: 1});
    person.get('name');
  }, /You may not set `id`/);
});

test("can have its attributes fetched", function() {
  Person = EM.Model.extend({
    name: EM.Model.attr('string'),
    thing: EM.Model.attr('string'),
    other: EM.Model.attr('string')
  });

  var person = Person.create({name: "Bob", thing: "something", other: "something else"});
  var attrs = person.attributes();

  deepEqual(attrs, {name: "Bob", thing: "something", other: "something else"});
});

test("attributes honor default values", function() {
  Person = EM.Model.extend({
    name: EM.Model.attr('string', {defaultValue: "Ted"})
  });

  var person = Person.create();
  var attrs = person.attributes();

  deepEqual(attrs, {name: "Ted"});
});

module("EM.Model updating", {
  setup: function() {
    Person = EM.Model.extend({
      name: EM.Model.attr('string')
    });

  },
  teardown: function() {
    Person = null;
  }
});

test("a EM.Model can update its attributes", function() {
  var person = Person.create({name: "Bob Johnson"});

  set(person, 'name', "Brohuda Katz");
  equal(get(person, 'name'), "Brohuda Katz", "setting took hold");
});

test("a EM.Model can have a defaultValue", function() {
  var Tag = EM.Model.extend({
    name: EM.Model.attr('string', { defaultValue: "unknown" })
  });

  var tag = Tag.create();

  equal(get(tag, 'name'), "unknown", "the default value is found");

  set(tag, 'name', null);

  equal(get(tag, 'name'), null, "null doesn't shadow defaultValue");
});

module("EM.Model events", {
  setup: function() {
    Person = EM.Model.extend({
      name: EM.Model.attr('string')
    });

  },
  teardown: function() {
    Person = null;
  }
});

test("a listener can be added to a record", function() {
  var count = 0;
  var F = function() { count++; };
  var record = Person.create();

  record.on('event!', F);
  record.trigger('event!');

  equal(count, 1, "the event was triggered");

  record.trigger('event!');

  equal(count, 2, "the event was triggered");
});

test("when an event is triggered on a record the method with the same name is invoked with arguments", function(){
  var count = 0;
  var F = function() { count++; };
  var record = Person.create();

  record.eventNamedMethod = F;

  record.trigger('eventNamedMethod');

  equal(count, 1, "the corresponding method was called");
});

test("when a method is invoked from an event with the same name the arguments are passed through", function(){
  var eventMethodArgs = null;
  var F = function() { eventMethodArgs = arguments; };
  var record = Person.create();

  record.eventThatTriggersMethod = F;

  record.trigger('eventThatTriggersMethod', 1, 2);

  equal( eventMethodArgs[0], 1);
  equal( eventMethodArgs[1], 2);
});


var Address;
module("EM.Model associations", {
  setup: function() {
    Address = EM.Model.extend({
      street:  EM.Model.attr("string"),
      city:    EM.Model.attr("string"),
      country: EM.Model.attr("string")
    });

    Person = EM.Model.extend({
      name:    EM.Model.attr("string"),
      address: EM.Model.hasOne(Address),
      addresses: EM.Model.hasMany(Address)
    });
  },

  teardown: function() {
    Person  = null;
    Address = null;
  }
});

test("can be built up from a hash", function() {
  var person = Person.create({
    name: "Bob",
    address: {
      street: "33 Acacia Avenue",
      city: "London",
      country: "England"
    },
    addresses: [
      {
        street: "11 Acacia Avenue",
        city: "London",
        country: "England"
      },
      {
        street: "12 Acacia Avenue",
        city: "London",
        country: "England"
      }
    ]
  });

  equal(person.get("name"), "Bob");

  var address = person.get("address");

  equal(address instanceof Address, true, "Creates an Address");
  equal(address.get("street"),  "33 Acacia Avenue");
  equal(address.get("city"),    "London");
  equal(address.get("country"), "England");

  var addresses = person.get("addresses");
  equal(addresses.length, 2, "has 2 addresses");

  address = addresses[0];
  equal(address.get("street"),  "11 Acacia Avenue");
  equal(address.get("city"),    "London");
  equal(address.get("country"), "England");
});

test("can have its associations fetched", function() {
  var person = Person.create();

  var address1 = Address.create({street: "1 Acacia Avenue"});
  var address2 = Address.create({street: "2 Acacia Avenue"});

  person.set("address", address1);
  person.set("addresses", [address1, address2]);

  var associations = person.associations();

  deepEqual(associations, {
    address: address1,
    addresses: [ address1, address2 ]
  });
});

module("EM.Model lifecycle", {
  setup: function() {
    Person = EM.Model.extend({
      name: EM.Model.attr('string')
    });
  },

  teardown: function() {
    Person = null;
  }
});

test("it starts of as isLoaded true by default", function() {
  var person = Person.create();
  equal(person.get("isLoaded"), true);
});


test("loading lifecycle", function() {
  var person = Person.create();

  person.trigger("isLoading");
  equal(person.get("isLoaded"), false);
  equal(person.get("isLoading"), true);

  person.trigger("didLoad");
  equal(person.get("isLoaded"), true);
  equal(person.get("isLoading"), false);
});


test("successful creation lifecycle", function() {
  var person = Person.create();

  person.trigger("isCreating");
  equal(person.get("isSaving"), true);
  equal(person.get("isCreating"), true);
  equal(person.get("isError"), false);

  person.trigger("didCreate");
  equal(person.get("isSaving"), false);
  equal(person.get("isCreating"), false);
  equal(person.get("isError"), false);
});

test("errored creation lifecycle", function() {
  var person = Person.create();

  person.trigger("isCreating");
  equal(person.get("isSaving"), true);
  equal(person.get("isCreating"), true);
  equal(person.get("isError"), false);

  person.trigger("didError");
  equal(person.get("isSaving"), false);
  equal(person.get("isCreating"), false);
  equal(person.get("isError"), true);
});


test("successful updating lifecycle", function() {
  var person = Person.create();

  person.trigger("isUpdating");
  equal(person.get("isSaving"), true);
  equal(person.get("isUpdating"), true);
  equal(person.get("isError"), false);

  person.trigger("didUpdate");
  equal(person.get("isSaving"), false);
  equal(person.get("isUpdating"), false);
  equal(person.get("isError"), false);
});

test("errored updating lifecycle", function() {
  var person = Person.create();

  person.trigger("isUpdating");
  equal(person.get("isSaving"), true);
  equal(person.get("isUpdating"), true);
  equal(person.get("isError"), false);

  person.trigger("didError");
  equal(person.get("isSaving"), false);
  equal(person.get("isUpdating"), false);
  equal(person.get("isError"), true);
});


test("successful deleting lifecycle", function() {
  var person = Person.create();

  person.trigger("isDeleting");
  equal(person.get("isSaving"), true);
  equal(person.get("isDeleting"), true);
  equal(person.get("isError"), false);

  person.trigger("didDelete");
  equal(person.get("isSaving"), false);
  equal(person.get("isDeleting"), false);
  equal(person.get("isError"), false);
});

test("errored deleting lifecycle", function() {
  var person = Person.create();

  person.trigger("isDeleting");
  equal(person.get("isSaving"), true);
  equal(person.get("isDeleting"), true);
  equal(person.get("isError"), false);

  person.trigger("didError");
  equal(person.get("isSaving"), false);
  equal(person.get("isDeleting"), false);
  equal(person.get("isError"), true);
});
