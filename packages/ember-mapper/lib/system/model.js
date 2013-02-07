require("ember-mapper/system/model/model");
require("ember-mapper/system/model/proxy");
require("ember-mapper/system/model/attributes");
require("ember-mapper/system/model/associations");

EM.nameForModel = function(type) {
  var typeString = type.toString();

  Ember.assert("Your model must not be anonymous. It was " + type, typeString.charAt(0) !== '(');

  // use the last part of the name as the URL
  var parts = typeString.split(".");
  var name = parts[parts.length - 1].toLowerCase();

  return name;
};
