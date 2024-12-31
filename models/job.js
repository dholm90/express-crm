const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');

const JobSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
  employees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  loggedHours: [{ type: Schema.Types.ObjectId, ref: 'HourLog' }],
  signatureName: { type: String },
  signatureURL: { type: String },
  title: { type: String, required: true },
  jobStart: { type: Date, required: true },
  jobEnd: { type: Date, required: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  tax: { type: Number },
  markup: { type: Number },
  images: [{ type: Schema.Types.ObjectId, ref: 'Image' }],
  isActive: {
    type: Boolean,
    default: true
  },
  materials: [
    {
      material: { type: Schema.Types.ObjectId, ref: 'Material' },
      qty: { type: Number },
      name: { type: String },
      supplier: { trpe: String },
      price: { type: Number }
    }
  ],
  services: [
    {
      service: { type: Schema.Types.ObjectId, ref: 'Service' },
      title: { type: String },
      price: { type: Number },
      description: { type: String }
    }
  ]
}, { timestamps: true })

JobSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/job/${this._id}`;
});

JobSchema.virtual("url_employee").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/employee/job/${this._id}`;
});

JobSchema.virtual("jobStart_formatted").get(function () {
  return DateTime.fromJSDate(this.jobStart).toUTC().toFormat('yyyy-MM-dd');
});

JobSchema.virtual("jobStart_formatted_weekday").get(function () {
  return DateTime.fromJSDate(this.jobStart).toUTC().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
});

JobSchema.virtual("jobEnd_formatted").get(function () {
  return DateTime.fromJSDate(this.jobEnd).toUTC().toFormat('yyyy-MM-dd');
});

JobSchema.virtual("jobEnd_formatted_weekday").get(function () {
  return DateTime.fromJSDate(this.jobEnd).toUTC().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
});

JobSchema.virtual('services_subtotal').get(function () {
  if (this.services.length <= 0) return 0;
  let sum = 0;
  this.services.forEach(service => {
    sum += parseFloat(service.price)
  })
  // return this.services.map(p => p.service.price).reduce((a, b) => a + b);
  return sum.toFixed(2)
});

JobSchema.virtual('materials_subtotal').get(function () {
  if (this.materials.length <= 0) return 0;
  let sum = 0;
  this.materials.forEach(material => {
    sum += (material.qty * material.price * (1 + (0.01 * this.markup)))
  })
  // return this.materials.map(material => (material.qty * material.material.price * (1 + (0.01 * this.markup)))).reduce((a, b) => a + b);
  return sum.toFixed(2)
});

JobSchema.virtual('total').get(function () {
  let result = 0;
  if (this.services.length <= 0 && this.materials.length <= 0) return 0;
  const materials = parseFloat(this.materials_subtotal)
  const services = parseFloat(this.services_subtotal)
  const tax = parseFloat(this.tax);
  // const sum = this.materials_subtotal + this.services_subtotal
  let sum = materials + services;
  if (sum === 0) return '0';
  result = parseFloat((sum * (1 + (0.01 * tax))))
  // console.log((sum * (1 + (0.01 * tax))).toFixed(2))
  // sub = parseFloat(this.materials_subtotal) + parseFloat(this.services_subtotal);
  return result.toFixed(2)
  // return su
})

module.exports = mongoose.model('Job', JobSchema);

