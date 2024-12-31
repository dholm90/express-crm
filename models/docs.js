const mongoose = require('mongoose');
const URLSlug = require('mongoose-slug-updater');
mongoose.plugin(URLSlug);
const slugify = require('slugify');
const Schema = mongoose.Schema;

const { DateTime } = require('luxon');



const DocSchema = new Schema({
  title: { type: String, required: true, unique: true },
  parent: {
    type: String, enum: [
      'Getting-Started',
      'Clients',
      'Employees',
      'Images',
      'Materials',
      'Services',
      'Quotes',
      'Jobs',
      'Invoices',
      'Email',
      'Payments',
      'Billing'
    ]
  },
  content: { type: String, required: true },
  isPublished: { type: Boolean, required: true, default: false },
  slug: { type: String, slug: 'title' },
}, { timestamps: true });

DocSchema.virtual("createdAt_formatted").get(function () {
  return DateTime.fromJSDate(this.createdAt).toUTC().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
});

DocSchema.virtual("client_url").get(function () {
  const parentSlug = slugify(this.parent, { lower: true })
  // We don't use an arrow function as we'll need the this object
  return `/docs/${parentSlug}/${this.slug}`;
});

DocSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/admin/doc/${this._id}`;
});

module.exports = mongoose.model('Doc', DocSchema);