# gate-review

Red-team your gates before implementing.

Born from a failed experiment: an agent writing its own gates produces theater, not verification.

## The Problem

When you write tests for your own code, you have the same blind spots that cause bugs. Gates that seem thorough often just check shapes, not behavior.

## The Solution

For each gate, ask: **"What bad code would pass this?"**

If you can write broken code that passes, the gate is too weak.

## Usage

```bash
# Review a gate file
node index.mjs gates/my-gates.js

# Review a single gate by description  
node index.mjs --gate "POST /learn returns id"
```

## Output

```
── GATE: POST /learn returns id and status stored
   ⚠️  Trusts response without verify
      Attack: Return success without writing
      Fix: GET by ID and verify round-trip
```

## Stores in deja

Findings are stored in [deja](https://deja.coey.dev) for future reference.

## Origin

Built during the deja experiment. Blog post: [coey.dev/deja](https://coey.dev/deja)
