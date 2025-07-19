const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storyStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "stories",
    resource_type: "auto", 
    allowed_formats: ["jpg", "png", "jpeg", "mp4"]
  },
});

module.exports = multer({ storage: storyStorage });
