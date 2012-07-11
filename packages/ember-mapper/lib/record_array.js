// Purely an array proxy with an 'isLoading' property, nothing clever

EmberMapper.RecordArray = Ember.ArrayProxy.extend({
  isLoading: false,
  content: null
});