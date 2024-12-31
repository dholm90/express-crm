$(document).ready(function () {

  // Table with dates
  $('table.display-dates').DataTable({
    dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
      "<'row table-responsive'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
    columnDefs: [
      {
        targets: [4, 5],
        render: DataTable.render.date(),
      },
    ],
  });

  // Table with hours
  $('table.display-hours').DataTable({
    dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
      "<'row table-responsive'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
    columnDefs: [
      {
        targets: [2],
        render: DataTable.render.date(),
      },
    ],
  });

  // Standard table
  $('table.display').DataTable({
    dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
      "<'row table-responsive'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
  });

  // Table with exports
  $('table.display-export').DataTable({
    dom: "<'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>" +
      "<'row table-responsive'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",

    buttons: {
      buttons: [
        { extend: 'csv', className: 'btn btn-primary' },
        { extend: 'excel', className: 'btn btn-primary' }
      ],
      dom: {
        button: {
          className: 'btn'
        }
      }
    },
  });

  // Table with hours
  $('table.display-hours-export').DataTable({
    dom: "<'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>" +
      "<'row table-responsive'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
    columnDefs: [
      {
        targets: [2],
        render: DataTable.render.date(),
      },
    ],
    buttons: {
      buttons: [
        { extend: 'csv', className: 'btn btn-primary' },
        { extend: 'excel', className: 'btn btn-primary' }
      ],
      dom: {
        button: {
          className: 'btn'
        }
      }
    },
  });

  // Table with exports and dates
  $('table.display-dates-export').DataTable({
    dom: "<'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>" +
      "<'row table-responsive'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
    columnDefs: [
      {
        targets: [4, 5],
        render: DataTable.render.date(),
      },
    ],
    buttons: {
      buttons: [
        { extend: 'csv', className: 'btn btn-primary' },
        { extend: 'excel', className: 'btn btn-primary' }
      ],
      dom: {
        button: {
          className: 'btn'
        }
      }
    },
  });
  $('.dt-buttons').removeClass('btn-group')
});