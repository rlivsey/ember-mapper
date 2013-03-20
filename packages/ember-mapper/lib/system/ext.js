var get = Ember.get;

var StoreMixin = Ember.Mixin.create({
  storeFor: function(name) {
    var container = get(this, 'container');
    return EM.storeFor(name, container);
  }
});

Ember.ControllerMixin.reopen(StoreMixin);

Ember.Route.reopen(StoreMixin, {
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

    var store = this.storeFor(name);

    // TODO - make sure we have a valid store & found a valid model class

    return store.find(value);
  }
});

// models are plain classes on the app - IE model:person -> App.Person
Ember.DefaultResolver.reopen({
  resolveModel: function(parsedName) {
    var className = Ember.String.classify(parsedName.name),
        factory = Ember.get(parsedName.root, className);
    if (factory) { return factory; }
  }
});
