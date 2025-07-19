const router = require("express").Router();
const postController = require("../controllers/postController");
const { protect } = require("../middlewares/authMiddleware"); // ✅ fixed name
const uploadPost = require("../middlewares/uploadPost");

// Routes
router.post(
  "/",
  protect,
  uploadPost.single("media"), 
  postController.createPost
);
router.get("/feed", protect, postController.getFeed);
router.get("/reels", protect, postController.getReels);
router.post("/:id/like", protect, postController.toggleLike);
router.post("/:id/save", protect, postController.toggleSave);
router.post("/:id/comment", protect, postController.comment);
router.delete("/:id", protect, postController.deletePost);
router.delete("/:id/comments/:commentId", protect, postController.deleteComment);
router.post("/:id/react", protect, postController.reactToPost);
router.delete("/:id/react", protect, postController.removeReaction);
//get feed for user
router.get("/user/:userId/feed", protect, postController.getUserFeedById);

//get ontl post
router.get("/user/:userId/posts", protect, postController.getUserPostsOnly);

//get all reel
router.get("/user/:userId/reels", protect, postController.getUserReelsOnly);






module.exports = router;
