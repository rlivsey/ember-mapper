require("ember-mapper/system/mixins/model_lifecycle");

EM.ModelProxy = Ember.ObjectProxy.extend(Ember.Evented, EM.ModelLifecycle);