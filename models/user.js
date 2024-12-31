const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String },
  email: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  password: { type: String },
  phone: { type: Number },
  street: { type: String },
  businessName: { type: String },
  city: { type: String },
  province: { type: String },
  postal: { type: String },
  hst: { type: String },
  hourlyRate: { type: Number, default: 0 },
  role: {
    type: String,
    enum: ['SUPERADMIN', 'ADMIN', 'EMPLOYEE'],
  },
  subscription: {
    type: String,
    enum: ['NONE', 'TRIAL', 'BASIC', 'PRO'],
  },
  business: { type: Schema.Types.ObjectId, ref: 'Business' }
});


// Virtual for client's full name
UserSchema.virtual("name").get(function () {
  let fullname = "";
  if (this.firstName && this.lastName) {
    fullname = `${this.firstName} ${this.lastName}`;
  }
  if (!this.firstName || !this.lastName) {
    fullname = "";
  }
  return fullname;
});

UserSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/admin/user/${this._id}`;
});

UserSchema.virtual("url_dashboard").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/user/${this._id}`;
});

UserSchema.virtual("url_employee").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/employee/user/${this._id}`;
});

module.exports = mongoose.model('User', UserSchema);