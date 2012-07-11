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

* Ajax, you know, the main point of the plugin...
* Validation
* Lifecycle states
* Lazy RecordArray like Ember Data
* Use a state machine for lifecycles instead of properties
* Non-embedded associations

## Models

Your models are 'plain old ember objects', they don't know anything about the
data store and don't need to inherit / include anything.

    App.Person = Ember.Object.extend()

In order for the identity map to work, it needs to set a property `_im_cid` on
your model instances, but that's all.

If you want some lifecycle states on your model, then you can include EmberMapper.LifecycleStates

    App.Person = Ember.Object.extend(EmberMapper.LifecycleStates)

This gives you:

    * isSaving
    * isLoading
    * isUpdating
    * isCreating
    * isDestroyed

## Schema

A schema uses serializers to convert a model to / from JSON.

They are identity map aware so deserializing will update the identity map for the schema.

    App.PersonSchema = EmberMapper.Schema.extend({
      modelClass: "App.Person",

      mappings: {
        firstName: EmberMapper.Schema.attr("string"),
        lastName: "string", // or just the attr name
        createdAt: "timestamp",
        account: App.AccountSchema // map to another schema for embedded documents
      },

      // you can include one-way mappings from the JSON
      fromMappings: {
        numProjects: EmberMapper.Schema.attr("number")
      },

      // and to JSON
      toMappings: {
        sendInvite: EmberMapper.Schema.attr("boolean")
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

### Custom Attributes

An attribute is simply something with a `from` and a `to` method.

* `from` takes JSON and turns it into an object.
* `to` takes an object and turns it into JSON.

How it does that is up to you.

Any attribute on `EmberMapper.Schema.attributes` is available to be used for serializing / deserializing.

    EmberMapper.Schema.attributes.timestamp = {
      from: (serialized) -> new Date(serialized * 1000)
      to: (deserialized) -> deserialized.getTime() / 1000
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
        // ...
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

    peopleStore.findQuery({
      named: "bob"
    })

You're encouraged to write your own custom finders. Instead of your code being littered with:

    peopleStore.findQuery({
      project_id: App.getPath("current.project.id")
    })

You can have:

    peopleStore.inProject(App.getPath("current.project"))
    peopleStore.named("bob")
    etc...

Simply add your own finder which calls the built in ones:

    EmberMapper.Store.create({
      named: function(name) {
        return this.findQuery({
          name: "bob"
        });
      }
    })

Or if you need to do sideloading or any other custom stuff, feel free!
The xxxRequest methods return a jQuery deferred ajax object, so you can add your own callbacks.

    EmberMapper.Store.create({
      paginated: function(page) {
        var records = this.makeRecordArray();

        var ajax = this.findQueryRequest(records, { page: page });

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
      findQueryRequest: function(records, query) {
        var ajax = this._super(records, query);
        ajax.error(function(){
          // do stuff on error
        });
        return ajax;
      }
    });

## Validations

TODO ...
