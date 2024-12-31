const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  originalName: { type: String },
  imageUrl: { type: String },
  imageName: { type: String },
  business: { type: Schema.Types.ObjectId, ref: 'Business' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  quote: { type: Schema.Types.ObjectId, ref: 'Quote', default: null },
  job: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', default: null }
}, { timestamps: true });


ImageSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/image/${this._id}`;
});

module.exports = mongoose.model('Image', ImageSchema);