const Quote = require('../../models/quote')
const Job = require('../../models/job');
const User = require('../../models/user');
const Client = require('../../models/client')
const Material = require('../../models/material')
const Service = require('../../models/service');
const Business = require('../../models/business');
const Invoice = require('../../models/invoice');
const phoneHelper = require('../../utils/formatPhone');
const async = require('async');
const { client_list } = require('./clientController');

getTotal = async (req, res, next, subMonth) => {
  let d = new Date()
  d.setMonth(d.getMonth() - subMonth);
  const lastMonth = d.getMonth() + 1;
  const invoices = await Invoice.find({
    business: req.user.business,
    "$expr": { "$eq": [{ "$month": "$completedOn" }, lastMonth] }
  }).populate([
    { path: 'materials.material', model: Material },
    { path: 'services.service', model: Service },
  ])
  let tally = 0;
  for (let invoice of invoices) {

    tally += await invoice.total;
  }
  // console.log(tally)
  return tally
}

exports.dashboard = (req, res, next) => {
  async.parallel(
    {
      quotes(callback) {
        Quote.find({ business: req.user.business }).exec(callback);
      },
      countQuotes(callback) {
        Quote.find({ business: req.user.business }).countDocuments(callback);
      },
      countActiveQuotes(callback) {
        Quote.find({ business: req.user.business, isActive: true }).countDocuments(callback)
      },
      countArchivedQuotes(callback) {
        Quote.find({ business: req.user.business, isActive: false }).countDocuments(callback)
      },
      jobs(callback) {
        Job.find({ business: req.user.business }).exec(callback);
      },
      countJobs(callback) {
        Job.find({ business: req.user.business }).countDocuments(callback);
      },
      countActiveJobs(callback) {
        Job.find({ business: req.user.business, isActive: true }).countDocuments(callback)
      },
      countArchivedJobs(callback) {
        Job.find({ business: req.user.business, isActive: false }).countDocuments(callback)
      },
      invoices(callback) {
        Invoice.find({ business: req.user.business }).exec(callback);
      },
      countInvoices(callback) {
        Invoice.find({ business: req.user.business }).countDocuments(callback);
      },
      countActiveInvoices(callback) {
        Invoice.find({ business: req.user.business, isActive: true }).countDocuments(callback)
      },
      countArchivedInvoices(callback) {
        Invoice.find({ business: req.user.business, isActive: false }).countDocuments(callback)
      },
      countClients(callback) {
        Client.find({ business: req.user.business }).countDocuments(callback);
      },
      countEmployees(callback) {
        User.find({ business: req.user.business }).countDocuments(callback);
      },
      countMaterials(callback) {
        Material.find({ business: req.user.business }).countDocuments(callback);
      },
      countServices(callback) {
        Service.find({ business: req.user.business }).countDocuments(callback)
      },
      async getData() {

        let lastTwelveMonths = [];
        let lastTwelveTotals = [];
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        var date = new Date();
        var currentMonth = date.getMonth();
        var currentYear = date.getFullYear();

        for (i = 0; i < 12; i++) {
          if (currentMonth == - 1) {
            currentMonth = 11;
            date.setFullYear(parseInt(currentYear) - 1);
            currentYear = date.getFullYear();
          }
          lastTwelveMonths.push(monthNames[currentMonth] + " " + currentYear)
          lastTwelveTotals.push(await getTotal(req, res, next, i))
          currentMonth--;
        }
        // console.log(lastTwelveMonths)
        lastTwelveMonths.reverse()
        lastTwelveTotals.reverse()
        const thisMonthTotal = await getTotal(req, res, next, 0);
        const lastMonthTotal = await getTotal(req, res, next, 1);
        const percentageDifference = (((thisMonthTotal - lastMonthTotal) / ((thisMonthTotal + lastMonthTotal) / 2)) * 100).toFixed(2)
        const data = {
          lastTwelveMonths,
          lastTwelveTotals,
          thisMonthTotal,
          lastMonthTotal,
          percentageDifference
        }
        // console.log(await data)
        return data

      },
      async topPerformers() {
        // Get the top 5 employees based on invoice totals archived this month

        // Get invoice totals for each employee
        // -> 

        const invoices = await Invoice.find({ business: req.user.business, isActive: false }).populate([
          { path: 'materials.material', model: Material },
          { path: 'services.service', model: Service },
          { path: 'employees', model: User },
        ]).exec();
        let arr = []
        for (let invoice of invoices) {
          for (let employee of invoice.employees) {
            arr.push({ value: invoice.total, name: employee.name, id: employee._id })
          }
        }

        var res = Object.values(arr.reduce((acc, { value, ...r }) => {
          var key = Object.entries(r).join('-');
          acc[key] = (acc[key] || { ...r, value: 0 });
          return (acc[key].value += value, acc);
        }, {}));

        return res

      },
      async thisMonth() {
        const thisMonth = new Date().getMonth() + 1;
        const invoice = await Invoice.find({
          business: req.user.business,
          "$expr": { "$eq": [{ "$month": "$completedOn" }, thisMonth] }
        }).populate([
          { path: 'materials.material', model: Material },
          { path: 'services.service', model: Service },
        ])
        return invoice
      },
      async lastMonth() {
        let d = new Date()
        d.setMonth(d.getMonth() - 1);
        const lastMonth = d.getMonth() + 1;
        const invoice = await Invoice.find({
          business: req.user.business,
          "$expr": { "$eq": [{ "$month": "$completedOn" }, lastMonth] }
        }).populate([
          { path: 'materials.material', model: Material },
          { path: 'services.service', model: Service },
        ])
        return invoice
      },

      // getTotal: getTotal.bind(null, subMonth),


    }, async (err, results) => {
      if (err) {
        console.log(err)
        return next(err)
      }

      res.render('dashboard', {
        title: 'Dashboard',
        parent_page: 'Dashboard',
        layout: './layouts/dashboard-home',
        results
      })
    }
  )
}