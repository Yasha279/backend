const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  createdAt: { type: Date, default: Date.now },
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
});

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  caption: String,
  hashtags: [String],
  media: {
    url: String,
    type: { type: String, enum: ['image', 'video'] }
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emoji: { type: String, enum: ["❤️", "😆", "😮", "😢", "😡"] }
  }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isReel: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
