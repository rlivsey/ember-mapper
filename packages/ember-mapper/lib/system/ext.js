var get = Ember.get;

Ember.Route.reopen({

  storeFor: function(name) {
    var container = get(this, 'container');
    return EM.storeFor(name, container);
  },

  model: function(params) {
    var match, name, sawParams, value;

    for (var prop in params) {
      if (match = prop.match(/^(.*)_id$/)) {
        name = match[1];
        value = params[prop];
      }
      sawParams = true;
    }

    if (!name && sawParams) { return params; }
    else if (!name) { return; }

    var container = get(this, 'container');
    var namespace = this.router.namespace;
    var store     = this.storeFor(name);

    // TODO - make sure we have a valid store & found a valid model class

    return store.find(value);
  }
});