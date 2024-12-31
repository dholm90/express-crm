const multer = require('multer');

var storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/webp" || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb("please upload only images");
  }
}
module.exports.upload = multer({ storage: storage, fileFilter: fileFilter })