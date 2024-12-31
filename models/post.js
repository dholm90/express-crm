const mongoose = require('mongoose');
const URLSlug = require('mongoose-slug-updater');
mongoose.plugin(URLSlug);
const Schema = mongoose.Schema;

const { DateTime } = require('luxon');



const PostSchema = new Schema({
  title: { type: String, required: true, unique: true },
  imgUrl: { type: String },
  imgName: { type: String },
  content: { type: String, required: true },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  isPublished: { type: Boolean, required: true, default: false },
  slug: { type: String, slug: 'title' }
}, { timestamps: true });

// PostSchema.pre("save", function (next) {
//   this.slug = this.title.split(" ").join("-");
//   next();
// });

PostSchema.virtual("createdAt_formatted").get(function () {
  return DateTime.fromJSDate(this.createdAt).toUTC().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
});

PostSchema.virtual("client_url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/blog/${this.slug}`;
});

PostSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/admin/post/${this._id}`;
});

module.exports = mongoose.model('Post', PostSchema);