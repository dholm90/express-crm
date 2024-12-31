const Doc = require('../../models/docs');
const async = require('async');
const { body, validationResult } = require("express-validator");
const sanitizeHtml = require('sanitize-html');


// Display list of docs client
exports.doc_list_client = (req, res, next) => {
  Doc.find({ isPublished: true })
    .sort({ createdAt: 'asc' })
    .exec(function (err, docs_list) {
      if (err) {
        console.log(err)
        return next(err)
      }
      res.render('docs', {
        title: 'Documentation',
        parent_page: 'None',
        layout: './layouts/docs',
        docs_list
      })
    })
}

// Display doc detail client
exports.doc_detail_client = (req, res, next) => {
  async.parallel(
    {
      docs_list(callback) {
        Doc.find({ isPublished: true }).sort({ createdAt: 'asc' }).exec(callback)
      },
      doc(callback) {
        Doc.findOne({ slug: req.params.slug }).exec(callback)
      }
    }, (err, results) => {
      res.render('docs/document', {
        title: results.doc.title,
        parent_page: results.doc.parent,
        layout: './layouts/docs',
        doc: results.doc,
        docs_list: results.docs_list
      })
    }
  )
}

// Deisplay doc list dashboard
exports.doc_list_dashboard = async (req, res, next) => {
  async.parallel(
    {
      doc_unpublished(callback) {
        Doc.find({ isPublished: false })
          .sort({ createdAt: 'desc' })
          .exec(callback)
      },
      doc_published(callback) {
        Doc.find({ isPublished: true })
          .sort({ createdAt: 'desc' })
          .exec(callback)
      }
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      res.render('admin/doc-list', {
        title: 'Docs',
        layout: './layouts/admin',
        published_docs: results.doc_published,
        unpublished_docs: results.doc_unpublished
      })
    }
  )
}
// Display doc detail dashboard
exports.doc_detail_dashboard = (req, res, next) => {
  Doc.findById(req.params.id).exec(function (err, doc) {
    if (err) {
      return next(err)
    }
    if (doc == null) {
      console.log('Post Not Found')
      return next(err)
    }
    res.render('admin/doc-form', {
      title: `Article: ${doc.title}`,
      layout: './layouts/admin',
      doc,

    })
  })
}

// Create doc GET
exports.doc_create_get = (req, res, next) => {
  let doc = undefined;
  res.render('admin/doc-form', {
    title: 'Create Documentation',
    layout: './layouts/admin',
    doc,

  })
}

// Create doc POST
exports.doc_create_post = [
  body('title')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Title must be specified.'),
  body('parent', 'Parent must be specified.')
    .trim()
    .isLength({ min: 1 }),
  body('tinymce_content', 'Content must be specifed')
    .trim()
    .isLength({ min: 1 })
    .customSanitizer(value => {
      return sanitizeHtml(value)
    }),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const doc = undefined;
      console.log(errors)
      res.render('admin/doc-form', {
        title: 'Create Documentation',
        layout: './layouts/admin',
        doc,
        errors: errors.array()
      })
      return
    }
    const docData = new Doc({
      _id: req.params.id,
      title: req.body.title,
      parent: req.body.parent,
      content: req.body.tinymce_content,
      isPublished: req.body.isPublished ? true : false
    }).save(err => {
      if (err) {
        return next(err);
      }
      res.redirect('/admin/doc-list')
    })
  }
]

// Delete doc POST
exports.doc_delete_post = (req, res, next) => {
  Post.findByIdAndRemove(req.params.id, (err, doc) => {
    if (err) {
      return next(err)
    }
    res.redirect('/admin/doc-list')

  })
}

// Update doc POST
exports.doc_update_post = [
  body('title')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Title must be specified'),
  body('tinymce_content', 'Content must be specifed')
    .trim()
    .isLength({ min: 1 })
    .customSanitizer(value => {
      return sanitizeHtml(value)
    }),
  (req, res, next) => {
    const errors = validationResult(req);




    if (!errors.isEmpty()) {
      // const post = undefined;
      console.log(errors)
      res.render('admin/post-detail', {
        title: 'Post',
        layout: './layouts/admin',
        doc: docData,
        errors: errors.array()
      })
      return
    }

    // process all other fields
    const docData = new Doc({
      _id: req.params.id,
      title: req.body.title,
      content: req.body.tinymce_content,
      isPublished: req.body.isPublished ? true : false
    })

    Doc.findByIdAndUpdate(req.params.id, docData, {}, (err, thedoc) => {
      if (err) {
        return next(err);
      }
      console.log('post update without image')
      res.redirect('/admin/doc-list');
    })
  }

]

exports.unpublish_all = async (req, res, next) => {
  const docs = await Doc.find();
  for (let doc of docs) {
    doc.isPublished = false;
    await doc.save()
  }
  return res.redirect('/admin/doc-list')
}

exports.publish_all = async (req, res, next) => {
  const docs = await Doc.find();
  for (let doc of docs) {
    doc.isPublished = true;
    await doc.save()
  }
  return res.redirect('/admin/doc-list')
}