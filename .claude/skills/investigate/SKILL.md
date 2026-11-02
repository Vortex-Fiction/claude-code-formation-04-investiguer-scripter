---
name: investigate
description: Guide the investigation of a production error in five steps (reproduce, hypothesis, verify, fix, validate), from the logs and the code only. Use only when the person calls /investigate.
disable-model-invocation: true
---

# Investigate a production error

The person gives a symptom, for example "the API sometimes returns a 500". You find the cause with the logs in `logs/` and the code. Stop after each step, show the proof, and wait for the person.

## Rules

- Read only. You can read the logs and the code, and send requests to the local API on port 3000.
- Do not run a command on the database: no `sqlite3`, no script that writes, no change to `backend/data/`. When you need one, give the command to the person.
- Do not run a command that changes a cloud resource. Give it to the person.
- Each claim comes with its proof: a log line, a request and its status, or a test output.
- Keep one hypothesis at a time until you verify it.

## Steps

1. **Reproduce.** Find a failed request in the logs. Use its request ID to get all its log entries. Send the same request to the local API and show the error.
2. **Hypothesis.** Write one cause and the proof that confirms it or rejects it. List the other leads in the logs, for example alerts or slow requests at the same time. For each lead, give the proof that rejects it or keeps it.
3. **Verify.** Send two requests that are almost the same: one that fails and one that passes. The hypothesis must explain the difference.
4. **Fix.** Write the test that reproduces the error and show that it fails. Then write the fix and show that the test passes.
5. **Validate.** Send the request of the logs again: the error must not occur. Run `npm test`, `npm run test:coverage` and `npm run lint`.

## Report

Write the diagnostic in `docs/incidents/<date>-<slug>.md`, in Simplified Technical English, with these sections: Symptom, Cause, Evidence, Leads that we did not keep, Fix, Next time. Run `npm run lint:doc`.
