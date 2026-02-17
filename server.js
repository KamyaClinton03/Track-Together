const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let users = [];
let groups = [];
let invites = [];

// signup
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  const existing = users.find(u => u.username === username);
  if (existing) {
    return res.status(400).json({ message: "Username already taken" });
  }

  const user = {
    id: Date.now(),
    username,
    password,
    groups: [],
    progress: 0,
    goal: 100
  };

  users.push(user);
  res.json({ message: "Signup successful", user });
});

// login
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

// get user 
app.get("/users", (req, res) => {
  res.json(users);
});

// user
app.patch("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (req.body.progress !== undefined) {
    user.progress = req.body.progress;
  }

  if (req.body.goal !== undefined) {
    user.goal = req.body.goal;
  }

  res.json(user);
});

// groups 
app.get("/groups", (req, res) => {
  res.json(groups);
});

app.post("/groups", (req, res) => {
  const { name, tracking, userId, defaultGoal } = req.body;

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
// add member 
app.post("/add-member", (req, res) => {
  const { username, groupId } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.json({ success: false, message: "User not found" });

  const group = groups.find(g => g.id === Number(groupId));
  if (!group) return res.json({ success: false, message: "Group not found" });

  if (!group.members.includes(user.id)) group.members.push(user.id);

  res.json({ success: true, message: "Member added successfully" });
});
// invite 
app.post("/invite", (req, res) => {
  const { email, groupId } = req.body;

  const invite = {
    id: Date.now(),
    email,
    groupId: Number(groupId),
    code: Math.random().toString(36).substring(2, 10),
    accepted: false
  };

  invites.push(invite);

  const inviteLink = `http://localhost:3000/accept-invite.html?code=${invite.code}`;
  res.json({ message: "Invite created", inviteLink });
});
// accept invite
app.post("/accept-invite", (req, res) => {
  const { code, userId } = req.body;

  const invite = invites.find(i => i.code === code);
  if (!invite) return res.status(400).json({ message: "Invalid invite" });

  const group = groups.find(g => g.id === Number(invite.groupId));
  if (!group) return res.status(400).json({ message: "Group not found" });

  if (!group.members.includes(userId)) group.members.push(userId);

  invite.accepted = true;
  res.json({ message: "Joined group successfully" });
});

// start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
