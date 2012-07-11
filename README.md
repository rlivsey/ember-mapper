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

## Custom Attributes

An attribute is simply something with a `from` and a `to` method.

* `from` takes JSON and turns it into an object.
* `to` takes an object and turns it into JSON.

How it does that is up to you.

Any attribute on `EmberMapper.Schema.attributes` is available to be used for serializing / deserializing.

    EmberMapper.Schema.attributes.timestamp = {
      from: (serialized) -> new Date(serialized * 1000)
      to: (deserialized) -> deserialized.getTime() / 1000
    }

## JSON Key Naming Conventions

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

TODO ...


## Validating

TODO ...
