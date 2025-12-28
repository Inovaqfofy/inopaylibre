// Script de migration des utilisateurs Supabase
// Usage: npx tsx migrate-users.ts < users.json

import { Pool } from 'pg';
import fs from 'fs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateUsers() {
  const data = fs.readFileSync(0, 'utf-8'); // stdin
  const users = JSON.parse(data);
  
  console.log('Migrating ' + users.length + ' users...');
  
  for (const user of users) {
    try {
      await pool.query(
        'INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
        [user.id, user.email, user.encrypted_password, user.email_confirmed_at, user.raw_user_meta_data, user.created_at]
      );
      console.log('✅ Migrated: ' + user.email);
    } catch (err) {
      console.error('❌ Failed: ' + user.email, err);
    }
  }
  
  await pool.end();
  console.log('Migration complete!');
}

migrateUsers();
