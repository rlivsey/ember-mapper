var get = Ember.get, set = Ember.set, getPath = Ember.getPath;

EmberMapper.Schema = Ember.Object.extend({

  modelClass: null,
  mappings: null,
  fromMappings: null,
  toMappings: null,

  init: function(){
    var map = this.get("identityMap");
    if (map === undefined) {
      this.set("identityMap", EmberMapper.IdentityMap.create());
    } else if (!map) {
      this.set("identityMap", EmberMapper.NullIdentityMap.create());
    }
  },

  propertyNameToKey: function(key) {
    return Ember.String.underscore(key);
  },

  allToMappings: Ember.computed(function(){
    return Ember.$.extend({}, this.get("mappings") || {}, this.get("toMappings") || {});
  }).property().cacheable(),

  allFromMappings: Ember.computed(function(){
    return Ember.$.extend({}, this.get("mappings") || {}, this.get("fromMappings") || {});
  }).property().cacheable(),

  to: function(object) {
    var mappings = this.get("allToMappings"),
        json = {},
        mapping, key;

    for (var prop in mappings) {
      if (mappings.hasOwnProperty(prop)) {
        mapping = mappings[prop];

        if (typeof mapping === 'string') {
          mapping = EmberMapper.Schema.attr(mapping);
        }

        key = this.propertyNameToKey(prop);
        json[key] = mapping.to(object.get(prop));
      }
    }

    return json;
  },

  /*
    Override this and do something else if you want STI or something

          modelClassForJSON: function(json) {
            if (json.type == "car") {
              return App.Car;
            } else {
              return App.Bus;
            }
          }
  */
  modelClassForJSON: function(json) {
    var modelClass = this.get("modelClass");
    Ember.assert("No model class specified", !!modelClass);

    if (typeof modelClass === 'string') {
      modelClass = getPath(window, modelClass);
      Ember.assert("Model class not found", !!modelClass);
    }
    return modelClass;
  },

  from: function(json, object) {
    var mappings = this.get("allFromMappings"),
        props = {},
        mapping,
        key;

    if (object === undefined) {
      if (json.id) {
        object = this.get("identityMap").fetchByID(json.id);
      }

      if (!object) {
        object = this.modelClassForJSON(json).create();
      }
    }

    // always deserialize the ID if there's not an explicit mapping
    if (!mappings.id && json.id) {
      props["id"] = json.id;
    }

    for (var prop in mappings) {
      if (mappings.hasOwnProperty(prop)) {
        mapping = mappings[prop];

        if (typeof mapping === 'string') {
          mapping = EmberMapper.Schema.attr(mapping);
        }

        key = this.propertyNameToKey(prop);
        if (json.hasOwnProperty(key)) {
          props[prop] = mapping.from(json[key]);
        }
      }
    }

    object.setProperties(props);

    this.get("identityMap").store(object);

    return object;
  }

});

EmberMapper.Schema.attr = function(type) {
  var transform = EmberMapper.Schema.transforms[type];
  Ember.assert("Could not find schema transform of type " + type, !!transform);
  return transform;
};

EmberMapper.Schema.many = function(schema) {
  return {
    from: function(serialized) {
      if (!serialized) {
        return;
      }

      if (typeof schema === "string") {
        schema = getPath(window, schema);
      }

      var records = [];
      for (var i=0, l=get(serialized, 'length'); i<l; i++) {
        records.push(schema.from(serialized[i]));
      }
      return records;
    },

    to: function(deserialized) {
      if (!serialized) {
        return;
      }

      if (typeof schema === "string") {
        schema = getPath(window, schema);
      }

      var items = [];
      for (var i=0, l=get(deserialized, 'length'); i<l; i++) {
        records.push(schema.to(deserialized[i]));
      }
      return items;
    }
  }
};

EmberMapper.Schema.one = function(schema) {
  return {
    from: function (serialized) {
      if (typeof schema === "string") {
        schema = getPath(window, schema);
      };
      schema.from(serialized);
    },
    to: function (deserialized) {
      if (typeof schema === "string") {
        schema = getPath(window, schema);
      };
      schema.to(deserialized);
    }
  }
}

// stolen from Ember Data

EmberMapper.Schema.transforms = {
  string: {
    from: function(serialized) {
      return Ember.none(serialized) ? null : String(serialized);
    },

    to: function(deserialized) {
      return Ember.none(deserialized) ? null : String(deserialized);
    }
  },

  number: {
    from: function(serialized) {
      return Ember.none(serialized) ? null : Number(serialized);
    },

    to: function(deserialized) {
      return Ember.none(deserialized) ? null : Number(deserialized);
    }
  },

  'boolean': {
    from: function(serialized) {
      return Boolean(serialized);
    },

    to: function(deserialized) {
      return Boolean(deserialized);
    }
  },

  date: {
    from: function(serialized) {
      var type = typeof serialized;

      if (type === "string" || type === "number") {
        return new Date(serialized);
      } else if (serialized === null || serialized === undefined) {
        // if the value is not present in the data,
        // return undefined, not null.
        return serialized;
      } else {
        return null;
      }
    },

    to: function(date) {
      if (date instanceof Date) {
        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        var pad = function(num) {
          return num < 10 ? "0"+num : ""+num;
        };

        var utcYear = date.getUTCFullYear(),
            utcMonth = date.getUTCMonth(),
            utcDayOfMonth = date.getUTCDate(),
            utcDay = date.getUTCDay(),
            utcHours = date.getUTCHours(),
            utcMinutes = date.getUTCMinutes(),
            utcSeconds = date.getUTCSeconds();


        var dayOfWeek = days[utcDay];
        var dayOfMonth = pad(utcDayOfMonth);
        var month = months[utcMonth];

        return dayOfWeek + ", " + dayOfMonth + " " + month + " " + utcYear + " " +
               pad(utcHours) + ":" + pad(utcMinutes) + ":" + pad(utcSeconds) + " GMT";
      } else if (date === undefined) {
        return undefined;
      } else {
        return null;
      }
    }
  }
};