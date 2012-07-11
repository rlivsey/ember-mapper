var get = Ember.get, set = Ember.set, getPath = Ember.getPath;

var personSchema, person, Person, Address, addressSchema;

module("EmberMapper.Schema to JSON", {
  setup: function() {
    Person = Ember.Object.extend({});
    Address = Ember.Object.extend({});

    person = Person.create({
      firstName: "Bob",
      lastName: "Hoskins",
      age: 50,
      foo: "bar",
      address: Address.create({
        street: "22 Acacia Avenue",
        country: "England"
      })
    });

    addressSchema = EmberMapper.Schema.create({
      mappings: {
        street: "string",
        country: "string"
      }
    });

    personSchema = EmberMapper.Schema.create({
      mappings: {
        firstName: EmberMapper.Schema.attr("string"),
        lastName: EmberMapper.Schema.attr("string"),
        address: addressSchema
      },

      toMappings: {
        age: EmberMapper.Schema.attr("number")
      },

      fromMappings: {
        foo: EmberMapper.Schema.attr("string")
      }
    });
  },

  teardown: function() {
    personSchema = null;
    addressSchema = null;
    person = null;
    Address = null;
    Person = null;
  }
});

test("converts nested model to JSON with default mappings and to mappings", function() {

  deepEqual(personSchema.to(person), {
    first_name: "Bob",
    last_name: "Hoskins",
    age: 50,
    address: {
      street: "22 Acacia Avenue",
      country: "England"
    }
  });

});

var json, Member, member;

module("EmberMapper.Schema from JSON", {
  setup: function() {
    json = {
      id: "12345",
      first_name: "Bob",
      last_name: "Hoskins",
      age: 50,
      foo: "bar",
      address: {
        street: "22 Acacia Avenue",
        country: "England"
      }
    };

    Person = Ember.Object.extend({});
    Address = Ember.Object.extend({});

    addressSchema = EmberMapper.Schema.create({
      modelClass: Address,
      mappings: {
        street: "string",
        country: "string"
      }
    });

    personSchema = EmberMapper.Schema.create({
      modelClass: Person,
      mappings: {
        firstName: EmberMapper.Schema.attr("string"),
        lastName: EmberMapper.Schema.attr("string"),
        address: addressSchema
      },

      toMappings: {
        age: EmberMapper.Schema.attr("number")
      },

      fromMappings: {
        foo: EmberMapper.Schema.attr("string")
      }
    });
  },

  teardown: function() {
    personSchema = null;
    addressSchema = null;
    Address = null;
    Person = null;
    Member = null;
    member = null;
    person = null;
    json = null;
  }
});


test("converts nested JSON into models", function() {
  person = personSchema.from(json);

  equal(get(person, "id"), "12345", "should automatically deserialize ID");
  equal(get(person, "firstName"), "Bob");
  equal(get(person, "lastName"),  "Hoskins");
  equal(get(person, "foo"),  "bar", "should use 'from' mappings");
  equal(get(person, "age"), undefined, "shouldn't deserialize 'to' mappings");
  equal(getPath(person, "address.street"), "22 Acacia Avenue");
  equal(getPath(person, "address.country"), "England");
});

test("updates properties on existing model", function() {
  person = Person.create({firstName: "Dave", lastName: "Dobson"});

  personSchema.from(json, person);

  equal(get(person, "id"), "12345", "should automatically deserialize ID");
  equal(get(person, "firstName"), "Bob");
  equal(get(person, "lastName"),  "Hoskins");
  equal(get(person, "foo"),  "bar", "should use 'from' mappings");
  equal(get(person, "age"), undefined, "shouldn't deserialize 'to' mappings");
  equal(getPath(person, "address.street"), "22 Acacia Avenue");
  equal(getPath(person, "address.country"), "England");
});

test("custom modelClass", function(){

  Member = Ember.Object.extend();

  personSchema.reopen({
    modelClassForJSON: function(json) {
      if (json.type === "member") {
        return Member;
      } else {
        return Person;
      }
    }
  });

  person = personSchema.from({
    first_name: "Person",
    type: "normal"
  });

  member = personSchema.from({
    first_name: "Person",
    type: "member"
  });

  ok(person instanceof Person, "should be a Person");
  ok(member instanceof Member, "should be a Member");
});


var identity;

module("EmberMapper.Schema from JSON with identity map", {
  setup: function() {
    json = {
      id: "12345",
      first_name: "Bob",
      last_name: "Hoskins"
    };

    Person = Ember.Object.extend({});
  },

  teardown: function() {
    personSchema = null;
    identity = null;
    Person = null;
    json = null;
    person = null;
  }
});


test("updates the identity map", function(){
  expect(2);

  identity = {
    fetchByID: function(id) {
      equal(id, "12345");
    },
    store: function(item){
      equal(item.get("id"), "12345");
    }
  };

  personSchema = EmberMapper.Schema.create({
    modelClass: Person,
    identityMap: identity,
    mappings: {
      firstName: EmberMapper.Schema.attr("string"),
      lastName: EmberMapper.Schema.attr("string")
    }
  });

  personSchema.from(json);

});
