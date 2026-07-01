import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { db } from '../db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');

const migrate = async () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.log('No database.json found. Nothing to migrate.');
      process.exit(0);
    }

    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    const collections = Object.keys(db);
    for (const coll of collections) {
      const records = data[coll] || [];
      if (records.length > 0) {
        console.log(`Migrating ${records.length} records to '${coll}' collection...`);
        // We use the raw mongoose model to skip hooks if needed, or just our wrapper.
        await db[coll].deleteMany({}); // clear existing
        await db[coll].insertMany(records);
        console.log(`Successfully migrated '${coll}'.`);
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
};

migrate();
