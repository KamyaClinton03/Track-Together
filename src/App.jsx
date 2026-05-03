import React, { useState } from 'react';
import Dashboard from './Dashboard';
import Auth from './Login.jsx';

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData); 
  }
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("userToken");
    window.location.href = "/";
  }
  

  return (
    <div>
      {}
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Auth onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;