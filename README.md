# EmberMapper

WORK IN PROGRESS...

It's what you'd get if you took Ember-Data and shook it about until bits fell off.

Inspired by Ember-Data in a nubmer of ways, in fact we steal quite a bit of code... but
without dirty tracking, transactions or advanced association tracking.

## Usage

    var attr = EM.Model.attr;

    App.Person = EM.Model.extend({
      firstName: attr("string"),
      lastName: attr("string"),
      joinedAt: attr("date"),
      isAdmin: attr("boolean")
    })

    // in a router action // controller

    person = this.storeFor("person").find(123)

    person.set("firstName", "updated")

    this.storeFor("person").save(person)

### Models

    // saves us some typing
    var attr    = EM.Model.attr,
        hasOne  = EM.Model.hasOne,
        hasMany = EM.Model.hasMany;

    App.Person = EM.Model.extend({
      firstName: attr("string"),
      lastName:  attr("string"),
      address:   hasOne("App.Address"),
      articles:  hasMany("App.Article")
    })

### Mappers

By default serializing a model takes all its attributes and assumes all associations
are embedded. To change this, define a mapper for your model.

    // again, save some typing - note this is EM.Mapper not EM.Model
    var attr    = EM.Mapper.attr,
        hasOne  = EM.Mapper.hasOne,
        hasMany = EM.Mapper.hasMany;

    App.PersonMapper = EM.Mapper.extend({
      firstName: EM.Mapper.attr({key: "firstname"}),
      address:   EM.Mapper.hasOne({embedded: false, key: "addressId"}),
      articles:  EM.Mapper.hasMany({embedded: false, key: "publishedArticles", sideload: true})
    })

The mapper's job is to take a model and turn it into a hash which can be sent to the
adapter to be persisted - and vice-versa.

### Serializer

Once the mapper has had its way and we have a data hash, the adapter can then serialize
that into a form the data store is happy with.

For example, the mapper might turn a Person object into:

    {
      id: 1234,
      firstName: "Bob",
      lastName: "Johnson"
    }

The default serializer (JSONSerializer) will then turn this into:

    {
      person: {
        id: 1234,
        first_name: "Bob",
        last_name: "Johnson"
      }
    }

### Adapters

The adapter's job is to send and receive data over the wire. The default adapter is the
RESTAdapter and handles submitting Ajax requests with jQuery.Ajax.

### Identity Map

Each store has an identity map which should guarantee that fetching two records with the
same ID will result in the same object.

    person1 = store.find(123)
    person2 = store.find(123)
    people = store.find()

    person2.get("firstName") -> "Bob"
    person1.set("firstName", "changed")
    person2.get("firstName") -> "changed"

    // assuming the first one was the same person
    people.get("firstObject.firstName") -> "changed"

### Stores

The store wires all this stuff together