/*
  Simple deduplication helper. 
  Used as a reference for the logic in the n8n Check Duplicate node.
*/

import fs from 'node:fs';
import path from 'node:path';

export function createStore(filePath) {
  let records = [];

  // Load file if it exists
  if (fs.existsSync(filePath)) {
    try {
      records = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.warn('Could not load dedupe file:', err.message);
      records = [];
    }
  }

  return {
    isNew: (key) => !records.includes(key),
    
    save: (key) => {
      if (!records.includes(key)) {
        records.push(key);
        // Keep it manageable (last 5k items)
        if (records.length > 5000) records.shift();
        
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(records), 'utf8');
      }
    }
  };
}

/**
 * Basic djb2-style hash for the dedupe key
 */
export function generateKey(incidentId, severity, createdAt) {
  const str = `${incidentId}:${severity}:${createdAt}`;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  const suffix = (hash >>> 0).toString(16);
  return `${incidentId}-${suffix}`;
}
