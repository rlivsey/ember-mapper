/*global jQuery*/

var get = Ember.get, set = Ember.set, getPath = Ember.getPath;

EmberMapper.Store = Ember.Object.extend({

  schema: null,

  /*
    Where's the data at?
    Convention is to use this for findMany/create and append the ID for findOne/update
    but you can override URL generation to do whatever you like
  */
  url: null,

  /*
    Used for loading/saving data from/to JSON

    Set to "person" if your JSON is structured like so:

          {
            person: {
              first_name: "Bob"
            }
          }

    Leave as "null" if your JSON is like this:

          {
            first_name: "Bob"
          }

   */
  singularKey: null,

  /*
    pluralized based on the singular key
    Override to do something more intelligent
  */
  pluralKey: Ember.computed(function() {
    var singular = this.get("singularKey");
    if (singular) {
      return singular + "s";
    }
  }).property().cacheable(),

  init: function() {
    this._allCache = null;
    Ember.assert("No schema provided", !!this.get("schema"));
  },

  find: function(id) {
    var schema = this.get("schema"),
        record;

    record = this.findFromCache(id);
    if (record) {
      return record;
    }

    // if we've loaded all, don't even try and hit the server
    if (this._allCache !== null) {
      return;
    }

    record = schema.createRecord({id: id});
    this.findOneRequest(this.findUrl(id), record);
    return record;
  },

  findMany: function(query) {
    var records = EmberMapper.RecordArray.create();
    this.findManyRequest(this.findManyUrl(), records, {
      data: query
    });
    return records;
  },

  createRecord: function(record) {
    var schema = this.get("schema");
    this.createRecordRequest(this.createRecordUrl(record), record, {
      data: this.jsonItemDataFromRecord(record)
    });
    return record;
  },

  updateRecord: function(record) {
    var schema = this.get("schema");
    this.updateRecordRequest(this.updateRecordUrl(record), record, {
      data: this.jsonItemDataFromRecord(record)
    });
    return record;
  },

  deleteRecord: function(record) {
    var schema = this.get("schema");
    this.deleteRecordRequest(this.deleteRecordUrl(record), record);
    return record;
  },

  findUrl: function(id) {
    return this.get("url") + "/" + id;
  },

  findManyUrl: function() {
    return this.get("url");
  },

  createRecordUrl: function(record) {
    return this.get("url");
  },

  updateRecordUrl: function(record) {
    return this.get("url") + "/" + record.get("id");
  },

  deleteRecordUrl: function(record) {
    return this.get("url") + "/" + record.get("id");
  },

  findOneRequest: function(url, record, hash) {
    var ajax;

    hash = hash || {};

    record.setProperties({isLoading: true, isError: false});

    ajax = this.ajax(url, "GET", hash);

    ajax.done(function(data) {
      this.loadOneFromServer(data, record);
    });

    ajax.fail(function() {
      record.set("isError", true);
    });

    ajax.always(function() {
      record.set("isLoading", false);
    });

    return ajax;
  },

  findManyRequest: function(url, records, hash) {
    var ajax;

    hash = hash || {};

    records.setProperties({isLoading: true, isError: false});

    ajax = this.ajax(url, "GET", hash);

    ajax.done(function(data) {
      this.loadManyFromServer(data, records);
    });

    ajax.fail(function() {
      records.set("isError", true);
    });

    ajax.always(function() {
      records.set("isLoading", false);
    });

    return ajax;
  },

  createRecordRequest: function(url, record, hash) {
    var ajax;

    hash = hash || {};

    record.setProperties({isSaving: true, isCreating: true, isError: false});

    ajax = this.ajax(url, "POST", hash);

    ajax.done(function(data) {
      this.loadOneFromServer(data, record);
    });

    ajax.fail(function() {
      record.set("isError", true);
    });

    ajax.always(function() {
      record.setProperties({isSaving: false, isCreating: false});
    });

    return ajax;
  },

  updateRecordRequest: function(url, record, hash) {
    var ajax;

    hash = hash || {};

    record.setProperties({isSaving: true, isUpdating: true, isError: false});

    ajax = this.ajax(url, "PUT", hash);

    ajax.done(function(data) {
      this.loadOneFromServer(data, record);
    });

    ajax.fail(function() {
      record.set("isError", true);
    });

    ajax.always(function() {
      record.setProperties({isSaving: false, isUpdating: false});
    });

    return ajax;
  },

  deleteRecordRequest: function(url, record, hash) {
    var ajax;

    hash = hash || {};

    record.setProperties({isSaving: true, isDeleting: true, isError: false});

    ajax = this.ajax(url, "DELETE", hash);

    ajax.done(function(data) {
      this.loadOneFromServer(data, record);
      record.set("isDeleted", true);
    });

    ajax.fail(function() {
      record.set("isError", true);
    });

    ajax.always(function() {
      record.setProperties({isSaving: false, isDeleting: false});
    });

    return ajax;
  },

  /*
    Loads JSON into the identity map and returns the materialized record
    optionally update an existing record instead of creating a new one
  */
  loadOne: function(json, record) {
    var schema = this.get("schema");
    return schema.from(json, record);
  },

  /*
    Loads JSON into the identity map and returns the materialized records
  */
  loadMany: function(items) {
    var records = [];
    for (var i=0, l=get(items, 'length'); i<l; i++) {
      records.push(this.loadOne(items[i]));
    }
    return records;
  },

  loadOneFromServer: function(json, record) {
    var jsonItem, loaded;
    jsonItem = this.jsonItemFromServerResponse(json);
    this.loadOne(jsonItem, record);
  },

  loadManyFromServer: function(json, records) {
    var jsonItems, loaded;
    jsonItems = this.jsonItemsFromServerResponse(json);
    loaded = this.loadMany(jsonItems);
    records.set("content", loaded);
  },

  jsonItemFromServerResponse: function(json) {
    var key = this.get("singularKey");
    return (key === undefined) ? json : json[key];
  },

  jsonItemsFromServerResponse: function(json) {
    var key = this.get("pluralKey");
    return (key === undefined) ? json : json[key];
  },

  serializeRecord: function(record) {
    var schema = this.get("schema");
    return schema.to(record);
  },

  serializeRecords: function(records) {
    var schema = this.get("schema"),
        items = [];

    for (var i=0, l=get(records, 'length'); i<l; i++) {
      items.push(schema.to(records[i]));
    }
    return items;
  },

  jsonItemDataFromRecord: function(record) {
    var key = this.get("singularKey"),
        data = this.serializeRecord(record);

    if (key === undefined) {
      return data;
    } else {
      var json = {};
      json[key] = data;
      return json;
    }
  },

  jsonItemsDataFromRecords: function(records) {
    var key = this.get("pluralKey"),
        data = this.serializeRecords(records);

    if (key === undefined) {
      return data;
    } else {
      var json = {};
      json[key] = data;
      return json;
    }
  },

  /*
    load many, but with the assumption there's no more to come
    means you can call `all` later and get them all back
  */
  loadAll: function(json) {
    this._allCache = this.loadMany(json);
    return this._allCache;
  },

  /*
    If you've loaded all, this returns them all
  */
  all: function() {
    return this._allCache || [];
  },

  findFromCache: function(id) {
    var schema   = this.get("schema"),
        identity = schema.get("identityMap");

    return identity.fetchByID(id);
  },

  ajax: function(url, type, hash) {
    hash.url = url;
    hash.type = type;
    hash.dataType = 'json';
    hash.contentType = 'application/json; charset=utf-8';
    hash.context = this;

    if (hash.data && type !== 'GET') {
      hash.data = JSON.stringify(hash.data);
    }

    return jQuery.ajax(hash);
  }

});