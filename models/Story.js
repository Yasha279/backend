const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema({
  question: String,
  options: [String],
  responses: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    optionIndex: Number
  }]
}, { _id: false });

const questionSchema = new mongoose.Schema({
  text: String,
  answers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    answer: String
  }]
}, { _id: false });

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  media: {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true }
  },

  caption: { type: String },

  poll: pollSchema,
  question: questionSchema,

  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  isHighlight: {
  type: Boolean,
  default: false
},

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400
  }
});

module.exports = mongoose.model("Story", storySchema);
