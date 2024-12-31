const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { DateTime } = require('luxon');

const LeadSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  businessName: { type: String },
  email: { type: String },
  phone: { type: Number },
  notes: { type: String },
  isContacted: { type: Boolean, default: false }
}, { timestamps: true });

// Virtual for lead's full name
LeadSchema.virtual("name").get(function () {
  let fullname = "";
  if (this.firstName && this.lastName) {
    fullname = `${this.firstName} ${this.lastName}`;
  }
  if (!this.firstName || !this.lastName) {
    fullname = "";
  }
  return fullname;
});

LeadSchema.virtual("createdAt_formatted").get(function () {
  return DateTime.fromJSDate(this.createdAt).toUTC().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
});

LeadSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/admin/lead/${this._id}`;
});

module.exports = mongoose.model('Lead', LeadSchema);