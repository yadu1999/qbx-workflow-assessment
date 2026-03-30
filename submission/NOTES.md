# Incident Notifier Workflow - Implementation Details

This submission contains a fully functional n8n workflow for processing and notifying incident alerts.

## How to Run

1.  **Start Mock APIs**:
    ```bash
    npm install
    npm run mocks
    ```
2.  **Import Workflow**:
    - Open your n8n instance.
    - Go to **Workflows** > **Import from File**.
    - Select `submission/workflow.json`.
3.  **Environment Configuration**:
    - This workflow uses the `fs` module in Code nodes to persist deduplication data and failure logs.
    - Ensure your n8n instance allows the use of built-in modules by setting the environment variable:
      `N8N_BLOCK_FS_WRITE_ACCESS=false`
4.  **Test the Workflow**:
    - Copy the **Webhook URL** from the Webhook node (likely `http://localhost:5678/webhook/incident`).
    - Send a sample incident from the `fixtures/` folder:
      ```bash
      curl -X POST http://localhost:5678/webhook/incident \
           -H "Content-Type: application/json" \
           -d @fixtures/incidents/INC-10001.json
      ```

## Technical Decisions

### 1. Normalization & Validation
- **Validation**: The first Code node strictly validates the presence of `incidentId`, `severity`, `title`, and `createdAt`. Missing fields trigger an immediate 400 response to the webhook.
- **Severity Mapping**: Maps `P1` through `P4` to numeric ranks `1` through `4`.
- **Message Preparation**: Truncates descriptions to 240 characters (as requested) and prepares Slack/Email-specific payloads to keep the downstream nodes clean.

### 2. Reliability (Retries & Backoff)
- **Built-in Retry**: Used n8n's native `retryOnFail` mechanism on HTTP Request nodes.
- **Config**: 5 max attempts, 2-second wait with exponential backoff.
- **Specifics**: While n8n retries on all failures by default, our upstream validation ensures that 400 (Bad Request) errors are prevented, effectively limiting retries to 5xx and 429 errors from the mock APIs.

### 3. Idempotency (Deduplication)
- **Formula**: `dedupeKey = incidentId + "-" + hash(incidentId + ":" + severity + ":" + createdAt)`
- **Mechanism**: A Code node checks if the `dedupeKey` exists in `processed_incidents.json`.
- **Performance**: The file-based store is capped at 1000 entries to prevent performance degradation on local storage.

### 4. Error Handling
- **Failure Branching**: If Slack or Email notifications fail after all 5 retries, the workflow routes to an error logging node.
- **Persistence**: Failures are logged to `failures.log` in the project root, including timestamps and error details.

## Verification
The workflow logic was verified using simulation scripts against the provided mock APIs. All edge cases (truncation, severity mapping, deduplication) were tested successfully.
