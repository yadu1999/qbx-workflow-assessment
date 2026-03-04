# Candidate Instructions: Offline Assessment

## What you’re building
Create an **n8n workflow** that receives an **Incident** payload, normalizes/validates it using **JavaScript**, and sends notifications to:

1) **Slack** (offline mock API)  
2) **Office 365 email** (offline mock API, Graph-like)

This exercise is **fully offline** — do **not** call real Slack or Microsoft endpoints.

Make sure you fork this repo and submit your response in the forked repo
---

## What’s included in this repo
- Offline mock APIs:
  - Slack mock: `http://localhost:4010/chat.postMessage`
  - Microsoft mock: `http://localhost:4020/me/sendMail`
- Sample incidents: `fixtures/incidents/`
- Optional starter workflow: `workflow/skeleton.workflow.json`
- Submission folder: `submission/`

---

## Prerequisites
- Node.js 18+ and npm
- A local n8n installation (any method is fine: npm, Docker, desktop)

---

## Setup
From the repo root:

```bash
npm install
```
---
## Start the offline mocks

In a terminal:
```bash
npm run mocks
```
This will start:

- Slack mock on port 4010

- Microsoft mock on port 4020

**Optional**: simulate failures (rate limit / server errors)

In the same terminal (before starting mocks), you can set:

```bash
# Slack returns 429 for first 2 calls, then succeeds
export SLACK_FAIL_429_N=2

# Microsoft returns 500 for first 1 call, then succeeds
export MS_FAIL_500_N=1

npm run mocks
```
---
## Build your n8n workflow

### Trigger

Use either:

- Webhook Trigger (preferred): accept POST /incident, or
- Manual trigger + test data (acceptable if clearly documented)

### Input

Your workflow must accept JSON like the examples in fixtures/incidents/.

Required fields:

- `incidentId`, `severity`, `title`, `createdAt`

### Normalization (JavaScript-heavy)

Using a Function/Code node (or equivalent), implement:

- Field validation (fail clearly if missing required fields)

- Severity mapping: `P1->1`, `P2->2`, `P3->3`, `P4->4`

- `dedupeKey` generation (document your formula in NOTES)

- Create a clean message used by Slack and email (truncate description to 240 chars)

### Slack notification (offline)

Send an HTTP POST to:

- URL: `http://localhost:4010/chat.postMessage`

- Headers:
  - `Authorization: Bearer slack-test-token`
  - `Content-Type: application/json`

- JSON body must include:
  - `channel`: `#oncall-alerts`
  - `text`: a human-friendly message

### Office 365 email (offline)

Send an HTTP POST to:

- URL: `http://localhost:4020/me/sendMail`

- Headers:

  - `Authorization: Bearer ms-test-token`
  - `Content-Type: application/json`

- Graph-like body must include:
  - `message.subject`
  - `message.body.contentType` and `message.body.content`
  - `message.toRecipients[]` (send to `ownerEmail` from the Incident)

### Reliability requirements

- Retry on **429** and **5xx** with backoff and a max-attempt cap (e.g., 5)
- Do not retry on other **4xx** errors
- Implement idempotency/deduplication so replaying the same event does not resend Slack/email

### Error handling

If Slack or Office 365 fails after retries:

- Route to an error branch
- Persist a failure record locally (a file is fine)

### Optional sanity check (mocks only)

You can confirm the mocks are reachable with:

```bash
npm run demo -- fixtures/incidents/INC-10001.json
```

# What to submit back

Place your deliverables under `submission/`:

- `submission/workflow.json`

  Export your n8n workflow as JSON and save it as this file.

- `submission/NOTES.md`
Include:

  - how to run your workflow
  - how you implemented retries/backoff
  - how you implemented dedupe/idempotency
  - where failure records are written
  - your dedupeKey formula

- `submission/src/` (optional)

  Any helper JS modules you used.

---
## Constraints / expectations

- Offline only: use the provided mocks, not real Slack/Microsoft.
- Avoid logging tokens or sensitive payloads.
- Keep the workflow readable (clear node names, clean branching).
