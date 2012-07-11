# EmberMapper

A complex solution to a simple problem.

## Why not Ember Data

Ember Data is more than likely fine for your purposes, you probably don't want
to use this.

At the time of writing Ember Data didn't match my needs. It probably will do in future, but I'm impatient.

I wanted a bit more control over the URLs used and how the data is serialized/deserialized,
I needed composed objects, setting properties without marking the object as dirty etc...

This doesn't handle dirty tracking and many of the other nice things you get with Ember Data,
it assumes you know what you want to save and when.

It basically just provides serializing to / from JSON with an identity map and leaves most of the rest to you.

## TODO

* Tests for stores
* Validation
* Non-embedded associations (foreign key support, haven't needed it yet myself)
* Use state machines for lifecycles instead of properties

## Quick Overview

    App.Person = Ember.Object.extend({})

    App.personSchema = EmberMapper.Schema.create({
      modelClass: App.Person
      mappings: {
        firstName: "string",
        lastName: "string"
      }
    })

    App.peopleStore = EmberMapper.Store.create({
      schema: App.PersonSchema
    })

    people = App.peopleStore.findMany({name: "Bob"})

    person = App.peopleStore.find(123)
    person.set("firstName", "Terry")

    App.peopleStore.updateRecord(person)

## Models

Your models are 'plain old ember objects', they don't know anything about the
data store and don't need to inherit / include anything.

    App.Person = Ember.Object.extend()

In order for the identity map to work, it needs to set a property `_im_cid` on
your model instances.

When saving / loading etc... it will set some flags on your model:

    * isLoading
    * isSaving
    * isUpdating
    * isCreating
    * isDeleting
    * isDeleted

## Schema

A schema uses serializers to convert a model to / from JSON.

They are identity map aware so deserializing will update the identity map for the schema.

    App.PersonSchema = EmberMapper.Schema.extend({
      modelClass: "App.Person",

      mappings: {
        firstName: EmberMapper.Schema.attr("string"),         // use the string type
        lastName: "string",                                   // or to save typing, just the name
        account: EmberMapper.Schema.one("App.AccountSchema"), // map to another schema for embedded documents
        tasks: EmberMapper.Schema.many("App.TaskSchema")      // or arrays of embedded documents
      },

      // you can include one-way mappings from the JSON
      // which is handy for counts etc... which you don't want to save back
      fromMappings: {
        numProjects: EmberMapper.Schema.attr("number"), // this won't be serialized to JSON
        createdAt: "timestamp"
      },

      // and to JSON in occasions where you want to send something extra
      toMappings: {
        sendInvite: EmberMapper.Schema.attr("boolean") // this won't get deserialized from JSON
      }
    })

### Model Class

Most of the time your schema is for one specific model type.

Sometimes you might want to implement polymorphism / STI where you create different kinds of models
based on the JSON which is returned.

Simply override `modelClassForJSON` to do your bidding.

    modelClassForJSON: function(json) {
      if (json.type == "car") {
        return App.Car;
      } else {
        return App.Bus;
      }
    }

### Custom Attribute Serializing

An attribute is simply something with a `from` and a `to` method.

* `from` takes JSON and turns it into an object.
* `to` takes an object and turns it into JSON.

How it does that is up to you.

Any attribute on `EmberMapper.Schema.transforms` is available to be used for serializing / deserializing.

    EmberMapper.Schema.transforms.timestamp = {
      from: function (serialized) { return new Date(serialized * 1000); },
      to: function (deserialized) { return deserialized.getTime() / 1000; }
    }

### JSON Key Naming Conventions

The default naming convention is to camelcase your JSON keys

    first_name -> firstName

You can override this on a Schema by overriding `propertyToKeyName`

    propertyNameToKey: function(key) {
      return Ember.String.underscore(key);
    }

If you want to change it for all Schemas, reopen `EmberMapper.Schema`

    EmberMapper.Schema.reopen({
      propertyNameToKey: function(key) {
        return key.toUpperCase();
      }
    })

## Stores

A Store takes a Schema and loads/saves it to the intertubes.

    peopleStore = EmberMapper.Store.create({
      schema: peopleSchema
    })

Requests return immediately and are loaded when data arrives.

This returns a Person right away with its ID set to 123, it will have `isLoading` set to true.

    peopleStore.find(123)

This returns a RecordArray with a content of `[]`, again `isLoading` will be true until data arrives.

    peopleStore.findMany({
      named: "bob"
    })


### URLs

You should set a base URL for the store:

    EmberMapper.Store.create({
      url: "/api/v1/people"
    })

This is then built on for all requests, for example `updateRecord` will use the url with the record ID appended.

If you want to customize a specific URL, override it and do what you like:

    EmberMapper.Store.create({
      deleteRecordUrl: function(record) {
        return this.get("url") + "/deletification/" + record.get("id");
      }
    })

The `url` can be a computed property, so you make it bind to something else in your app:

    EmberMapper.Store.create({
      currentProjectBinding: "App.current.project",

      url: function(){
        var projectId = this.getPath("currentProject.id");
        return "/projects/"+projectId;
      }.property("currentProject")
    })

### Custom Requests

You're encouraged to write your own custom requests. Instead of your code being littered with:

    peopleStore.findMany({
      project_id: App.getPath("current.project.id")
    })

You can have:

    peopleStore.inProject(App.getPath("current.project"))
    peopleStore.named("bob")
    etc...

Simply add your own finder which calls the built in ones:

    EmberMapper.Store.create({
      named: function(name) {
        return this.findMany({
          name: "bob"
        });
      }
    })

Or if you need to do sideloading or any other custom stuff, feel free!
The xxxRequest methods return a jQuery deferred ajax object, so you can add your own callbacks.

Just look at findMany / updateRecord / etc... to write your own:

    EmberMapper.Store.create({
      paginated: function(page) {
        var records = EmberMapper.RecordArray.create();

        // same as usual findMany, but with your own parameters
        var ajax = this.findManyRequest(this.findManyUrl(), records, {
          data: { page: page }
        });

        // add your own callback and do more stuff when the request completes
        ajax.done(function(data){
          records.set("pagination", {
            perPage: data.per_page
          });
        });

        return records;
      }
    });

If you want to do something to every request then you can override `ajax` or one of
the `xxxRequest` methods:

    EmberMapper.Store.create({
      findManyRequest: function(url, records, hash) {
        var ajax = this._super(url, records, hash);
        ajax.error(function(){
          // do stuff on error
        });
        return ajax;
      }
    });
