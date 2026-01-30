#!/usr/bin/env node
/**
 * gate-review: Adversarial gate analysis
 * Reads gates, generates attacks, stores findings in deja.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DEJA_URL = 'https://deja.coey.dev';

async function storeInDeja(trigger, learning, reason) {
  try {
    await fetch(`${DEJA_URL}/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger, learning, reason, confidence: 0.9, source: 'gate-review' })
    });
  } catch (e) {}
}

function extractGates(content) {
  const gates = [];
  const patterns = [
    /gate\s*\(\s*["'`]([^"'`]+)["'`]/g,
    /runGate\s*\(\s*["'`]([^"'`]+)["'`]/g,
    /test\s*\(\s*["'`]([^"'`]+)["'`]/g,
  ];
  for (const p of patterns) {
    let m; while ((m = p.exec(content))) gates.push(m[1]);
  }
  return [...new Set(gates)];
}

function generateAttacks(name) {
  const attacks = [];
  const n = name.toLowerCase();
  
  if (n.includes('persist') || n.includes('store')) {
    attacks.push({ weakness: 'Trusts response without verify', attack: 'Return success without writing', fix: 'GET by ID and verify round-trip' });
  }
  if (n.includes('returns') || n.includes('array')) {
    attacks.push({ weakness: 'Checks shape not content', attack: 'Return empty/dummy data', fix: 'Verify specific values' });
  }
  if (n.includes('valid') || n.includes('reject')) {
    attacks.push({ weakness: 'Only checks invalid case', attack: 'Reject everything', fix: 'Also verify valid succeeds' });
  }
  if (n.includes('search') || n.includes('query')) {
    attacks.push({ weakness: 'Doesnt verify search works', attack: 'Return empty always', fix: 'Store data, query, verify found' });
  }
  if (attacks.length === 0) {
    attacks.push({ weakness: 'Needs review', attack: 'What passes but is broken?', fix: 'Add behavior assertions' });
  }
  return attacks;
}

async function review(name) {
  console.log(`\n── GATE: ${name}`);
  const attacks = generateAttacks(name);
  for (const a of attacks) {
    console.log(`   ⚠️  ${a.weakness}`);
    console.log(`      Attack: ${a.attack}`);
    console.log(`      Fix: ${a.fix}`);
    await storeInDeja(`gate: ${name}`, a.fix, `Attack: ${a.attack}`);
  }
  return attacks.length;
}

const args = process.argv.slice(2);
if (args[0] === '--gate') {
  review(args.slice(1).join(' '));
} else if (args[0]) {
  const content = readFileSync(args[0], 'utf-8');
  const gates = extractGates(content);
  console.log(`Found ${gates.length} gates`);
  let total = 0;
  for (const g of gates) total += await review(g);
  console.log(`\n${total} weaknesses found`);
} else {
  console.log('Usage: node index.mjs <file> | --gate "description"');
}
