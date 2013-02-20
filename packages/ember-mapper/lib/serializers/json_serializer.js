require("ember-mapper/system/serializer");
require("ember-mapper/transforms/json_transforms");

var get        = Ember.get,
    decamelize = Ember.String.decamelize,
    camelize   = Ember.String.camelize;

EM.JSONSerializer = EM.Serializer.extend({

  plurals: null,

  init: function() {
    this._super();

    if (!get(this, 'transforms')) {
      this.set('transforms', EM.JSONTransforms);
    }
  },

  // inverse of plurals
  singles: Ember.computed(function(){
    var plurals, singles, key;
    plurals = get(this, "plurals");

    if (!plurals) { return; }

    singles = {};
    for (key in plurals) {
      singles[plurals[key]] = key;
    }

    return singles;
  }),

  extractItem: function(json, type) {
    var root = this.rootForType(type);
    return json[root];
  },

  extractItems: function(json, type) {
    var root = this.rootForType(type);
    return json[this.pluralize(root)];
  },

  keyForAttributeName: function(type, name) {
    return decamelize(name);
  },

  attributeNameForMetaKey: function(name) {
    return camelize(name);
  },

  keyForHasOne: function(type, name) {
    return decamelize(name) + "_id";
  },

  typeKeyForPolymorphicHasOne: function(type, name) {
    return decamelize(name) + "_type";
  },

  valueForPolymorphicType: function(type, name) {
    return this.rootForType(type.constructor);
  },

  keyForHasMany: function(type, name) {
    return decamelize(this.singularize(name)) + "_ids";
  },

  keyForHasOneEmbedded: function(type, name) {
    return decamelize(name);
  },

  keyForHasManyEmbedded: function(type, name) {
    return decamelize(name);
  },

  // TODO look at configuration map from ember-data for this
  pluralize: function(name) {
    var plurals = this.get("plurals");
    return (plurals && plurals[name]) || name + "s";
  },

  singularize: function(name) {
    var singles = this.get("singles");
    return (singles && singles[name]) || name.replace(/s$/, '');
  },

  rootForType: function(type) {
    var typeString = type.toString();

    Ember.assert("Your model must not be anonymous. It was " + type, typeString.charAt(0) !== '(');

    // use the last part of the name as the URL
    var parts = typeString.split(".");
    var name = parts[parts.length - 1];
    return name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1);
  }

});