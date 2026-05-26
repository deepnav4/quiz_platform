import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignupPage() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) { navigate('/'); return null; }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await signup(email, password, name);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1>Sign Up</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Name<br/><input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 8 }} /></label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Email<br/><input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} /></label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Password<br/><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ width: '100%', padding: 8 }} /></label>
        </div>
        <button type="submit" style={{ padding: '8px 20px' }}>Sign Up</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
