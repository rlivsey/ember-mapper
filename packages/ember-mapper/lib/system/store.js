require("ember-mapper/system/model/proxy");
require("ember-mapper/system/identity_map");
require("ember-mapper/system/record_array");
require("ember-mapper/system/model");

// default adapter is RESTAdapter
require("ember-mapper/adapters/rest_adapter");

var get = Ember.get;

EM.Store = Ember.Object.extend({
  adapter: EM.RESTAdapter,
  identityMap: EM.IdentityMap,
  model: null, // if using polymorphism this should be the base class

  init: function() {
    this._super();

    var identityMap = get(this, 'identityMap');

    if (typeof identityMap === 'string') {
      identityMap = get(this, identityMap, false) || get(Ember.lookup, identityMap);
    }

    if (identityMap === false) {
      identityMap = EM.NullIdentityMap;
    }

    if (EM.IdentityMap.detect(identityMap)) {
      identityMap = identityMap.create();
    }

    this._identityMap = identityMap;
  },

  _adapter: Ember.computed(function(){
    var adapter = get(this, 'adapter');

    if (typeof adapter === 'string') {
      adapter = get(this, adapter, false) || get(Ember.lookup, adapter);
    }

    if (EM.Adapter.detect(adapter)) {
      adapter = adapter.create();
    }

    adapter.set("container", this.get("container"));

    return adapter;
  }).property("adapter"),

  find: function(id_or_query, mapper) {
    if ("object" === typeof id_or_query) {
      return this.findQuery(id_or_query, mapper);
    } else if (id_or_query === undefined) {
      return this.findQuery({}, mapper);
    } else {
      return this.findOne(id_or_query, mapper);
    }
  },

  getMapper: function(name, type) {
    var mapper, container;

    type = type || get(this, "model");
    container = get(this, "container");

    if (name === undefined) {
      mapper = EM.mapperFor(type, container);
    } else {
      mapper = EM.mapperFor(name, container);
    }

    return mapper;
  },

  prefetchFromCache: function(id) {
    var record, type;
    record = this.fetchFromCache(id);

    if (!record) {
      type = get(this, "model");
      record = type.create({id: id});
      this._identityMap.store(record);
    }

    return record;
  },

  fetchFromCache: function(id) {
    return this._identityMap.fetchByID(id);
  },

  findOne: function(id, mapper) {
    var record, adapter;

    record = this.fetchFromCache(id);
    if (record) {
      return record;
    }

    // wasn't in identity map & won't be on server if we've done an all search
    if (this._allCache) {
      return;
    }

    adapter = this.get("_adapter");
    mapper  = this.getMapper(mapper);

    record  = EM.ModelProxy.create({content: null, isLoading: true});
    record.trigger("isLoading");

    adapter.findOne(this, mapper, id, record);

    return record;
  },

  didFindOne: function(record, mapper, proxy) {
    proxy.set("content", record);
    proxy.trigger("didLoad");
  },

  // TODO - bust the cache if the query is different
  findAll: function(query, mapper) {
    var records, adapter;

    if (this._allCache) {
      return this._allCache;
    }

    adapter = this.get("_adapter");
    mapper  = this.getMapper(mapper);

    records = EM.RecordArray.create({content: [], isLoading: true});
    records.trigger("isLoading");
    this._allCache = records;

    adapter.findQuery(this, mapper, query, records);

    return records;
  },

  findQuery: function(query, mapper) {
    var records, adapter;

    adapter = this.get("_adapter");
    mapper  = this.getMapper(mapper);

    records = EM.RecordArray.create({content: [], isLoading: true});
    records.trigger("isLoading");

    adapter.findQuery(this, mapper, query, records);

    return records;
  },

  didFindMany: function(records, mapper, proxy) {
    proxy.set("content", records);
    proxy.trigger("didLoad");
  },

  createRecord: function(model, mapper) {
    var adapter;

    adapter = this.get("_adapter");
    mapper  = this.getMapper(mapper, model.constructor);

    adapter.createRecord(this, mapper, model);
    model.trigger("isCreating");

    return model;
  },

  didCreateRecord: function(mapper, record) {
    record.trigger("didCreate");
  },

  updateRecord: function(model, mapper) {
    var adapter;

    adapter = this.get("_adapter");
    mapper  = this.getMapper(mapper, model.constructor);

    adapter.updateRecord(this, mapper, model);
    model.trigger("isUpdating");

    return model;
  },

  didUpdateRecord: function(mapper, record) {
    record.trigger("didUpdate");
  },

  deleteRecord: function(model, mapper) {
    var adapter;

    adapter = this.get("_adapter");
    mapper  = this.getMapper(mapper, model.constructor);

    adapter.deleteRecord(this, mapper, model);
    model.trigger("isDeleting");

    return model;
  },

  didDeleteRecord: function(mapper, record) {
    record.trigger("didDelete");
    this._identityMap.remove(record);
  },

  didReceiveMeta: function(mapper, record, meta) {
    record.set("meta", meta);
  },

  recordWasInvalid: function(mapper, record, errors) {
    record.set("errors", Ember.Object.create(errors));
  },

  recordWasError: function(mapper, record) {
    record.trigger("didError");
  }

});

EM.storeFor = function(name, container) {
  var type;

  if (typeof name !== "string") {
    type = name;
    name = EM.nameForModel(name);
  }

  var lookupName = "store:"+name;
  var store = container.lookup(lookupName);

  if (store) {
    return store;
  }

  if (!type) {
    type = container.lookup(":"+name);
    // this assert should probably be in the Store
    Ember.assert("No model found for " + name, type);
    type = type.constructor;
  }

  return generateStore(name, type, container);
};

var generateStore = function(name, type, container) {
  var lookupName = "store:"+name;

  var storeKlass = EM.Store.extend({
    model: type
  });

  storeKlass.toString = function() {
    return "(generated "+ name + " store)";
  };

  container.register(lookupName, storeKlass);
  return container.lookup(lookupName);
};
