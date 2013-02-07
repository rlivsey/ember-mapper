require("ember-mapper/system/mixins/load_promise");
require("ember-mapper/system/mixins/model_lifecycle");

var get = Ember.get,
    tryInvoke = Ember.tryInvoke;

EM.Model = Ember.Object.extend(Ember.Evented, EM.LoadPromise, EM.ModelLifecycle, {

  toStringExtension: function() {
    return get(this, 'id');
  },

  /**
  @private

  Override the default event firing from Ember.Evented to
  also call methods with the given name.
  */
  trigger: function(name) {
    tryInvoke(this, name, [].slice.call(arguments, 1));
    this._super.apply(this, arguments);
  }
});