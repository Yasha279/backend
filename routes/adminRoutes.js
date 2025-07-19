const router = require("express").Router();
const adminController = require("../controllers/adminController");
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/isAdmin");

router.use(protect, isAdmin);

router.get("/users", adminController.getAllUsers);                      // List all users
router.put("/users/:id/block", adminController.toggleBlockUser);       // Block/unblock user
router.put("/users/:id/admin", adminController.toggleAdminRole);       // Promote/demote admin

router.delete("/posts/:id", adminController.deleteAnyPost);            // Admin deletes any post

router.delete("/stories/:id", adminController.deleteAnyStory);         // Admin deletes any story

router.get("/stats", adminController.getPlatformStats);                // Show total users/posts/stories

module.exports = router;
