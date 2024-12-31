const Post = require('../../models/post');
const async = require('async');
const { body, validationResult } = require("express-validator");
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');

// Display list of posts client
exports.post_list_client = (req, res, next) => {
  Post.find({ isPublished: true })
    .sort({ createdAt: 'desc' })
    .exec(function (err, post_list) {
      if (err) {
        return next(err)
      }
      res.render('blog/index', {
        title: 'Blog',
        layout: './layouts/full-width',
        post_list
      })
    })
}
// Display post detail client
exports.post_detail_client = (req, res, next) => {
  Post.findOne({ slug: req.params.slug }).exec(function (err, post) {
    if (err) {
      return next(err)
    }
    res.render('blog/post', {
      title: post.title,
      layout: './layouts/full-width',
      post
    })
  })
}

// Display list of posts dashboard
exports.post_list_dashboard = async (req, res, next) => {
  async.parallel(
    {
      post_unpublished(callback) {
        Post.find({ isPublished: false })
          .sort({ createdAt: 'desc' })
          .exec(callback)
      },
      post_published(callback) {
        Post.find({ isPublished: true })
          .sort({ createdAt: 'desc' })
          .exec(callback)
      }
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      res.render('admin/post-list', {
        title: 'Blog',
        layout: './layouts/admin',
        published_posts: results.post_published,
        unpublished_posts: results.post_unpublished
      })
    }
  )
}

// Display post detail dashboard
exports.post_detail_dashboard = (req, res, next) => {
  Post.findById(req.params.id).exec(function (err, post) {
    if (err) {
      console.log('err')
      return next(err)
    }
    if (post == null) {
      console.log('Post Not Found')
      return next(err)
    }
    res.render('admin/post-detail', {
      title: 'Post',
      layout: './layouts/admin',
      post
    })
  })
}

// Create post GET
exports.post_create_get = (req, res, next) => {
  let post = undefined;
  res.render('admin/post-form', {
    title: 'Create Blog Post',
    layout: './layouts/admin',
    post
  })
}

// Create post POST
exports.post_create_post = [
  body('title')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Title must be specified.')
    .custom((value, { req }) => {
      return new Promise((resolve, reject) => {
        Post.findOne({ title: req.body.title }, function (err, post) {
          if (err) {
            reject(new Error('Server Error'))
          }
          if (Boolean(post)) {
            reject(new Error('Title already in use'))
          }
          resolve(true)
        });
      });
    })
    .withMessage('Title must be unique'),
  body('metaDescription')
    .trim()
    .escape(),
  body('metaKeywords')
    .trim()
    .escape(),
  body('tinymce_content', 'Content must be specifed')
    .trim()
    .isLength({ min: 1 })
    .customSanitizer(value => {
      return sanitizeHtml(value)
    }),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const post = undefined;
      console.log(errors)
      res.render('admin/post-form', {
        title: 'Create Blog Post',
        layout: './layouts/admin',
        post,
        errors: errors.array()
      })
      return
    }
    const postData = new Post({
      _id: req.params.id,
      imgUrl: req.file.path,
      imgName: req.file.originalname,
      title: req.body.title,
      content: req.body.tinymce_content,
      metaDescription: req.body.metaDescription,
      metaKeywords: req.body.metaKeywords,
      isPublished: req.body.isPublished ? true : false
    }).save(err => {
      if (err) {
        res.redirect('/admin');
        return next(err);
      }
      res.redirect('/admin/post-list')
    })
  }
]

// Delete post GET
exports.post_delete_get = (req, res, next) => {
  Post.find({ title: req.params.title }).exec(function (err, post) {
    if (err) {
      return next(err)
    }
    res.render('admin/post-delete', {
      title: 'Delete Blog Post',
      layout: './layouts/admin',
      post
    })
  })
}

// Delete post POST
exports.post_delete_post = (req, res, next) => {
  Post.findByIdAndRemove(req.params.id, (err, post) => {
    if (err) {
      return next(err)
    }
    if (post.imgUrl) {
      fs.unlink(post.imgUrl, function () {
        return next()
      })
    }
    res.redirect('/admin/post-list')

  })
}

// Update post GET
exports.post_update_get = (req, res, next) => {
  Post.find({ title: req.params.title }).exec(function (err, post) {
    if (err) {
      return next(err)
    }
    res.render('admin/post-form', {
      title: 'Update Blog Post',
      layout: './layouts/admin',
      post
    })
  })
}

// Update post POST
exports.post_update_post = [
  body('title')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Title must be specified')
    .custom((value, { req }) => {
      return new Promise((resolve, reject) => {
        Post.findOne({ title: req.body.title }, function (err, post) {
          if (err) {
            reject(new Error('Server Error'))
          }
          if (Boolean(post)) {
            if (req.params.id == post._id) {
              resolve(true)
            } else {
              reject(new Error('Title already in use'))
            }
          }
          resolve(true)
        });
      });
    })
    .withMessage('Title already in use'),
  body('metaDescription')
    .trim()
    .escape(),
  body('metaKeywords')
    .trim()
    .escape(),
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
        post: postData,
        errors: errors.array()
      })
      return
    }
    if (req.file) {
      // process image here
      const postData = new Post({
        _id: req.params.id,
        title: req.body.title,
        imgUrl: req.file.path,
        imgName: req.file.originalname,
        content: req.body.tinymce_content,
        metaDescription: req.body.metaDescription,
        metaKeywords: req.body.metaKeywords,
        isPublished: req.body.isPublished ? true : false
      })


      let oldPost = undefined;
      Post.findById(req.params.id).exec((err, old) => {
        if (err) {
          return next(err)
        }
        oldPost = old;
      });
      Post.findByIdAndUpdate(req.params.id, postData, {}, (err, thepost) => {
        if (err) {
          return next(err);
        }
        if (oldPost.imgUrl) {
          // if (oldPost.imgUrl !== postData.imgUrl) {
          fs.unlink(oldPost.imgUrl, function () {
            return next()
          })
          // }
        }
        console.log('post update with image')
        res.redirect(thepost.url);
      });
    } else {
      // process all other fields
      const postData = new Post({
        _id: req.params.id,
        title: req.body.title,
        content: req.body.tinymce_content,
        metaDescription: req.body.metaDescription,
        metaKeywords: req.body.metaKeywords,
        isPublished: req.body.isPublished ? true : false
      })

      Post.findByIdAndUpdate(req.params.id, postData, {}, (err, thepost) => {
        if (err) {
          return next(err);
        }
        console.log('post update without image')
        res.redirect(thepost.url);
      })
    }
  }
]



