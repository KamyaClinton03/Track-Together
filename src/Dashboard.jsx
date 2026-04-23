import React, { useState, useEffect } from 'react';
import './dashboard.css';
import GroupView from './GroupView';

function Dashboard({ user, onLogout }) {
  const [view, setView] = useState("overview");
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [trackType, setTrackType] = useState("stars");
  const [joinCode, setJoinCode] = useState("");
  const [groupGoal, setGroupGoal] = useState(100);

  const loadGroups = () => {
    fetch("https://track-together-684394624513.us-central1.run.app/groups")
      .then(res => res.json())
      .then(data => setGroups(data))
      .catch(err => console.error("Error loading groups:", err));
  };

  useEffect(() => {
    loadGroups();
  }, [view]);

  const myGroups = groups.filter(g => g.members.includes(user.id));

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch("https://track-together-684394624513.us-central1.run.app/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: groupName,
        userId: user.id,
        trackType: trackType,
        groupGoal: Number(groupGoal)
      })
    });
    const data = await res.json();
    setSelectedGroupId(data.id);
    setView("group");
  };

  const handleJoinCode = async () => {
    if (!joinCode.trim()) return;

    try {
      const res = await fetch("https://track-together-684394624513.us-central1.run.app/join-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode, userId: user.id })
      });
      const data = await res.json();

      if (data.success) {
        setJoinCode("");
        loadGroups(); 
        setSelectedGroupId(data.groupId);
        setView("group");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Make sure your server is running!");
    }
  };
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2 style={{ color: 'white', marginBottom: '20px' }}>Track-Together</h2>
          <nav>
            <button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}>Overview</button>
            <button className={view === 'create' ? 'active' : ''} onClick={() => setView('create')}>Create Group</button>
          </nav>
          {/* JOIN SECTION */}
          <div className="join-section" style={{
            padding: '15px',
            marginTop: '30px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px', fontWeight: 'bold' }}>JOIN A GROUP</p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter Code (e.g. A1B2C3)"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                marginBottom: '10px',
                background: 'white',
                color: 'black'
              }}
            />
            <button
              className="primary-btn"
              style={{ width: '100%', padding: '10px' }}
              onClick={handleJoinCode}
            >
              Join
            </button>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </aside>

      <main className="main-content">
        <header className="top-bar">Welcome, {user.username}</header>
        <div className="content-body">
          {view === "overview" && (
            <div className="overview-container">
              <div className="stat-card summary">
                <h4>Your Groups</h4>
                <p>{myGroups.length}</p>
              </div>
              <div className="group-grid">
                {myGroups.map(g => (
                  <div key={g.id} className="stat-card group-item" onClick={() => { setSelectedGroupId(g.id); setView("group"); }}>
                    <h3>{g.name}</h3>
                    <span className="go-arrow">View →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "create" && (
            <form onSubmit={handleCreate} className="form-card">
              <h2>Create New Group</h2>
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group Name" required />
              <label style={{ marginTop: '15px', display: 'block' }}>Total Group Goal</label>
              <input
                type="number"
                value={groupGoal}
                onChange={(e) => setGroupGoal(e.target.value)}
                placeholder="e.g., 500"
                className="modal-input"
              />
              <label style={{ marginTop: '15px', display: 'block' }}>What are you tracking?</label>
              <select value={trackType} onChange={(e) => setTrackType(e.target.value)} className="modal-input">
                <option value="stars">General (✨)</option>
                <option value="money">Money (💰)</option>
                <option value="study">Study Time (📚)</option>
                <option value="exercise">Exercise (👟)</option>
                <option value="water">Hydration (💧)</option>
              </select>

              <button type="submit" className="primary-btn" style={{ marginTop: '20px' }}>Start Tracking</button>
            </form>
          )}

          {view === "group" && selectedGroupId && (
            <GroupView groupId={selectedGroupId} userId={user.id} onBack={() => setView('overview')} />
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;