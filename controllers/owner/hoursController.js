const Job = require('../../models/job');
const HourLog = require('../../models/hourLog');
const User = require('../../models/user')
const { validationResult, body } = require('express-validator');

// Get Hours List
exports.hours_list = async (req, res, next) => {
  try {
    const hours = await HourLog.find({ business: req.user.business }).populate([{ path: 'employee', model: User }]).sort({ createdAt: 'desc' });
    await res.render('dashboard/hours-list', {
      title: 'Hours',
      parent_page: 'Hours',
      layout: './layouts/dashboard',
      hours
    })
  } catch (err) {
    return next(err)
  }


}

// Create Hour Log
exports.log_hours = [
  body('hours')
    .trim()
    .isNumeric()
    .escape(),
  async (req, res, next) => {
    const job = await Job.findOne({ _id: req.params.id, business: req.user.business })
    const HourLogData = await new HourLog({
      employee: req.body.employee,
      totalHours: req.body.hours,
      date: req.body.date,
      business: req.user.business
    }).save()
    job.loggedHours.push(HourLogData)
    job.save()
    res.redirect(job.url)
  }
]

// Delete Hour Log
exports.remove_log = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, business: req.user.business });

    await Job.updateOne({ _id: req.params.id, business: req.user.business }, {
      $pull: {
        'loggedHours': req.params.logId,
      }
    });
    await HourLog.deleteOne({ _id: req.params.logId, business: req.user.business })
    await res.redirect(job.url);
  } catch (err) {
    console.log(err)
    return next(err)
  }
}

// Mark Paid
exports.toggle_paid = async (req, res, next) => {
  try {
    const hourLog = await HourLog.findOne({ business: req.user.business, _id: req.params.id });
    hourLog.isPaid = !hourLog.isPaid
    hourLog.save()
    res.redirect('back')
  } catch (err) {
    return next(err)
  }
}


