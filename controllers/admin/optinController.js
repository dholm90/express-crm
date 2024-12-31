const OptIn = require('../../models/optIn')

exports.optin_list = async (req, res, next) => {
  const optin_list = await OptIn.find();

  await res.render('admin/optin-list', {
    title: 'Admin | Opt In List',
    layout: './layouts/admin',
    optin_list
  })
}