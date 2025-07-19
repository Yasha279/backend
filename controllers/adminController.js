const User = require("../models/User");
const Post = require("../models/Post");
const Story = require("../models/Story");

// 🔍 Get All Users
exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
};

// 🚫 Block/Unblock User
exports.toggleBlockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.json({ message: user.isBlocked ? "User blocked" : "User unblocked" });
};

// ❌ Delete Post
exports.deletePostByAdmin = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  await post.deleteOne();
  res.json({ message: "Post deleted by admin" });
};

// ❌ Delete Story
exports.deleteStoryByAdmin = async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ message: "Story not found" });

  await story.deleteOne();
  res.json({ message: "Story deleted by admin" });
};

// 🛡️ Promote/Demote Admin
exports.toggleAdminRole = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = user.role === "admin" ? "user" : "admin";
  await user.save();

  res.json({ message: `User role changed to ${user.role}` });
};

// 📊 Platform Stats
exports.getPlatformStats = async (req, res) => {
  const users = await User.countDocuments();
  const posts = await Post.countDocuments();
  const stories = await Story.countDocuments();

  res.json({ users, posts, stories });
};
exports.deleteAnyPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    await post.deleteOne();
    res.json({ message: "Post deleted successfully by admin" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteAnyStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    await story.deleteOne();
    res.json({ message: "Story deleted successfully by admin" });
  } catch (err) {
    console.error("Delete story error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getPlatformStats = async (req, res) => {
  try {
    const [users, posts, stories] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Story.countDocuments()
    ]);

    res.json({
      totalUsers: users,
      totalPosts: posts,
      totalStories: stories
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};