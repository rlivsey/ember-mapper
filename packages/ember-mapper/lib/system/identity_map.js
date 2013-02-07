EM.IdentityMap = Ember.Object.extend({
  init: function() {
    this.counter = 0;
    this.clear();
  },

  store: function(object) {
    var id  = object.get("id"),
        cid = object.get("_im_cid");

    if (cid === undefined) {
      cid = ++this.counter;
      object.set("_im_cid", cid);
    }

    if (id !== undefined) {
      this.id_to_cid[id]  = cid;
      this.cid_to_id[cid] = id;
    }

    this.data[cid] = object;

    return cid;
  },

  remove: function(object) {
    var id  = object.get("id"),
        cid = object.get("_im_cid");

    if (id !== undefined) {
      delete this.id_to_cid[id];
    }

    if (cid !== undefined) {
      delete this.cid_to_id[cid];
      delete this.data[cid];
    }
  },

  fetchByClientID: function(id) {
    return this.data[id];
  },

  fetchByID: function(id) {
    return this.data[this.id_to_cid[id]];
  },

  clear: function() {
    this.id_to_cid = {};
    this.cid_to_id = {};
    this.data      = {};
  }
});

var nothing = function(){};
EM.NullIdentityMap = Ember.Object.extend({
  store: nothing,
  fetchByClientID: nothing,
  fetchByID: nothing,
  clear: nothing,
  remove: nothing
});
