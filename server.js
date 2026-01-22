const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); 

let users = [];
// Signup route
app.post("/signup", (req, res) => {
    const { username, password } = req.body;
  
    // check if username already exists
    const existing = users.find(u => u.username === username);
    if (existing) {
      return res.status(400).json({ message: "Username already taken" });
    }
  
    const user = {
      id: Date.now(),
      username,
      password, 
      groups: [] 
    };
  
    users.push(user);
    res.json({ message: "Signup successful", user });
  });

// Login route
app.post("/login", (req, res) => {
    const { username, password } = req.body;
  
    const user = users.find(
      u => u.username === username && u.password === password
    );
  
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
  
    res.json({ message: "Login successful", user });
  });
  

// Groups routes
let groups = [];

app.get("/groups", (req, res) => {
  res.json(groups);
});

app.post("/groups", (req, res) => {
  const { name, tracking, userId} = req.body;
    const group = {
        id: Date.now(),
        name,
        tracking,
        owner: userId,
        members: [userId],
        inviteCode: Math.random().toString(36).substring(2, 10)
  };

  groups.push(group);
  res.json(group);
});

// User route 
app.get("/users", (req, res) => { 
    res.json(users); 
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
