const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BusinessSchema = new Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: Number },
  street: { type: String },
  city: { type: String },
  province: { type: String },
  postal: { type: String },
  hst: { type: String },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  subscription: {
    type: String,
    enum: ['NONE', 'TRIAL', 'BASIC', 'PRO'],
  },
  signupType: { type: String, default: null },
  stripeAcctID: { type: String, default: null },
  chargesEnabled: { type: Boolean, default: false },
  detailsSubmitted: { type: Boolean, default: false },
  sessionId: { type: String, default: null },
  stripeCustomerId: { type: String, default: null },
  hasTrialed: { type: Boolean, default: false }

});

BusinessSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/admin/user/${this._id}`;
});

BusinessSchema.virtual("url_dashboard").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/user/${this._id}`;
});

module.exports = mongoose.model('Business', BusinessSchema);