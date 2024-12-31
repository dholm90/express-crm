const sharp = require('sharp');
const crypto = require('crypto');
const Expense = require('../../models/expense');
const Invoice = require('../../models/invoice');
const async = require('async');
const { uploadFile, deleteFile, getObjectSignedUrl } = require('../../utils/s3');
const { validationResult, body } = require('express-validator');


const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

// Create Expense
exports.upload_expense = [
  body('title')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('price')
    .trim()
    .isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    Invoice.findOne({ _id: req.params.id, business: req.user.business }).exec(async (err, invoice) => {
      if (!errors.isEmpty()) {
        res.redirect(invoice.url_employee)
      }
      if (req.file) {
        if (req.file.mimetype == 'image/*') {
          const file = req.file;// for (let file of req.files) {
          const imgName = generateFileName();
          const fileBuffer = await sharp(file.buffer)
            .resize({ width: 1080, fit: "contain" })
            .toFormat("jpeg", { mozjpeg: true })
            .toBuffer();
          uploadFile(fileBuffer, imgName, file.mimetype)
          const expenseData = await new Expense({
            originalName: file.originalname,
            imageName: imgName,
            business: req.user.business,
            createdBy: req.user._id,
            invoice: req.params.id,
            title: req.body.title,
            price: req.body.price,
          }).save()
          invoice.expenses.push(expenseData)
          // }
          invoice.save()
          res.redirect(invoice.url_employee)
        }
        if (req.file.mimetype == 'application/pdf') {
          const file = req.file;// for (let file of req.files) {
          const imgName = generateFileName();
          uploadFile(file.buffer, imgName, file.mimetype)
          const expenseData = await new Expense({
            originalName: file.originalname,
            imageName: imgName,
            business: req.user.business,
            createdBy: req.user._id,
            invoice: req.params.id,
            title: req.body.title,
            price: req.body.price,
          }).save()
          invoice.expenses.push(expenseData)
          // }
          invoice.save()
          res.redirect(invoice.url_employee)
        }

      } else {
        const expenseData = await new Expense({
          business: req.user.business,
          createdBy: req.user._id,
          invoice: req.params.id,
          title: req.body.title,
          price: req.body.price,
        }).save()
        invoice.expenses.push(expenseData)
        // }
        invoice.save()
        res.redirect(invoice.url_employee)
      }
    })
  }
]

// Delete Expense (invoice)
exports.delete_expense = async (req, res, next) => {
  const expense = await Expense.findById(req.params.expenseid);
  const invoice = await Invoice.findOne({ _id: req.params.invoiceid, business: req.user.business }).populate('expenses').exec();
  await deleteFile(expense.imageName);
  await Invoice.updateOne({ _id: req.params.invoiceid, business: req.user.business }, { $pull: { 'expenses': req.params.expenseid } });
  await Expense.deleteOne({ business: req.user.business, _id: req.params.expenseid });
  res.redirect(`${invoice.url_employee}#expenses`)
}