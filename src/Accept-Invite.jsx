import { useState, useEffect } from 'react';
import './accept-invite.css';

function AcceptInvite(AcceptInviteComponent) {
  const API_BASE = "https://track-together-684394624513.us-central1.run.app";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setInviteCode(code);
    } else {
      setStatus("No invite code found in URL.");
    }
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Enter both username and password");
      return;
    }

    try {
      // 1. Try to login
      let loginRes = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      let userData;

      if (loginRes.ok) {
        userData = await loginRes.json();
      } else {
        // 2. If login fails, try to signup
        let signupRes = await fetch(`${API_BASE}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        if (!signupRes.ok) {
          const errorData = await signupRes.json();
          alert(errorData.message || "Signup failed");
          return;
        }
        userData = await signupRes.json();
      }

      const userId = userData.user.id;

      // 3. Accept the invite using the code and userId
      const res = await fetch(`${API_BASE}/accept-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode, userId })
      });

      const data = await res.json();
      alert(data.message);

      if (res.ok) {
        window.location.href = "/";
      }

    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Join Group</h2>
      <p>Enter a username and password to join this group.</p>
      
      {status && <p style={{ color: 'red' }}>{status}</p>}

      <form onSubmit={handleJoin}>
        <div style={{ marginBottom: '10px' }}>
          <input 
            style={{ width: '100%', padding: '8px' }}
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input 
            style={{ width: '100%', padding: '8px' }}
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>
          Join Group
        </button>
      </form>
    </div>
  );
}

export default AcceptInvite;
