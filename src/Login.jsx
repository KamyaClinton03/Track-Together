import React, { useState } from 'react';
import './auth.css'; 

function login({ onLoginSuccess }) { 
  const API_BASE = "https://track-together-684394624513.us-central1.run.app";

  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ message: "", isError: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? "/login" : "/signup";
    
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();

      if (!res.ok) {
        setStatus({ message: data.message || "Action failed", isError: true });
        return;
      }

      setStatus({ message: isLoginView ? "Login successful!" : "Signup successful!", isError: false });
      
      onLoginSuccess(data.user); 
      
    } catch (err) {
      setStatus({ message: "Error connecting to server", isError: true });
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="container">
      <h1>{isLoginView ? "Welcome Back" : "Create Account"}</h1>
      
      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
        />

        <label>Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        
        <button type="submit">
          {isLoginView ? "Login" : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: '20px', cursor: 'pointer', color: 'blue' }} 
         onClick={() => {
           setIsLoginView(!isLoginView);
           setStatus({ message: "", isError: false });
         }}>
        {isLoginView ? "Need an account? Sign up here" : "Already have an account? Login here"}
      </p>

      {status.message && (
        <div id="status" className={status.isError ? "error" : "success"}>
          {status.message}
        </div>
      )}
    </div>
    </div>
  );
}

export default login; 