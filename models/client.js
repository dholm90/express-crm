const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClientSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  street: { type: String },
  city: { type: String },
  province: { type: String },
  postal: { type: String },
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Virtual for client's full name
ClientSchema.virtual("name").get(function () {
  let fullname = "";
  if (this.firstName && this.lastName) {
    fullname = `${this.firstName} ${this.lastName}`;
  }
  if (!this.firstName || !this.lastName) {
    fullname = "";
  }
  return fullname;
});

ClientSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'client'
});

// Virtual for clients's URL
ClientSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/client/${this._id}`;
});

// Virtual for clients's URL
ClientSchema.virtual("url_employee").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/employee/client/${this._id}`;
});

module.exports = mongoose.model('Client', ClientSchema);
