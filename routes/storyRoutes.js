const router = require("express").Router();
const storyController = require("../controllers/storyController");
const { protect } = require("../middlewares/authMiddleware");
const uploadStory = require("../middlewares/uploadStory"); // you already created this

router.post("/", protect, uploadStory.single("media"), storyController.createStory);
router.get("/user/:userId", protect, storyController.getUserStories);
router.get("/:id", protect, storyController.viewStory);
router.delete("/:id", protect, storyController.deleteStory);
router.post("/:id/like", protect, storyController.likeStory);
router.post("/:id/poll", protect, storyController.votePoll);
router.post("/:id/question", protect, storyController.answerQuestion);

// ⭐ Highlight-related
router.post("/:id/highlight", protect, storyController.markAsHighlight);
router.get("/highlights/:userId", protect, storyController.getHighlights);

module.exports = router;
