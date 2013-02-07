require("ember-mapper/system/mixins/load_promise");

var get = Ember.get,
    set = Ember.set;

EM.RecordArray = Ember.ArrayProxy.extend(Ember.Evented, EM.LoadPromise, {
  content: null,

  isLoading: false,
  isError:   false,

  init: function() {
    this._super.apply(this, arguments);

    this.on("isLoading", this._isLoading);
    this.on("didLoad",   this._didLoad);
    this.on("didError",  this._didError);
  },

  isLoaded: Ember.computed(function() {
    return !get(this, "isLoading");
  }).property("isLoading"),

  _isLoading: function() {
    set(this, "isError",   false);
    set(this, "isLoading", true);
  },

  _didLoad: function() {
    set(this, "isLoading", false);
  },

  _didError: function() {
    set(this, "isError",   true);
    set(this, "isLoading", false);
  }

});