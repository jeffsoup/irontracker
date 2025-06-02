import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else alert('Check your email for a confirmation link!');
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    setLoading(false);
    if (error) setError(error.message);
  };

  const handleMagicLink = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) setError(error.message);
    else alert('Check your email for a magic link to sign in!');
  };

  return (
    <div style={{ maxWidth: 320, margin: '2rem auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Sign In / Sign Up</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', marginBottom: 8, padding: 8 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: 8, padding: 8 }}
      />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={handleSignIn} disabled={loading} style={{ flex: 1 }}>Sign In</button>
        <button onClick={handleSignUp} disabled={loading} style={{ flex: 1 }}>Sign Up</button>
      </div>
      <button onClick={handleMagicLink} disabled={loading} style={{ width: '100%', marginBottom: 8 }}>
        Sign In with Magic Link
      </button>
      <button onClick={handleGoogleSignIn} disabled={loading} style={{ width: '100%', marginBottom: 8 }}>
        Sign In with Google
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
};
