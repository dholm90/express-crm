const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');
const service = require('./service');
const User = require('./user');
const async = require('async')

const InvoiceSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  employees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  loggedHours: [{ type: Schema.Types.ObjectId, ref: 'HourLog' }],
  signatureName: { type: String },
  signatureURL: { type: String },
  title: { type: String, required: true },
  jobStart: { type: Date, required: true },
  jobEnd: { type: Date, required: true },
  completedOn: { type: Date, default: null },
  client: { type: Schema.Types.ObjectId, ref: 'Client' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  tax: { type: Number },
  markup: { type: Number },
  images: [{ type: Schema.Types.ObjectId, ref: 'Image' }],
  sessionUrl: { type: String, default: null },
  stripeProduct: { type: String, default: null },
  paymentLink: { type: String, default: null },
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
  ],
  expenses: [{ type: Schema.Types.ObjectId, ref: 'Expense' }]
}, {
  timestamps: true
})

InvoiceSchema.set('toObject', { getters: true, virtuals: true })
InvoiceSchema.set('toJSON', { virtuals: true })

InvoiceSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/dashboard/invoice/${this._id}`;
});

InvoiceSchema.virtual("url_employee").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/employee/invoice/${this._id}`;
});

InvoiceSchema.virtual("jobStart_formatted").get(function () {
  return DateTime.fromJSDate(this.jobStart).toUTC().toFormat('yyyy-MM-dd');
});

InvoiceSchema.virtual("jobStart_formatted_weekday").get(function () {
  return DateTime.fromJSDate(this.jobStart).toUTC().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
});

InvoiceSchema.virtual("jobEnd_formatted").get(function () {
  return DateTime.fromJSDate(this.jobEnd).toUTC().toFormat('yyyy-MM-dd');
});

InvoiceSchema.virtual("jobEnd_formatted_weekday").get(function () {
  return DateTime.fromJSDate(this.jobEnd).toUTC().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
});

InvoiceSchema.virtual('services_subtotal').get(function () {
  if (this.services.length <= 0) return 0;
  let sum = 0;
  this.services.forEach(service => {
    sum += parseFloat(service.price)
  })
  // return this.services.map(p => p.service.price).reduce((a, b) => a + b);
  return sum.toFixed(2)
});

InvoiceSchema.virtual('expenses_subtotal').get(function () {
  if (this.expenses.length <= 0) return 0;
  let sum = 0;
  this.expenses.forEach(expense => {
    sum += parseFloat(expense.price)
  })
  return sum.toFixed(2)
})

InvoiceSchema.virtual('materials_subtotal').get(function () {
  if (this.materials.length <= 0) return 0;
  let sum = 0;
  this.materials.forEach(material => {
    sum += (material.qty * material.price * (1 + (0.01 * this.markup)))
  })
  // return this.materials.map(material => (material.qty * material.material.price * (1 + (0.01 * this.markup)))).reduce((a, b) => a + b);
  return sum.toFixed(2)
});

InvoiceSchema.virtual('materials_no_markup').get(function () {
  if (this.materials.length <= 0) return 0;
  let sum = 0;
  this.materials.forEach(material => {
    sum += (material.qty * material.price)
  })
  // return this.materials.map(material => (material.qty * material.material.price * (1 + (0.01 * this.markup)))).reduce((a, b) => a + b);
  return parseFloat(sum.toFixed(2))
});

InvoiceSchema.virtual('tax_total').get(function () {
  let result = 0;
  if (this.services.length <= 0 && this.materials.length <= 0) return 0;
  const materials = parseFloat(this.materials_subtotal)
  const services = parseFloat(this.services_subtotal)
  const tax = parseFloat(this.tax);
  // const sum = this.materials_subtotal + this.services_subtotal
  let sum = materials + services;
  if (sum === 0) return '0';
  result = parseFloat((sum * (0.01 * tax)).toFixed(2))
  // console.log((sum * (1 + (0.01 * tax))).toFixed(2))
  // sub = parseFloat(this.materials_subtotal) + parseFloat(this.services_subtotal);
  return result
  // return su
})

InvoiceSchema.virtual('total').get(function () {
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
  return result
  // return su
})

InvoiceSchema.virtual('totalLoggedHours').get(async function () {
  let hours = 0;
  for (let log of this.loggedHours) {
    const employee = await User.findById(log.employee).exec()
    const rate = parseFloat(employee.hourlyRate);
    const totalHours = parseFloat(log.totalHours)
    let calc = rate * totalHours
    hours += parseFloat(calc)
  }
  return hours
})
InvoiceSchema.virtual('totalExpenses').get(function () {
  let expenses = 0;
  for (let expense of this.expenses) {
    expenses += parseFloat(expense.price)
  }
  return expenses
})
InvoiceSchema.virtual('profit').get(async function () {
  return this.total - (this.materials_no_markup * (1 + (0.01 * this.tax))) - await this.totalLoggedHours - this.totalExpenses
})

module.exports = mongoose.model('Invoice', InvoiceSchema);
