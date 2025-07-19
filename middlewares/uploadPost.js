// middlewares/uploadPost.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "posts",
    resource_type: "auto",
    allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov"]
  },
});

const uploadPost = multer({ storage: postStorage });

module.exports = uploadPost;
