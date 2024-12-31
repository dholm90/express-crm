const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');

const OptInSchema = new Schema({
  email: { type: String, required: true },
}, { timestamps: true });

OptInSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/admin/opt-in/${this._id}`;
});

OptInSchema.virtual("date_formatted").get(function () {
  return DateTime.fromJSDate(this.createdAt).toUTC().toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
});

module.exports = mongoose.model('Opt_In', OptInSchema);
