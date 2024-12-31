const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }
}, { timestamps: true });

ServiceSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/service/${this._id}`;
});

ServiceSchema.virtual("url_employee").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/employee/service/${this._id}`;
});


module.exports = mongoose.model('Service', ServiceSchema);