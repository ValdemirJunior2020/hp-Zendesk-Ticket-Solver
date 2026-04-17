# /docs/suggestions.md
# Suggestions for a real auto-solve ticket system

## Best architecture

### Best now
- Rule engine + prompt
- Human-in-the-loop
- Browser automation later

### Better than using only OpenClaw
OpenClaw is useful for desktop or browser actions, but your QA score depends on exact matrix compliance.

That means the safe design is:

- **Classifier** -> choose the correct case key
- **Policy engine** -> read the exact matrix row
- **Action planner** -> decide:
  - auto-solved
  - refund step needed
  - note needed
  - human call needed
- **Executor** -> later use OpenClaw or Zendesk API

## Good future add-ons

1. Confidence score per ticket
2. "Why this case key" explanation
3. Red flag detector:
   - legal
   - fraud
   - inaccessible room
   - double charge
   - refund queue failure
4. QA checker before posting reply
5. Audit log of every step taken
6. Approval mode for new agents
7. Supervisor-only override

## KPIs to show your boss

- tickets auto-classified
- tickets fully auto-solved
- tickets requiring hotel/supplier call
- average handling time saved
- QA consistency improvement
- refund-documentation accuracy rate

## Strong demo message

This is not just a chatbot.
It is a matrix-compliant ticket worker that:
- reads the ticket
- chooses the exact case type
- drafts the response
- drafts the private note
- prepares refund instructions
- stops safely when live property outreach is needed
