const Story = require("../models/Story");
const User = require("../models/User");
exports.createStory = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File not received." });

  const media = {
    url: req.file.path,
    type: req.file.mimetype.startsWith("video") ? "video" : "image"
  };

  const { pollQuestion, pollOptions, askQuestion } = req.body;

  const story = await Story.create({
    user: req.user._id,
    media,
    poll: pollQuestion && pollOptions ? {
      question: pollQuestion,
      options: JSON.parse(pollOptions)
    } : undefined,
    question: askQuestion ? { text: askQuestion } : undefined
  });

  res.status(201).json(story);
};


exports.getUserStories = async (req, res) => {
  const { userId } = req.params;

  try {
    const targetUser = await User.findById(userId).select("-password");
    const me = await User.findById(req.user._id);

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // ❌ Blocked logic
    const isBlocked =
      targetUser.blockedUsers?.some(b =>
        b.user ? b.user.equals(req.user._id) : b.equals?.(req.user._id)
      ) ||
      me.blockedUsers?.some(b =>
        b.user ? b.user.equals(userId) : b.equals?.(userId)
      );

    if (isBlocked) {
      return res.status(403).json({ message: "Access denied. You are blocked." });
    }

    // 🔒 Private profile logic
    if (
      targetUser.isPrivate &&
      !targetUser.followers.includes(req.user._id) &&
      !targetUser._id.equals(req.user._id)
    ) {
      return res.status(403).json({ message: "This profile is private." });
    }

    // ✅ Fetch non-expired stories (within 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({
      user: userId,
      createdAt: { $gte: cutoff }
    }).sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    console.error("Get user stories error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.viewStory = async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ message: "Story not found" });

  if (!story.viewers.includes(req.user._id)) {
    story.viewers.push(req.user._id);
    await story.save();
  }

  res.json(story);
};

exports.likeStory = async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ message: "Story not found" });

  const liked = story.likes.includes(req.user._id);
  if (liked) {
    story.likes.pull(req.user._id);
  } else {
    story.likes.push(req.user._id);
  }

  await story.save();
  res.json({ message: liked ? "Unliked" : "Liked" });
};

exports.votePoll = async (req, res) => {
  const { optionIndex } = req.body;
  const story = await Story.findById(req.params.id);
  if (!story || !story.poll) return res.status(404).json({ message: "Poll not found" });

  const alreadyVoted = story.poll.responses.find(r => r.user.equals(req.user._id));
  if (alreadyVoted) return res.status(400).json({ message: "Already voted" });

  story.poll.responses.push({ user: req.user._id, optionIndex });
  await story.save();

  res.json({ message: "Vote recorded" });
};
exports.deleteStory = async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ message: "Story not found" });

  if (!story.user.equals(req.user._id)) {
    return res.status(403).json({ message: "Not allowed to delete this story" });
  }

  await story.deleteOne();
  res.json({ message: "Story deleted" });
};
exports.markAsHighlight = async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ message: "Story not found" });

  if (!story.user.equals(req.user._id)) {
    return res.status(403).json({ message: "Not allowed to highlight this story" });
  }

  story.isHighlight = true;
  await story.save();

  res.json({ message: "Story marked as highlight" });
};
exports.getHighlights = async (req, res) => {
  const { userId } = req.params;

  const highlights = await Story.find({
    user: userId,
    isHighlight: true
  }).sort({ createdAt: -1 });

  res.json(highlights);
};

exports.answerQuestion = async (req, res) => {
  const { answer } = req.body;
  const story = await Story.findById(req.params.id);
  if (!story || !story.question) return res.status(404).json({ message: "Question not found" });

  story.question.answers.push({ user: req.user._id, answer });
  await story.save();

  res.json({ message: "Answer submitted" });
};
