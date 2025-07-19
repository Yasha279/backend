const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadAvatar");
// Profile
router.get("/me", protect, userCtrl.getMyProfile);
router.get("/:username", protect, userCtrl.getUserProfile);
router.put("/edit", protect, upload.single("avatar"), userCtrl.editProfile);
router.patch("/privacy", protect, userCtrl.togglePrivacy);

// Follow/Unfollow/Block
router.post("/follow/:id", protect, userCtrl.followUser);
router.post("/unfollow/:id", protect, userCtrl.unfollowUser);
router.post("/block/:id", protect, userCtrl.blockUser);
router.post("/unblock/:id", protect, userCtrl.unblockUser);
router.post("/report/:id", protect, userCtrl.reportUser);

// Followers/Following
router.get("/:id/followers", protect, userCtrl.getFollowers);
router.get("/:id/following", protect, userCtrl.getFollowing);

router.get("/me/blocked", protect, userCtrl.getBlockedUsers);
router.get("/search", protect, userCtrl.searchUsers);
module.exports = router;
