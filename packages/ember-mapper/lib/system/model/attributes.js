var get = Ember.get;

require("ember-mapper/system/model/model");

EM.Model.reopenClass({
  attributes: Ember.computed(function() {
    var map = Ember.Map.create();

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAttribute) {
        Ember.assert("You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: EM.attr('<type>')` from " + this.toString(), name !== 'id');

        meta.name = name;
        map.set(name, meta);
      }
    });

    return map;
  })
});

EM.Model.reopen({
  eachAttribute: function(callback, binding) {
    get(this.constructor, 'attributes').forEach(function(name, meta) {
      callback.call(binding, name, meta);
    }, binding);
  },

  attributes: function() {
    var keys = [];
    get(this.constructor, 'attributes').forEach(function(key, value) {
      keys.push(key);
    });
    return this.getProperties(keys);
  }
});

EM.Model.attr = function(type, options) {
  options = options || {};

  var meta = {
    type: type,
    isAttribute: true,
    options: options
  };

  return Ember.computed(function(key, value, oldValue) {
    var data;

    if (arguments.length > 1) {
      Ember.assert("You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: EM.attr('<type>')` from " + this.constructor.toString(), key !== 'id');
    }

    if (value === undefined) {
      value = options.defaultValue;
    }

    return value;
  }).property().meta(meta);
};

