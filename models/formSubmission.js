const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');

const FormSubmissionSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number },
  message: { type: String, required: true },
  isRead: { type: Boolean, required: true, default: false }
}, { timestamps: true });

FormSubmissionSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/admin/form/${this._id}`;
});

FormSubmissionSchema.virtual("date_formatted").get(function () {
  return DateTime.fromJSDate(this.createdAt).toUTC().toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
});

module.exports = mongoose.model('Form_Submission', FormSubmissionSchema);
