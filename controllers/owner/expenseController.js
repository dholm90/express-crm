const sharp = require('sharp');
const crypto = require('crypto');
const Expense = require('../../models/expense');
const Invoice = require('../../models/invoice');
const User = require('../../models/user')
const async = require('async');
const { uploadFile, deleteFile, getObjectSignedUrl } = require('../../utils/s3');
const { validationResult, body } = require('express-validator');


const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

// Get expense List
exports.expense_list = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ business: req.user.business }).populate([{ path: 'createdBy', model: User }])
    for (let expense of expenses) {
      if (expense.imageName) {
        expense.imageUrl = await getObjectSignedUrl(expense.imageName);
      }

    }
    await res.render('dashboard/expense-list', {
      title: 'Expenses',
      parent_page: 'Expenses',
      layout: './layouts/dashboard',
      expenses
    })

  } catch (err) {
    return next(err)
  }
}

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
        res.redirect(invoice.url)
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
          res.redirect(invoice.url)
        }
        if (req.file.mimetype == 'application/pdf') {
          const file = req.file;// for (let file of req.files) {
          const imgName = generateFileName();
          // const fileBuffer = await sharp(file.buffer)
          //   .resize({ width: 1080, fit: "contain" })
          //   .toFormat("jpeg", { mozjpeg: true })
          //   .toBuffer();
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
          res.redirect(invoice.url)
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
        res.redirect(invoice.url)
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
  res.redirect(`${invoice.url}#expenses`)
}

// Mark Paid
exports.toggle_paid = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ business: req.user.business, _id: req.params.id });
    expense.isPaid = !expense.isPaid
    expense.save()
    res.redirect('back')
  } catch (err) {
    return next(err)
  }
}