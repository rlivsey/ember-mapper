require("ember-mapper/system/adapter");

var get = Ember.get, set = Ember.set;

EM.RESTAdapter = EM.Adapter.extend({

  url: "",
  namespace: undefined,

  findOne: function(store, mapper, id, record) {
    var root = this.rootForMapper(mapper);
    var url  = this.buildURL(root, mapper, id);

    this.ajax(url, this.verbFor('find'), {
      success: function(json) {
        this.didFindOne(store, mapper, json, record);
      },
      error: function(xhr) {
        this.didError(store, mapper, record, xhr);
      }
    });
  },

  findQuery: function(store, mapper, query, records) {
    var root = this.rootForMapper(mapper);
    var url  = this.buildURL(root, mapper);

    this.ajax(url, this.verbFor('find'), {
      data: query,
      success: function(json) {
        this.didFindMany(store, mapper, json, records);
      },
      error: function(xhr) {
        this.didError(store, mapper, records, xhr);
      }
    });
  },

  createRecord: function(store, mapper, record) {
    var root = this.rootForMapper(mapper);
    var url  = this.buildURL(root, mapper);
    var data = {};

    data[root] = mapper.serialize(record);

    this.ajax(url, this.verbFor('create'), {
      data: data,
      success: function(json) {
        this.didCreateRecord(store, mapper, json, record);
      },
      error: function(xhr) {
        this.didError(store, mapper, record, xhr);
      }
    });
  },

  updateRecord: function(store, mapper, record) {
    var root = this.rootForMapper(mapper);
    var url  = this.buildURL(root, mapper, get(record, 'id'));
    var data = {};

    data[root] = mapper.serialize(record);

    this.ajax(url, this.verbFor('update'), {
      data: data,
      success: function(json) {
        this.didCreateRecord(store, mapper, json, record);
      },
      error: function(xhr) {
        this.didError(store, mapper, record, xhr);
      }
    });
  },

  deleteRecord: function(store, mapper, record) {
    var root = this.rootForMapper(mapper);
    var url  = this.buildURL(root, mapper, get(record, 'id'));

    this.ajax(url, this.verbFor('delete'), {
      success: function(json) {
        this.didDeleteRecord(store, mapper, json, record);
      },
      error: function(xhr) {
        this.didError(store, mapper, record, xhr);
      }
    });
  },

  didError: function(store, mapper, record, xhr) {
    if (xhr.status === 422) {
      var data = JSON.parse(xhr.responseText);
      store.recordWasInvalid(mapper, record, data['errors']);
    } else {
      this._super.apply(this, arguments);
    }
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

    Ember.$.ajax(hash);
  },

  rootForMapper: function(mapper) {
    var serializer = get(mapper, 'serializer'),
        type       = get(mapper, "model");
    return serializer.rootForType(type);
  },

  pluralize: function(string) {
    var serializer = get(this, 'serializer');
    return serializer.pluralize(string);
  },

  buildURL: function(record, mapper, suffix) {
    var url = [this.url],
        serializer = get(mapper, 'serializer');

    Ember.assert("Namespace URL (" + this.namespace + ") must not start with slash", !this.namespace || this.namespace.toString().charAt(0) !== "/");
    Ember.assert("Record URL (" + record + ") must not start with slash", !record || record.toString().charAt(0) !== "/");
    Ember.assert("URL suffix (" + suffix + ") must not start with slash", !suffix || suffix.toString().charAt(0) !== "/");

    if (this.namespace !== undefined) {
      url.push(this.namespace);
    }

    url.push(serializer.pluralize(record));
    if (suffix !== undefined) {
      url.push(suffix);
    }

    return url.join("/");
  },

  // override if you want to do something like using PATCH for updates
  verbFor: function(action) {
    return {
      find: "GET",
      create: "POST",
      update: "PUT",
      'delete': "DELETE"
    }[action];
  }

});