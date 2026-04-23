import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

let users = [];
let groups = [];
let activityLogs = [];

// Signup
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) return res.status(400).json({ message: "Username taken" });
  const user = { id: Date.now(), username, password, progress: 0, goal: 100 };
  users.push(user);
  res.json({ message: "Signup successful", user });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  res.json({ message: "Login successful", user });
});

// Create Group
app.post("/groups", (req, res) => {
  const { name, userId, trackType, groupGoal } = req.body;
  const newGroup = {
    id: Date.now(),
    name: name || "New Group",
    adminId: Number(userId),
    members: [Number(userId)],
    trackType: trackType || "stars",
    groupGoal: Number(groupGoal) || 100,
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
  };
  groups.push(newGroup);
  activityLogs.unshift({ 
    id: Date.now(), 
    user: "System", 
    text: `Group "${newGroup.name}" created.`, 
    groupId: newGroup.id 
  });
  res.json(newGroup);
});

app.post("/leave-group", (req, res) => {
  const { groupId, userId } = req.body;
  const group = groups.find(g => g.id === Number(groupId));
  if (group) {
    group.members = group.members.filter(id => id !== Number(userId));
    const user = users.find(u => u.id === Number(userId));
    activityLogs.unshift({
      id: Date.now(),
      user: "System",
      text: `${user?.username || "A member"} left the group.`,
      groupId: group.id
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Group not found" });
  }
});

app.delete("/groups/:id", (req, res) => {
  const groupId = Number(req.params.id);
  groups = groups.filter(g => g.id !== groupId);
  activityLogs = activityLogs.filter(log => log.groupId !== groupId);
  res.json({ success: true });
});

app.patch("/users/:id", (req, res) => {
  const { progress, username, groupId } = req.body;
  const user = users.find(u => u.id === Number(req.params.id));
  const group = groups.find(g => g.id === Number(groupId));

  if (user && group) {
    const goal = group.groupGoal || 100;
    const oldProgress = user.progress || 0;
    
    // Calculate percentages
    const oldPct = (oldProgress / goal) * 100;
    const newPct = (progress / goal) * 100;

    user.progress = Math.max(0, progress);

    // Check if they crossed a 25% milestone  
    const oldMilestone = Math.floor(oldPct / 25);
    const newMilestone = Math.floor(newPct / 25);

    if (newMilestone > oldMilestone && newMilestone <= 4) {
      activityLogs.unshift({
        id: Date.now(),
        user: "System",
        text: `🌟 Amazing! ${username} reached ${newMilestone * 25}% of the group goal and earned a star!`,
        groupId: group.id
      });
      
    }

    // Normal activity log
    const direction = user.progress > oldProgress ? "increased" : "decreased";
    activityLogs.unshift({
      id: Date.now(),
      user: username,
      text: `${direction} progress to ${user.progress} (Total Goal: ${goal})`,
      groupId: group.id
    });

    return res.json(user);
  }
  res.status(404).send();
});

// Chat Route
app.post("/chat", (req, res) => {
  const { username, text, groupId } = req.body;
  if (!text) return res.status(400).json({ message: "Empty" });
  const newMessage = {
    id: Date.now(),
    user: username,
    text: text,
    groupId: Number(groupId)
  };
  activityLogs.unshift(newMessage);
  activityLogs = activityLogs.slice(0, 20);
  res.json(newMessage);
});

// Join Group by Code
app.post("/join-group", (req, res) => {
  const { inviteCode, userId } = req.body;
  const group = groups.find(g => g.inviteCode?.toUpperCase() === inviteCode?.toUpperCase());
  if (!group) return res.status(404).json({ success: false, message: "Invalid code" });

  const uId = Number(userId);
  if (!group.members.includes(uId)) {
    group.members.push(uId);
    const user = users.find(u => u.id === uId);
    activityLogs.unshift({
      id: Date.now(),
      user: "System",
      text: `${user?.username || "New member"} joined via code!`,
      groupId: group.id
    });
  }
  res.json({ success: true, groupId: group.id });
});

// Add Member by Name
app.post("/add-member", (req, res) => {
  const { username, groupId } = req.body;
  const userToAdd = users.find(u => u.username === username);
  const group = groups.find(g => g.id === Number(groupId));
  if (userToAdd && group && !group.members.includes(userToAdd.id)) {
    group.members.push(userToAdd.id);
    activityLogs.unshift({ 
      id: Date.now(), 
      user: "System", 
      text: `${username} was added to the group.`, 
      groupId: group.id 
    });
  }
  res.json({ success: true });
});

// Reset Group
app.post("/reset-group", (req, res) => {
  const gId = Number(req.body.groupId);
  const group = groups.find(g => g.id === gId);
  if (group) {
    users.forEach(u => { if (group.members.includes(u.id)) u.progress = 0; });
    activityLogs = activityLogs.filter(log => log.groupId !== gId);
    activityLogs.unshift({ id: Date.now(), user: "System", text: "Group reset.", groupId: gId });
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Not found" });
  }
});

// Progress Update
app.patch("/users/:id", (req, res) => {
  const { progress, username, groupId } = req.body;
  const user = users.find(u => u.id === Number(req.params.id));
  if (user) {
    const oldProgress = user.progress;
    user.progress = Math.max(0, progress);
    const direction = user.progress > oldProgress ? "increased" : "decreased";
    activityLogs.unshift({
      id: Date.now(),
      user: username,
      text: `${direction} progress to ${user.progress}%`,
      groupId: Number(groupId)
    });
    return res.json(user);
  }
  res.status(404).send();
});

app.get("/groups", (req, res) => res.json(groups));
app.get("/users", (req, res) => res.json(users));
app.get("/activity", (req, res) => {
  const gId = Number(req.query.groupId);
  if (gId) return res.json(activityLogs.filter(l => l.groupId === gId).slice(0, 20));
  res.json(activityLogs.slice(0, 20));
});

app.listen(3000, () => console.log("Server running on port 3000"));