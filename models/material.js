const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MaterialSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  business: { type: Schema.Types.ObjectId, ref: 'Business' },
  supplier: { type: String, default: 'N/A' },
  inStock: { type: Number, default: 0 }
}, { timestamps: true });

MaterialSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/material/${this._id}`;
});

MaterialSchema.virtual("url_employee").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/employee/material/${this._id}`;
});

module.exports = mongoose.model('Material', MaterialSchema);