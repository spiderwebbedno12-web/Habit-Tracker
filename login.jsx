import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    let error;
    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
      if (!error) setMessage('Check your email for the confirmation link!');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    }

    if (error) setMessage(error.message);
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h1>
        <p>{isSignUp ? 'Start building better habits today' : 'Login to see your habits'}</p>

        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-create" disabled={loading} style={{width: '100%', marginTop: '10px'}}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>

        {message && <p className="auth-message">{message}</p>}

        <p className="toggle-auth" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
        </p>
      </div>
    </div>
  );
}