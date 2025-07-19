const User = require("../models/User");
const Report = require("../models/Report");
// Get own profile
exports.getMyProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
};
const isUserBlocked = (me, targetId) => {
  return me.blockedUsers.some(b =>
    (typeof b === "object" && b.user ? b.user.equals(targetId) : b.equals?.(targetId))
  );
};


// View another user's profile
exports.getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const targetUser = await User.findOne({ username }).select("-password");
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const requester = await User.findById(req.user._id);

    // 🛡 Block check
    const isBlocked =
      targetUser.blockedUsers.some(b =>
        typeof b === "object" && b.user ? b.user.equals(req.user._id) : b.equals?.(req.user._id)
      ) ||
      requester.blockedUsers.some(b =>
        typeof b === "object" && b.user ? b.user.equals(targetUser._id) : b.equals?.(targetUser._id)
      );

    if (isBlocked) {
      return res.status(403).json({ message: "Access denied. You are blocked." });
    }

    // 🔒 Privacy check
    const isPrivate = targetUser.isPrivate;
    const isFollower = targetUser.followers.includes(req.user._id);
    const isSelf = targetUser._id.equals(req.user._id);

    if (isPrivate && !isFollower && !isSelf) {
      return res.status(403).json({ message: "This profile is private." });
    }

    res.json(targetUser);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};


// controllers/userController.js

exports.getBlockedUsers = async (req, res) => {
  const me = await User.findById(req.user._id)
    .populate("blockedUsers.user", "name username avatar")
    .select("blockedUsers");

  const blockedList = me.blockedUsers.map(b => ({
    user: b.user,
    blockedAt: b.blockedAt,
  }));

  res.json({ blockedUsers: blockedList });
};
// controllers/userController.js

exports.searchUsers = async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === "") {
    return res.status(400).json({ message: "Search query is required" });
  }

  const users = await User.find({
    $or: [
      { username: { $regex: query, $options: "i" } },
      { name: { $regex: query, $options: "i" } },
    ],
  }).select("name username avatar isPrivate");

  res.json(users);
};

// Edit profile
exports.editProfile = async (req, res) => {
  const { name, bio, links } = req.body;

  const updateData = { name, bio, links };

  if (req.file) {
    updateData.avatar = req.file.path; 
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
  }).select("-password");

  res.json(user);
};


// Toggle Privacy
exports.togglePrivacy = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.isPrivate = !user.isPrivate;
  await user.save();
  res.json({ isPrivate: user.isPrivate });
};

// Follow user
exports.followUser = async (req, res) => {
  const targetId = req.params.id;
  const me = await User.findById(req.user._id);
  const targetUser = await User.findById(targetId);

  if (!targetUser || targetUser._id.equals(req.user._id))
    return res.status(400).json({ message: "Invalid user" });

  const youBlockedThem = isUserBlocked(me, targetId);
  const theyBlockedYou = isUserBlocked(targetUser, req.user._id);

  if (youBlockedThem || theyBlockedYou) {
    return res.status(403).json({ message: "Follow not allowed due to block." });
  }

  if (!targetUser.followers.includes(req.user._id)) {
    targetUser.followers.push(req.user._id);
    await targetUser.save();
  }

  if (!me.following.includes(targetId)) {
    me.following.push(targetId);
    await me.save();
  }

  res.json({ message: "Followed successfully." });
};


// Unfollow
exports.unfollowUser = async (req, res) => {
  const targetId = req.params.id;

  await User.findByIdAndUpdate(targetId, {
    $pull: { followers: req.user._id }
  });

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { following: targetId }
  });

  res.json({ message: "Unfollowed successfully." });
};

// Block user
exports.blockUser = async (req, res) => {
  const targetId = req.params.id;
  const me = await User.findById(req.user._id);
  const target = await User.findById(targetId);

  if (!target) return res.status(404).json({ message: "User not found" });
  if (target._id.equals(req.user._id)) return res.status(400).json({ message: "You cannot block yourself." });

  const alreadyBlocked = me.blockedUsers.find(id =>
    id.user ? id.user.equals(targetId) : id.equals(targetId)
  );

  if (alreadyBlocked) return res.status(400).json({ message: "User is already blocked" });

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { following: targetId, followers: targetId }
  });

  await User.findByIdAndUpdate(targetId, {
    $pull: { following: req.user._id, followers: req.user._id }
  });

  me.blockedUsers.push({
    user: targetId,
    blockedAt: new Date()
  });
  await me.save();

  res.json({ message: "User blocked and follow connection removed" });
};

exports.unblockUser = async (req, res) => {
  const targetId = req.params.id;
  const me = await User.findById(req.user._id);

  const wasBlocked = me.blockedUsers.find(b =>
    (typeof b === "object" && b.user ? b.user.equals(targetId) : b.equals?.(targetId))
  );

  if (!wasBlocked) {
    return res.status(400).json({ message: "User is not in your block list." });
  }

  me.blockedUsers = me.blockedUsers.filter(b =>
    (typeof b === "object" && b.user ? !b.user.equals(targetId) : !b.equals?.(targetId))
  );

  await me.save();
  res.json({ message: "User unblocked successfully." });
};


// Report user (basic)
exports.reportUser = async (req, res) => {
  const targetId = req.params.id;
  const { reason } = req.body;

  if (!reason) return res.status(400).json({ message: "Report reason is required" });

  const targetUser = await User.findById(targetId);
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  if (targetId === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot report yourself." });
  }

  const report = new Report({
    reportedBy: req.user._id,
    reportedUser: targetId,
    reason,
  });

  await report.save();

  res.json({ message: "User reported. Thank you for helping keep the platform safe." });
};

// Get followers
exports.getFollowers = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("followers", "name username avatar") 
    .select("followers");

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user.followers);
};


// Get following
exports.getFollowing = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("following", "name username avatar") 
    .select("following");

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user.following);
};
