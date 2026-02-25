#!/usr/bin/env node
/**
 * DayFlow Database Migration Script
 * 
 * Benötigt: DATABASE_URL in .env.local
 * Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 * 
 * Wo finden: Supabase Dashboard → Settings → Database → Connection string → URI
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');

async function migrateViaRestApi() {
  console.log('🔑 Service Role Key gefunden – versuche Migration via Supabase REST API...');
  
  const sql = fs.readFileSync(schemaPath, 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
      });
      successCount++;
    } catch (e) {
      // Silent
    }
  }
  
  return false; // REST API kann kein DDL
}

async function migrateViaPsql() {
  const psqlAvailable = (() => {
    try {
      execSync('psql --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  })();

  if (!psqlAvailable) {
    return false;
  }

  console.log('🐘 psql gefunden – führe Migration aus...');
  try {
    execSync(`psql "${DATABASE_URL}" -f "${schemaPath}"`, { stdio: 'inherit' });
    return true;
  } catch (e) {
    console.error('psql Fehler:', e.message);
    return false;
  }
}

async function migrateViaPg() {
  try {
    const { Client } = require('pg');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🐘 Verbinde mit Datenbank via pg...');
    // Parse URL manuell um Sonderzeichen im Passwort zu behandeln
    let clientConfig;
    try {
      const url = new URL(DATABASE_URL);
      clientConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.replace('/', ''),
        user: url.username,
        password: decodeURIComponent(url.password),
        ssl: { rejectUnauthorized: false },
      };
    } catch {
      clientConfig = { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } };
    }
    const client = new Client(clientConfig);
    await client.connect();
    
    console.log('✅ Verbunden! Führe Schema aus...');
    await client.query(sql);
    await client.end();
    
    console.log('✅ Migration erfolgreich abgeschlossen!');
    return true;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log('📦 Installiere pg...');
      try {
        execSync('npm install pg', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        return await migrateViaPg(); // Retry
      } catch {
        return false;
      }
    }
    console.error('pg Fehler:', e.message);
    return false;
  }
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  DayFlow Database Migration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL fehlt in .env.local');
    process.exit(1);
  }

  if (!DATABASE_URL && !SERVICE_ROLE_KEY) {
    console.error('❌ Weder DATABASE_URL noch SUPABASE_SERVICE_ROLE_KEY in .env.local gefunden!\n');
    console.log('So bekommst du die Zugangsdaten aus dem Supabase-Dashboard:\n');
    console.log('Option A – DATABASE_URL (empfohlen):');
    console.log('  1. Öffne: https://supabase.com/dashboard');
    console.log('  2. Dein Projekt → Settings → Database');
    console.log('  3. Scrolle zu "Connection string" → Reiter "URI"');
    console.log('  4. Kopiere die URL (mit deinem Passwort)');
    console.log('  5. Füge in .env.local ein:');
    console.log('     DATABASE_URL=postgresql://postgres.[ref]:[password]@...\n');
    console.log('Option B – Service Role Key:');
    console.log('  1. Öffne: https://supabase.com/dashboard');
    console.log('  2. Dein Projekt → Settings → API');
    console.log('  3. Kopiere "service_role" Key (GEHEIM!)');
    console.log('  4. Füge in .env.local ein:');
    console.log('     SUPABASE_SERVICE_ROLE_KEY=eyJ...\n');
    console.log('Option C – Manuell:');
    console.log('  1. Supabase Dashboard → SQL Editor → New query');
    console.log(`  2. Inhalt von supabase/schema.sql einfügen`);
    console.log('  3. Run klicken\n');
    process.exit(1);
  }

  let success = false;

  if (DATABASE_URL) {
    success = await migrateViaPg();
    if (!success) {
      success = await migrateViaPsql();
    }
  }

  if (!success) {
    console.log('\n⚠️  Automatische Migration fehlgeschlagen.');
    console.log('Bitte führe den SQL-Code manuell im Supabase Dashboard aus:');
    console.log('→ https://supabase.com/dashboard → SQL Editor\n');
    console.log(`Schema-Datei: ${schemaPath}\n`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Unerwarteter Fehler:', e);
  process.exit(1);
});
