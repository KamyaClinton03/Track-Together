import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import confetti from 'canvas-confetti';
import './groupDetail.css';

function GroupView({ groupId, userId, onBack }) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [addByName, setAddByName] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Calculations
  const totalProgress = members.reduce((sum, m) => sum + (m.progress || 0), 0);
  const goal = group?.groupGoal || 100;
  const percentComplete = Math.min(Math.round((totalProgress / goal) * 100), 100);
  
  const chartData = [
    { name: 'Completed', value: totalProgress },
    { name: 'Remaining', value: Math.max(0, goal - totalProgress) }
  ];

  // Sorting for the Leaderboard
  const sortedMembers = [...members].sort((a, b) => b.progress - a.progress);

  const COLORS = ['#4f46e5', '#f1f5f9'];

  // Helper for badge logic based on any goal number
  const renderStars = (currentProgress) => {
    const goal = group?.groupGoal || 100;
    const pct = (currentProgress / goal) * 100;
    const starCount = Math.floor(pct / 25);
    return "⭐️".repeat(Math.min(Math.max(starCount, 0), 4));
  };

  const triggerCelebration = () => {
    const emojiMap = {
      stars: ['✨', '⭐', '🌟'],
      money: ['💰', '💵', '💸'],
      study: ['📚', '📖', '✍️'],
      exercise: ['👟', '🏃', '💪'],
      water: ['💧', '🥤', '🌊']
    };
    const selectedEmojis = emojiMap[group?.trackType] || ['✨'];
    const scalar = 7;
    const randomEmoji = selectedEmojis[Math.floor(Math.random() * selectedEmojis.length)];
    const shape = confetti.shapeFromText({ text: randomEmoji, scalar });

    confetti({
      shapes: [shape],
      particleCount: 20,
      spread: 90,
      origin: { y: 0.2 },
      scalar,
      gravity: 2.5,
      ticks: 100,
      zIndex: 9999,
    });
  };

  const loadData = async () => {
    try {
      const [gRes, uRes, aRes] = await Promise.all([
        fetch("http://localhost:3000/groups"),
        fetch("http://localhost:3000/users"),
        fetch(`http://localhost:3000/activity?groupId=${groupId}`)
      ]);
      const allGroups = await gRes.json();
      const allUsers = await uRes.json();
      const found = allGroups.find(g => g.id === Number(groupId));

      if (found) {
        setGroup(found);
        setMembers(allUsers.filter(u => found.members.includes(u.id)));
        
        // Take only the last 20 activities for the rolling log
        const activityData = await aRes.json();
        setActivity(activityData.slice(0, 20));
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [groupId]);


  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("http://localhost:3000/api/current_user");
      const data = await res.json();
      if (data) setCurrentUser(data);
    };
    fetchUser();
  }, []);

  const updateProgress = async (val) => {
    const me = members.find(m => m.id === Number(userId));
    if (!me) return;

    if (val > 0) triggerCelebration();

    const targetId = currentUser?.id || userId;

    try {
      await fetch(`http://localhost:3000/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress: Math.max(0, (me.progress || 0) + val),
          username: me.username,
          groupId: Number(groupId)
        })
      });
      loadData();
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const me = members.find(m => m.id === Number(userId));
    const displayName = currentUser?.displayName || me?.username || "User";
    try {
      await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: displayName,
          text: chatInput,
          groupId: Number(groupId)
        })
      });
      setChatInput("");
      loadData();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleLeave = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      await fetch("http://localhost:3000/leave-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, userId })
      });
      onBack();
    }
  };

  const handleDelete = async () => {
    if (window.confirm("DANGER: This will delete the group for everyone. Proceed?")) {
      await fetch(`http://localhost:3000/groups/${groupId}`, {
        method: "DELETE"
      });
      onBack();
    }
  };

  const handleAddMember = async () => {
    if (!addByName.trim()) return;
    await fetch("http://localhost:3000/add-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: addByName, groupId: Number(groupId) })
    });
    setShowInvite(false);
    setAddByName("");
    loadData();
  };

  const handleReset = async () => {
    if (window.confirm("Reset everyone's progress to 0% and clear the log?")) {
      try {
        await fetch("http://localhost:3000/reset-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId: Number(groupId) })
        });
        loadData();
      } catch (err) {
        console.error("Reset failed:", err);
      }
    }
  };

  return (
    <div className="group-detail-container">
      {/* 1. HEADER */}
      <div className="group-header-row">
        <h1>{group?.name}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="primary-btn" onClick={() => setShowInvite(true)}>+ Invite</button>
          {group?.adminId === Number(userId) ? (
            <button className="control-btn" style={{ backgroundColor: '#dc2626' }} onClick={handleDelete}>Delete Group</button>
          ) : (
            <button className="control-btn" style={{ backgroundColor: '#f97316' }} onClick={handleLeave}>Leave Group</button>
          )}
          <button className="control-btn" style={{ backgroundColor: '#ef4444' }} onClick={handleReset}>Reset</button>
          <button className="control-btn" onClick={onBack}>Back</button>
        </div>
      </div>

      {/* 2. SUMMARY CARD */}
      <div className="group-summary-card" style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <div style={{ width: '150px', height: '150px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4f46e5' }}>{percentComplete}%</span>
          </div>
        </div>
        <div style={{ marginLeft: '30px' }}>
          <h3 style={{ margin: 0 }}>Group Goal</h3>
          <p style={{ color: '#64748b', margin: '5px 0' }}>
            We've completed <strong>{totalProgress}</strong> out of our <strong>{goal}</strong> target!
          </p>
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID (Progress & Ranking) */}
      <div className="group-content-grid" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        <div className="progress-column">
          <h2 style={{ marginBottom: '15px' }}>Member Progress</h2>
          {members.map(m => {
            const individualPct = Math.round(((m.progress || 0) / (group?.groupGoal || 100)) * 100);
            return (
              <div key={m.id} className="progress-card" style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div className="member-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{m.username} {m.id === Number(userId) ? "(You)" : ""}</strong>
                  <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>{individualPct}%</span>
                </div>
                <div className="bar-bg" style={{ height: '12px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                  <div className="fill" style={{ width: `${Math.min(individualPct, 100)}%`, height: '100%', background: '#4f46e5', transition: 'width 0.5s ease' }}></div>
                </div>
                {m.id === Number(userId) && (
                  <div className="increment-controls" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button className="control-btn" style={{ flex: 1 }} onClick={() => updateProgress(5)}>+</button>
                    <button className="control-btn" style={{ flex: 1 }} onClick={() => updateProgress(-5)}>−</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="activity-column">
          <div className="leaderboard-card" style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>🏆 Ranking</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sortedMembers.map((m, index) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500' }}>
                    <span style={{ color: '#94a3b8', marginRight: '8px' }}>{index + 1}.</span>
                    {m.username}
                  </span>
                  <span style={{ fontSize: '1.1rem' }}>{renderStars(m.progress)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

   {/* 4. BOTTOM ACTIVITY LOG */}
   <div className="activity-log-section" style={{ marginTop: '30px', background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>Activity Log</h2>
        
        {}
        <div className="chat-box" style={{ 
          height: '300px', 
          overflowY: 'auto', 
          marginBottom: '15px', 
          padding: '10px',
          background: '#fcfcfc',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column-reverse' 
        }}>
          {activity.map(log => (
            <div key={log.id} className="chat-message" style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
              <strong style={{ color: '#4f46e5' }}>{log.user}:</strong> {log.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {}
          <textarea 
            placeholder="Type your message here..."
            className="chat-input-field" 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            style={{ 
              width: '100%', 
              minHeight: '80px', 
              padding: '12px', 
              borderRadius: '10px', 
              border: '1px solid #cbd5e1',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <button type="submit" className="primary-btn" style={{ alignSelf: 'flex-end', padding: '10px 25px' }}>
            Send Message
          </button>
        </form>
      </div>

      {/* 5. INVITE MODAL */}
      {showInvite && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Invite Members</h3>
            <div className="code-display-box">
              <p>Share this code:</p>
              <h2>{group?.inviteCode || "N/A"}</h2>
            </div>
            <input
              value={addByName}
              onChange={e => setAddByName(e.target.value)}
              placeholder="Enter username"
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="primary-btn" onClick={handleAddMember}>Add</button>
              <button className="control-btn" onClick={() => setShowInvite(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupView;