import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-api', timestamp: new Date().toISOString() });
});

// Sign Up
app.post('/auth/v1/signup', async (req, res) => {
  try {
    const { email, password, data } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const existing = await pool.query('SELECT id FROM auth.users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    
    await pool.query(
      `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW(), NOW())`,
      [userId, email.toLowerCase(), hashedPassword, JSON.stringify(data || {})]
    );
    
    const accessToken = jwt.sign({ sub: userId, email: email.toLowerCase(), role: 'authenticated' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
    
    res.json({
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      user: { id: userId, email: email.toLowerCase(), email_confirmed_at: new Date().toISOString(), user_metadata: data || {} }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Sign In
app.post('/auth/v1/token', async (req, res) => {
  try {
    const { email, password, grant_type, refresh_token } = req.body;
    
    if (grant_type === 'refresh_token' && refresh_token) {
      try {
        const decoded = jwt.verify(refresh_token, JWT_SECRET) as { sub: string; type: string };
        if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid refresh token' });
        
        const userResult = await pool.query('SELECT * FROM auth.users WHERE id = $1', [decoded.sub]);
        if (userResult.rows.length === 0) return res.status(401).json({ error: 'User not found' });
        
        const user = userResult.rows[0];
        const accessToken = jwt.sign({ sub: user.id, email: user.email, role: 'authenticated' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
        const newRefreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
        
        return res.json({
          access_token: accessToken, token_type: 'bearer', expires_in: 3600, refresh_token: newRefreshToken,
          user: { id: user.id, email: user.email, user_metadata: user.raw_user_meta_data || {} }
        });
      } catch { return res.status(401).json({ error: 'Invalid refresh token' }); }
    }
    
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const result = await pool.query('SELECT * FROM auth.users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.encrypted_password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    const accessToken = jwt.sign({ sub: user.id, email: user.email, role: 'authenticated' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
    
    await pool.query('UPDATE auth.users SET last_sign_in_at = NOW() WHERE id = $1', [user.id]);
    
    res.json({
      access_token: accessToken, token_type: 'bearer', expires_in: 3600, refresh_token: refreshToken,
      user: { id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at, user_metadata: user.raw_user_meta_data || {} }
    });
  } catch (error) { console.error('Login error:', error); res.status(500).json({ error: 'Authentication failed' }); }
});

// Get User
app.get('/auth/v1/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    
    const result = await pool.query('SELECT * FROM auth.users WHERE id = $1', [decoded.sub]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    
    const user = result.rows[0];
    res.json({ id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at, created_at: user.created_at, user_metadata: user.raw_user_meta_data || {} });
  } catch (error) { console.error('Get user error:', error); res.status(401).json({ error: 'Invalid token' }); }
});

// Sign Out
app.post('/auth/v1/logout', (req, res) => res.json({ success: true }));

app.listen(PORT, () => console.log(\`🔐 Auth API running on port \${PORT}\`));
