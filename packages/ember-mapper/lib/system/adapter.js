function mustImplement(name) {
  return function() {
    throw new Ember.Error("Your adapter " + this.toString() + " does not implement the required method " + name);
  };
}

var get = Ember.get,
    set = Ember.set;

EM.Adapter = Ember.Object.extend({

  // Override these to implement your adapter
  // See RESTAdapter for examples
  findOne:      mustImplement("findOne"),      // function(store, mapper, id, record)
  findQuery:    mustImplement("findQuery"),    // function(store, mapper, query, records)
  createRecord: mustImplement("createRecord"), // function(store, mapper, record)
  updateRecord: mustImplement("updateRecord"), // function(store, mapper, record)
  deleteRecord: mustImplement("deleteRecord"), // function(store, mapper, record)

  didFindOne: function(store, mapper, data, record) {
    var itemData, serializer, deserialized;

    serializer   = get(mapper, "serializer");
    itemData     = serializer.extractItem(data, get(mapper, 'model'));
    deserialized = mapper.deserialize(itemData, store);

    this.extractMeta(data, serializer);
    this.extractSideloads(data, mapper);

    store.didFindOne(deserialized, mapper, record);
  },

  didFindMany: function(store, mapper, data, records) {
    var itemsData, serializer, deserialized;

    serializer   = get(mapper, "serializer");
    itemsData    = serializer.extractItems(data, get(mapper, 'model'));
    deserialized = itemsData.map(function(item) { return mapper.deserialize(item, store); });

    this.extractMeta(data, serializer);
    this.extractSideloads(data, mapper);

    store.didFindMany(deserialized, mapper, records);
  },

  didCreateRecord: function(store, mapper, data, record) {
    var itemData, serializer, deserialized;

    serializer   = get(mapper, "serializer");
    itemData     = serializer.extractItem(data, get(mapper, 'model'));

    mapper.deserialize(itemData, store, record);

    this.extractMeta(data, serializer);
    this.extractSideloads(data, mapper);

    store.didCreateRecord(mapper, record);
  },

  didUpdateRecord: function(store, mapper, data, record) {
    var itemData, serializer, deserialized;

    serializer   = get(mapper, "serializer");
    itemData     = serializer.extractItem(data, get(mapper, 'model'));

    mapper.deserialize(itemData, store, record);

    this.extractMeta(data, serializer);
    this.extractSideloads(data, mapper);

    store.didUpdateRecord(mapper, record);
  },

  didDeleteRecord: function(store, mapper, data, record) {
    var serializer = get(mapper, "serializer");

    this.extractMeta(data, serializer);
    this.extractSideloads(data, mapper);

    store.didDeleteRecord(mapper, record);
  },

  // runs the meta data through the serializer
  // TODO - could have a mapper for meta data?
  extractMeta: function(data, serializer) {
    if (!data) { return; }

    var metaData = serializer.extractMeta(data);

    if (!metaData) { return; }

    var attrs = {};
    for (var prop in metaData) {
      if (!metaData.hasOwnProperty(prop)) { continue; }
      attrs[serializer.keyForAttributeName(prop)] = metaData[prop];
    }

    Ember.Object.create(attrs);
  },

  extractSideloads: function(data, mapper) {
    if (!data) { return; }
    mapper.sideload(data);
  }

});