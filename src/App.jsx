import React, { useState } from 'react';
import Dashboard from './Dashboard';
import Auth from './Login.jsx';

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData); 
  }
  

  return (
    <div>
      {}
      {user ? (
        <Dashboard user={user} />
      ) : (
        <Auth onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;