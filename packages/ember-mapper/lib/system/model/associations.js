var get     = Ember.get,
    isArray = Ember.isArray;

require("ember-mapper/system/model/model");

EM.Model.reopenClass({
  associations: Ember.computed(function() {
    var map = Ember.Map.create();

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAssociation) {
        meta.name = name;
        map.set(name, meta);
      }
    });

    return map;
  })
});

EM.Model.reopen({
  eachAssociation: function(callback, binding) {
    get(this.constructor, 'associations').forEach(function(name, meta) {
      callback.call(binding, name, meta);
    }, binding);
  },

  associations: function() {
    var keys = [];
    get(this.constructor, 'associations').forEach(function(key, value) {
      keys.push(key);
    });
    return this.getProperties(keys);
  }
});

EM.Model.hasOne = function(type, options) {
  options = options || {};

  var meta = {
    type: type,
    isAssociation: true,
    isOneAssociation: true,
    options: options
  };

  return Ember.computed(function(key, value, oldValue) {
    if (arguments.length > 1) {
      if (!(value instanceof Ember.Object) && value) {
        value = type.create(value);
      }
    }
    return value;
  }).property().meta(meta);
};

EM.Model.hasMany = function(type, options) {
  options = options || {};

  var meta = {
    type: type,
    isAssociation: true,
    isManyAssociation: true,
    options: options
  };

  return Ember.computed(function(key, value, oldValue) {
    if (arguments.length > 1) {
      // if we've got an array with hash values (or at least the first isn't an object...)
      if (isArray(value) && value.length > 0 && !(value[0] instanceof Ember.Object)) {
        for (var i=0; i<value.length; i++) {
          value[i] = type.create(value[i]);
        }
      }
    }
    return value;
  }).property().meta(meta);
};