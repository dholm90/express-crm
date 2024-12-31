const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: { type: String },
  business: { type: Schema.Types.ObjectId, ref: 'Business' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

CategorySchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/category/${this._id}`;
});

CategorySchema.virtual("url_employee").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/employee/category/${this._id}`;
});

module.exports = mongoose.model('Category', CategorySchema);