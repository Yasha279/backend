const Post = require("../models/Post");
const User = require("../models/User");
const extractHashtags = (caption = "") => {
  return caption.match(/#\w+/g) || [];
};

// Create Post
exports.createPost = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "File not received. Check 'media' field." });
    }

    const { caption, isReel } = req.body;
    const hashtags = caption?.match(/#\w+/g) || [];

    const media = {
      url: req.file.path,
      type: req.file.mimetype.startsWith("video") ? "video" : "image"
    };

    const post = await Post.create({
      user: req.user._id,
      caption,
      hashtags,
      media,
      isReel
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("CREATE POST ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Feed
exports.getFeed = async (req, res) => {
  const me = await User.findById(req.user._id);
  const posts = await Post.find({
    $or: [
      { user: { $in: me.following } },
      { user: req.user._id }
    ]
  })
  .populate("user", "name username avatar")
  .sort({ createdAt: -1 });

  res.json(posts);
};
exports.getUserFeedById = async (req, res) => {
  const { userId } = req.params;

  const targetUser = await User.findById(userId);
  const me = await User.findById(req.user._id);

  if (!targetUser) return res.status(404).json({ message: "User not found" });

  const blockedYou = targetUser.blockedUsers?.some(b => b.user?.equals(req.user._id) || b.equals?.(req.user._id));
  const youBlocked = me.blockedUsers?.some(b => b.user?.equals(userId) || b.equals?.(userId));

  if (blockedYou || youBlocked) {
    return res.status(403).json({ message: "Access denied. You are blocked." });
  }

  const isPrivate = targetUser.isPrivate && !targetUser.followers.includes(req.user._id) && !targetUser._id.equals(req.user._id);

  if (isPrivate) {
    return res.status(403).json({ message: "This profile is private." });
  }

  const posts = await Post.find({ user: userId })
    .populate("user", "name username avatar")
    .sort({ createdAt: -1 });

  res.json(posts);
};
exports.getUserPostsOnly = async (req, res) => {
  const { userId } = req.params;

  const targetUser = await User.findById(userId);
  const me = await User.findById(req.user._id);

  if (!targetUser) return res.status(404).json({ message: "User not found" });

  const blockedYou = targetUser.blockedUsers?.some(b => b.user?.equals(req.user._id) || b.equals?.(req.user._id));
  const youBlocked = me.blockedUsers?.some(b => b.user?.equals(userId) || b.equals?.(userId));

  if (blockedYou || youBlocked) {
    return res.status(403).json({ message: "Access denied. You are blocked." });
  }

  const isPrivate = targetUser.isPrivate && !targetUser.followers.includes(req.user._id) && !targetUser._id.equals(req.user._id);
  if (isPrivate) {
    return res.status(403).json({ message: "This profile is private." });
  }

  const posts = await Post.find({ user: userId, isReel: false })
    .populate("user", "name username avatar")
    .sort({ createdAt: -1 });

  res.json(posts);
};
exports.getUserReelsOnly = async (req, res) => {
  const { userId } = req.params;

  const targetUser = await User.findById(userId);
  const me = await User.findById(req.user._id);

  if (!targetUser) return res.status(404).json({ message: "User not found" });

  const blockedYou = targetUser.blockedUsers?.some(b => b.user?.equals(req.user._id) || b.equals?.(req.user._id));
  const youBlocked = me.blockedUsers?.some(b => b.user?.equals(userId) || b.equals?.(userId));

  if (blockedYou || youBlocked) {
    return res.status(403).json({ message: "Access denied. You are blocked." });
  }

  const isPrivate = targetUser.isPrivate && !targetUser.followers.includes(req.user._id) && !targetUser._id.equals(req.user._id);
  if (isPrivate) {
    return res.status(403).json({ message: "This profile is private." });
  }

  const reels = await Post.find({ user: userId, isReel: true })
    .populate("user", "name username avatar")
    .sort({ createdAt: -1 });

  res.json(reels);
};

// Like / Unlike
exports.toggleLike = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const liked = post.likes.includes(req.user._id);
  if (liked) {
    post.likes.pull(req.user._id);
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();
  res.json({ message: liked ? "Unliked" : "Liked" });
};

// Save / Unsave
exports.toggleSave = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const user = await User.findById(req.user._id);
  const alreadySaved = user.bookmarkedPosts.includes(post._id);

  if (alreadySaved) {
    user.bookmarkedPosts.pull(post._id);
    post.savedBy.pull(user._id);
  } else {
    user.bookmarkedPosts.push(post._id);
    post.savedBy.push(user._id);
  }

  await user.save();
  await post.save();

  res.json({ message: alreadySaved ? "Post unsaved" : "Post saved" });
};

// Comment
exports.comment = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  post.comments.push({
    user: req.user._id,
    text: req.body.text
  });

  await post.save();
  res.json({ message: "Comment added" });
};

// Delete Post
exports.deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || !post.user.equals(req.user._id))
    return res.status(403).json({ message: "Not allowed" });

  await post.deleteOne();
  res.json({ message: "Post deleted" });
};

// Reels
exports.getReels = async (req, res) => {
  const reels = await Post.find({ isReel: true })
    .populate("user", "name username avatar")
    .sort({ createdAt: -1 });

  res.json(reels);
};

exports.deleteComment = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  if (!comment.user.equals(req.user._id) && !post.user.equals(req.user._id)) {
    return res.status(403).json({ message: "Not allowed to delete this comment" });
  }

  comment.remove();
  await post.save();
  res.json({ message: "Comment deleted" });
};

exports.reactToPost = async (req, res) => {
  const { emoji } = req.body;
  const allowed = ["❤️", "😆", "😮", "😢", "😡"];
  if (!allowed.includes(emoji)) return res.status(400).json({ message: "Invalid emoji" });

  const post = await Post.findById(req.params.id);
  if (!post) return res.stat
  us(404).json({ message: "Post not found" });

  const existing = post.reactions.find(r => r.user.equals(req.user._id));
  if (existing) {
    existing.emoji = emoji; // update emoji
  } else {
    post.reactions.push({ user: req.user._id, emoji });
  }

  await post.save();
  res.json({ message: "Reaction updated" });
};
exports.removeReaction = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  post.reactions = post.reactions.filter(r => !r.user.equals(req.user._id));
  await post.save();

  res.json({ message: "Reaction removed" });
};
