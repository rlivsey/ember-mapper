var get = Ember.get;

EM.ModelLifecycle = Ember.Mixin.create({

  isLoading:  false,
  isSaving:   false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isError:    false,

  init: function() {
    this._super.apply(this, arguments);

    this.on("isLoading",  this._isLoading);
    this.on("isCreating", this._isCreating);
    this.on("isUpdating", this._isUpdating);
    this.on("isDeleting", this._isDeleting);
    this.on("didLoad",    this._didLoad);
    this.on("didCreate",  this._didCreate);
    this.on("didUpdate",  this._didUpdate);
    this.on("didDelete",  this._didDelete);
    this.on("didError",   this._didError);
  },

  isLoaded: Ember.computed(function(){
    return !get(this, "isLoading");
  }).property("isLoading"),

  _isLoading: function() {
    this.set("isLoading", true);
    this.set("isError", false);
  },

  _isCreating: function() {
    this.set("isSaving", true);
    this.set("isCreating", true);
    this.set("isError", false);
  },

  _isUpdating: function() {
    this.set("isSaving", true);
    this.set("isUpdating", true);
    this.set("isError", false);
  },

  _isDeleting: function() {
    this.set("isDeleting", true);
    this.set("isSaving", true);
    this.set("isError", false);
  },

  _didLoad: function() {
    this.set("isLoading", false);
  },

  _didCreate: function() {
    this.set("isSaving", false);
    this.set("isCreating", false);
  },

  _didUpdate: function() {
    this.set("isSaving", false);
    this.set("isUpdating", false);
  },

  _didDelete: function() {
    this.set("isSaving", false);
    this.set("isDeleting", false);
  },

  _didError: function() {
    this.set("isError", true);
    this.set("isSaving", false);
    this.set("isLoading", false);
    this.set("isCreating", false);
    this.set("isUpdating", false);
    this.set("isDeleting", false);
  }

});