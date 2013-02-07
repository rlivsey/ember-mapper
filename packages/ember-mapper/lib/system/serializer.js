function mustImplement(name) {
  return function() {
    throw new Ember.Error("Your serializer " + this.toString() + " does not implement the required method " + name);
  };
}

var get = Ember.get;

EM.Serializer = Ember.Object.extend({

  primaryKeyField: "id",
  metaField: "meta",

  extract: mustImplement("extract"),
  extractMany: mustImplement("extractMany"),

  extractMeta: function(data) {
    return data[get(this, 'metaField')];
  },

  extractSideload: function(data, name) {
    return data[name];
  },

  keyForPrimaryKey: function(type) {
    return get(this, "primaryKeyField");
  },

  keyForAttributeName: function(type, name) {
    return name;
  },

  attributeNameForMetaKey: function(name) {
    return name;
  },

  keyForHasOne: function(type, name) {
    return name;
  },

  keyForHasMany: function(type, name) {
    return name;
  },

  keyForHasOneEmbedded: function(type, name) {
    return name;
  },

  keyForMasManyEmbedded:  function(type, name) {
    return name;
  },

  serializeValue: function(value, attributeType) {
    var transform = this.transforms ? this.transforms[attributeType] : null;

    Ember.assert("You tried to use an attribute type (" + attributeType + ") that has not been registered", transform);
    return transform.serialize(value);
  },

  deserializeValue: function(value, attributeType) {
    var transform = this.transforms ? this.transforms[attributeType] : null;

    Ember.assert("You tried to use a attribute type (" + attributeType + ") that has not been registered", transform);
    return transform.deserialize(value);
  }

});