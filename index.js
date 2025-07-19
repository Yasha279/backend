const express = require("express");
const connectDB = require('./config/db');
const cors = require("cors");
require('dotenv').config();
const app=express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


connectDB();
//auth routes
app.use("/api/auth", require("./routes/authRoutes"));
// user profie
app.use("/api/user", require("./routes/userRoutes"));

//post
app.use("/api/post",require("./routes/postRoutes"));
//story
app.use("/api/story",require("./routes/storyRoutes"));
//admin
app.use("/api/admin",require("./routes/adminRoutes"));
app.get("/", (req, res) => res.send("API is running"));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(3000,()=>{
    console.log("server running on port 3000");
})
