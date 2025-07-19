const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true,
  },

  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  phone: {
    type: String,
  },

  password: {
    type: String,
    required: true,
  },

  avatar: {
    type: String,
    default: '',
  },

  bio: {
    type: String,
    maxlength: 300,
  },

  links: {
    type: [String],
  },

  // Social Graph
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

blockedUsers: [{
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  blockedAt: { type: Date, default: Date.now }
}],

  // Post interactions
  likedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],

  bookmarkedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],

 savedStories: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Story'
}],
isBlocked: {
  type: Boolean,
  default: false
},

  // Messaging
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message' // For 1-1 and group messages
  }],

  // Notifications
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],

  // Settings
  isPrivate: {
    type: Boolean,
    default: false,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

  // Tokens for reset/verify
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verifyEmailToken: String,
  verifyEmailExpires: Date,
emailVerificationCode: String,
emailVerificationCodeExpires: Date,
resetPasswordCode: String,
resetPasswordCodeExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', userSchema);
