const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
  originalName: { type: String },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  business: { type: Schema.Types.ObjectId, ref: 'Business' },
  imageUrl: { type: String },
  imageName: { type: String },
  isPaid: { type: Boolean, default: false }
}, { timestamps: true });

ExpenseSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/expense/${this._id}`;
});

ExpenseSchema.virtual("url_employee").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/employee/expense/${this._id}`;
});

module.exports = mongoose.model('Expense', ExpenseSchema);