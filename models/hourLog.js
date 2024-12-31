const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HourLogSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User' },
  totalHours: { type: Number, default: 0 },
  date: { type: Date },
  isPaid: { type: Boolean, default: false },
  business: { type: Schema.Types.ObjectId, ref: 'Business' },
}, { timestamps: true });

HourLogSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/hours/${this._id}`;
});

HourLogSchema.virtual("url_employee").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/employee/hours/${this._id}`;
});

module.exports = mongoose.model('HourLog', HourLogSchema);