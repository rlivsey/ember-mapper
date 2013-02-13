require("ember-mapper/system/model");
require("ember-mapper/serializers/json_serializer");

// TODO - the mappers are tied in with everything a bit too much

var get = Ember.get,
    set = Ember.set;

var keyFromConfig = function(config, name) {
  if (config) {
    return config.get("key") || name;
  } else {
    return name;
  }
};

var skipSerialize = function(config) {
  return config && config.get("serialize") === false;
};

var skipDeserialize = function(config) {
  return config && config.get("deserialize") === false;
};

EM.Mapper = Ember.Object.extend({

  serializer: EM.JSONSerializer,
  container: null,

  init: function() {
    this._super();

    var serializer = get(this, 'serializer');

    if (typeof serializer === 'string') {
      serializer = get(this, serializer, false) || get(Ember.lookup, serializer);
    }

    if (EM.Serializer.detect(serializer)) {
      serializer = serializer.create();
    }

    set(this, "serializer", serializer);
  },

  serialize: function(model) {
    var attributes = {},
        serializer = get(this, "serializer"),
        configs    = get(this, "configuration"),
        type       = model.constructor,
        id;

    id = model.get("id");
    if (id) {
      var idField = serializer.keyForPrimaryKey(type);
      attributes[idField] = id;
    }

    this._serializeAttributes(model, configs, serializer, attributes);
    this._serializeAssociations(model, configs, serializer, attributes);

    return attributes;
  },

  _serializeAttributes: function(model, configs, serializer, result) {
    var config, value, key;
    var type = model.constructor;

    result = result || {};

    model.eachAttribute(function(name, meta) {
      config = configs.get(name);

      if (skipSerialize(config)) { return; }

      value = model.get(name);

      key = keyFromConfig(config, name);
      key = serializer.keyForAttributeName(type, key);

      result[key] = serializer.serializeValue(value, meta.type);
    });
  },

  _serializeAssociations: function(model, configs, serializer, attributes) {
    var type      = model.constructor,
        container = get(this, "container"),
        value, config, key, embeds, mapperName;

    model.eachAssociation(function(name, meta){
      value  = model.get(name);
      config = configs.get(name);
      key    = keyFromConfig(config, name);
      embeds = !config || config.embedded !== false;

      if (skipSerialize(config)) { return; }

      if (config) {
        mapperName = config.get("mapper");
      }

      if (meta.isOneAssociation) {
        if (embeds) {
          value = mapperFor(mapperName || value.constructor, container).serialize(value);
          key   = serializer.keyForHasOneEmbedded(type, key);
        } else {
          value = value.get("id");
          key   = serializer.keyForHasOne(type, key);
        }
      } else {
        value = value.map(function(item) {
          var itemMapper;
          if (embeds) {
            // TODO - could check whether they are all the same type and only lookup the mapper once
            // TODO - if there's a mapper, only look it up once
            itemMapper = mapperFor(mapperName || item.constructor, container);
            return itemMapper.serialize(item);
          } else {
            return item.get("id");
          }
        });

        if (embeds) {
          key = serializer.keyForHasManyEmbedded(type, key);
        } else {
          key = serializer.keyForHasMany(type, key);
        }
      }

      attributes[key] = value;
    });
  },

  sideload: function(hash) {
    var serializer = get(this, "serializer"),
        sideloads  = get(this, "sideloads"),
        container  = get(this, "container");

    sideloads.forEach(function(key, config) {
      var assoc = config.get("association"),
          type, mapper, mapperName, name, data, store;

      name = config.get("name");
      data = serializer.extractSideload(hash, name);

      if (!data) { return; }

      mapperName = config.get("mapper");

      if (!mapperName && assoc) {
        mapperName = assoc.mapper || assoc.type;
      }

      Ember.assert("No mapper found for sideloading" + config.get("name"), mapperName);

      mapper = mapperFor(mapperName, container);
      type   = mapper.get("model");

      store = config.get("store");
      if (!store && assoc) {
        store = assoc.store;
      }

      store = EM.storeFor(store || type, container);

      data.map(function(item) {
        mapper.deserialize(item, store);
      });
    });
  },

  deserialize: function(hash, store) {
    var serializer = get(this, "serializer"),
        type       = get(this, "model"),
        configs    = get(this, "configuration"),
        attributes = {};

    var idField = serializer.keyForPrimaryKey(type);
    if (hash[idField]) {
      attributes.id = hash[idField];
    }

    this._deserializeAttributes(hash, type, configs, serializer, attributes);
    this._deserializeAssociations(hash, type, configs, serializer, attributes);

    // should we know about the store & cache here?
    // probably not, but lets us fetch & update the identity map
    var record;
    if (attributes.id && store) {
      record = store.prefetchFromCache(attributes.id);
    }

    if (record) {
      record.setProperties(attributes);
    } else {
      record = type.create(attributes);
    }

    return record;
  },

  _deserializeAttributes: function(hash, type, configs, serializer, attributes) {
    get(type, "attributes").forEach(function(name, meta) {
      var config, key;

      config = configs.get(name);

      if (skipDeserialize(config)) { return; }

      key = keyFromConfig(config, name);
      key = serializer.keyForAttributeName(type, key);

      if (hash[key] === undefined) {
        return;
      }

      attributes[name] = serializer.deserializeValue(hash[key], meta.type);
    });
  },

  _deserializeAssociations: function(hash, type, configs, serializer, attributes) {
    var container = get(this, "container");
    var self      = this;

    get(type, "associations").forEach(function(name, meta) {
      var mapper, config, embeds, key, itemStore, associationHash, value;

      config = configs.get(name);
      embeds = !config || config.get("embedded") !== false;

      if (skipDeserialize(config)) { return; }

      if (config) {
        itemStore = config.get("store");
        mapper    = config.get("mapper");
      }

      itemStore = itemStore || EM.storeFor(meta.type, container);
      mapper    = mapper    || mapperFor(meta.type, container);
      key       = self._keyForAssociation(serializer, meta, embeds, type, keyFromConfig(config, name));

      associationHash = hash[key];
      if (!associationHash) {
        return;
      }

      if (embeds) {
        if (meta.isOneAssociation) {
          value = mapper.deserialize(associationHash, itemStore);
        } else {
          value = associationHash.map(function(item) {
            return mapper.deserialize(item, itemStore);
          });
        }
      } else {
        if (meta.isOneAssociation) {
          value = itemStore.prefetchFromCache(associationHash);
        } else {
          value = associationHash.map(function(id) {
            return itemStore.prefetchFromCache(id);
          });
        }
      }

      attributes[name] = value;
    });
  },

  _keyForAssociation: function(serializer, meta, embedded, type, key) {
    if (embedded) {
      if (meta.isOneAssociation) {
        return serializer.keyForHasOneEmbedded(type, key);
      } else {
        return serializer.keyForHasManyEmbedded(type, key);
      }
    } else {
      if (meta.isOneAssociation) {
        return serializer.keyForHasOne(type, key);
      } else {
        return serializer.keyForHasMany(type, key);
      }
    }
  }

});

var meta = Ember.meta;
var MapperConfig = Ember.Object.extend();

EM.Mapper.reopenClass({
  eachConfiguration: function(callback, binding) {
    var proto = this.proto(),
        property;

    for (var name in proto) {
      property = proto[name];
      if (property instanceof MapperConfig) {
        callback.call(binding || this, name, property);
      }
    }
  },

  configuration: Ember.computed(function() {
    var map = Ember.Map.create();

    this.eachConfiguration(function(name, config) {
      config.set("name", name);
      map.set(name, config);
    });

    return map;
  })
});

EM.Mapper.reopen({
  configuration: Ember.computed(function() {
    return get(this.constructor, "configuration");
  }),

  sideloads: Ember.computed(function() {
    var model = get(this, 'model');
    var map   = Ember.Map.create();
    var assocs= get(model, 'associations');

    this.constructor.eachConfiguration(function(name, config) {
      if (config.get("sideload")) {
        config.set("name", name);
        config.set("association", assocs.get(name));
        map.set(name, config);
      }
    });

    return map;
  }),
});

EM.Mapper.attr = function(options) {
  options = options || {};
  return MapperConfig.create(options);
};

EM.Mapper.hasMany = function(options) {
  options = options || {};
  return MapperConfig.create(options);
};

EM.Mapper.hasOne = function(options) {
  options = options || {};
  return MapperConfig.create(options);
};

EM.Mapper.sideload = function(options) {
  options = options || {};
  options.sideload = true;
  return MapperConfig.create(options);
};


// TODO - handle inheritance
//
// Person = Ember.Object.extend()
// Member = Person.extend()
// mapperFor("member") should fall back to person mapper before generating one

var mapperFor = function(name, container) {
  var type;

  if (typeof name !== "string") {
    type = name;
    name = EM.nameForModel(name);
  }

  var lookupName = "mapper:"+name;
  var mapper = container.lookup(lookupName);

  if (!type) {
    type = container.lookup(":"+name);
    Ember.assert("No mapper model found for " + name, type);
    type = type.constructor; // we have an instance, need the class
  }

  if (mapper) {
    mapper.set("model", type);
    return mapper;
  }

  return generateMapper(name, type, container);
};


var generateMapper = function(name, type, container) {
  var lookupName = "mapper:"+name;

  var mapperKlass = EM.Mapper.extend({
    model: type
  });

  mapperKlass.toString = function() {
    return "(generated "+ name + " mapper)";
  };

  container.register(lookupName, mapperKlass);
  return container.lookup(lookupName);
};


EM.mapperFor = mapperFor;