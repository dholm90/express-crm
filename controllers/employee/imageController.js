const sharp = require('sharp');
const crypto = require('crypto');
const Image = require('../../models/image');
const Quote = require('../../models/quote');
const Job = require('../../models/job');
const Invoice = require('../../models/invoice');
const async = require('async');
const { uploadFile, deleteFile, getObjectSignedUrl } = require('../../utils/s3');


const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

// Get image list
exports.image_list = (req, res, next) => {
  async.parallel(
    {
      images(callback) {
        Image.find({ business: req.user.business }).exec(callback)
      },
      unusedImages(callback) {
        Image.find({
          business: req.user.business,
          quote: null,
          invoice: null,
          job: null
        }).exec(callback);
      }
    }, async (err, results) => {
      if (err) {
        return next(err)
      }

      for (let image of results.images) {
        image.imageUrl = await getObjectSignedUrl(image.imageName);
      }
      for (let image of results.unusedImages) {
        image.imageUrl = await getObjectSignedUrl(image.imageName);
      }
      res.render('dashboard/image-list', {
        title: 'Images',
        parent_page: 'Images',
        layout: './layouts/dashboard',
        images: results.images,
        unused: results.unusedImages
      })
    }
  )
}

// Get one image
exports.image_detail = async (req, res, next) => {
  const image = await Image.findOne({ _id: req.params.id, business: req.user.business });

  image.imageUrl = await getObjectSignedUrl(image.imageName);

  res.render('dashboard/image-detail', {
    title: `Image: ${image.originalName}`,
    parent_page: 'Images',
    layout: './layouts/dashboard',
    image
  })
}

exports.permanently_delete = async (req, res, next) => {
  const image = await Image.findOne({ _id: req.params.id, business: req.user.business });

  await deleteFile(image.imageName);
  await Image.deleteOne({ business: req.user.business, _id: req.params.id });
  res.redirect('/dashboard/image-list')
}

// Create Image
exports.upload_images = (req, res, next) => {
  Quote.findOne({ _id: req.params.id, business: req.user.business }).exec(async (err, quote) => {
    for (let file of req.files) {
      const imgName = generateFileName();
      const fileBuffer = await sharp(file.buffer)
        .flatten({ background: { r: 255, g: 255, b: 255, alpha: 255 } })
        .resize({ width: 1080, fit: "contain" })
        .toFormat("jpeg", { mozjpeg: true })
        .toBuffer();
      uploadFile(fileBuffer, imgName, file.mimetype)
      const imageData = await new Image({
        originalName: file.originalname,
        imageName: imgName,
        business: req.user.business,
        createdBy: req.user._id,
        quote: req.params.id
      }).save()
      quote.images.push(imageData)
    }
    quote.save()
    res.redirect(quote.url)
  })
}

// Delete Image
exports.delete_image = async (req, res, next) => {
  const image = await Image.findById(req.params.imageid);
  const quote = await Quote.findOne({ _id: req.params.quoteid, business: req.user.business }).populate('images').exec();

  image.quote = null;
  await image.save();
  // await deleteFile(image.imageName);
  await Quote.updateOne({ _id: req.params.quoteid, business: req.user.business }, { $pull: { 'images': req.params.imageid } });
  // await Job.updateOne({ _id: quote.jobid, business: req.user.business }, { $pull: { 'images': req.params.imageid } });
  // await Invoice.updateOne({ _id: req.params.invoiceid, business: req.user.business }, { $pull: { 'images': req.params.imageid } });
  // await Image.deleteOne({ _id: req.params.imageid });
  res.redirect(`${quote.url}#image-list`)
}


// Create Image (job)
exports.upload_images_job = (req, res, next) => {
  Job.findOne({ _id: req.params.id, business: req.user.business }).exec(async (err, job) => {
    for (let file of req.files) {
      const imgName = generateFileName();
      const fileBuffer = await sharp(file.buffer)
        .resize({ width: 1080, fit: "contain" })
        .toFormat("jpeg", { mozjpeg: true })
        .toBuffer();
      uploadFile(fileBuffer, imgName, file.mimetype)
      const imageData = await new Image({
        originalName: file.originalname,
        imageName: imgName,
        business: req.user.business,
        createdBy: req.user._id,
        job: req.params.id
      }).save()
      job.images.push(imageData)
    }
    job.save()
    res.redirect(job.url)
  })
}

// Delete Image (job)
exports.delete_image_job = async (req, res, next) => {
  const image = await Image.findById(req.params.imageid);
  const job = await Job.findOne({ _id: req.params.jobid, business: req.user.business });
  image.job = null;
  await image.save();
  // await deleteFile(image.imageName);
  // await Quote.updateOne({ _id: req.params.quoteid, business: req.user.business }, { $pull: { 'images': req.params.imageid } });
  await Job.updateOne({ _id: req.params.jobid, business: req.user.business }, { $pull: { 'images': req.params.imageid } });
  // await Invoice.updateOne({ _id: req.params.invoiceid, business: req.user.business }, { $pull: { 'images': req.params.imageid } });
  // await Image.deleteOne({ _id: req.params.imageid });

  res.redirect(`${job.url}#image-list`)
}


// Create Image (invoice)
exports.upload_images_invoice = (req, res, next) => {
  Invoice.findOne({ _id: req.params.id, business: req.user.business }).exec(async (err, invoice) => {
    for (let file of req.files) {
      const imgName = generateFileName();
      const fileBuffer = await sharp(file.buffer)
        .resize({ width: 1080, fit: "contain" })
        .toFormat("jpeg", { mozjpeg: true })
        .toBuffer();
      uploadFile(fileBuffer, imgName, file.mimetype)
      const imageData = await new Image({
        originalName: file.originalname,
        imageName: imgName,
        business: req.user.business,
        createdBy: req.user._id,
        invoice: req.params.id
      }).save()
      invoice.images.push(imageData)
    }
    invoice.save()
    res.redirect(invoice.url)
  })
}

// Delete Image (invoice)
exports.delete_image_invoice = async (req, res, next) => {
  const image = await Image.findById(req.params.imageid);
  const invoice = await Invoice.findOne({ _id: req.params.invoiceid, business: req.user.business }).populate('images').exec();

  image.invoice = null;
  await image.save();
  // await deleteFile(image.imageName);
  // await Quote.updateOne({ _id: req.params.quoteid, business: req.user.business }, { $pull: { 'images': req.params.imageid } });

  // await Job.updateOne({ _id: req.params.jobid, business: req.user.business }, { $pull: { 'images': req.params.imageid } });
  await Invoice.updateOne({ _id: req.params.invoiceid, business: req.user.business }, { $pull: { 'images': req.params.imageid } });

  // await Image.deleteOne({ _id: req.params.imageid });
  res.redirect(`${invoice.url}#image-list`)
}