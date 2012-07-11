EmberMapper.IdentityMap = Ember.Object.extend({
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
      this.cids.push(cid);
    }

    if (id !== undefined) {
      this.id_to_cid[id]  = cid;
      this.cid_to_id[cid] = id;
    }

    this.data[cid] = object;

    return cid;
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
    this.cids      = [];
    this.data      = {};
  }
});

EmberMapper.NullIdentityMap = Ember.Object.extend({
  store: Ember.K,
  fetchByClientID: Ember.K,
  fetchByID: Ember.K,
  clear: Ember.K
});
