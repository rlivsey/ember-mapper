require("ember-mapper/system/mixins/model_lifecycle");
require("ember-mapper/system/mixins/load_promise");

EM.ModelProxy = Ember.ObjectProxy.extend(Ember.Evented, EM.LoadPromise, EM.ModelLifecycle);