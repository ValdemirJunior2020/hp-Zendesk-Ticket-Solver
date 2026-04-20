// /server/src/integrations/zendesk.js
export function zendeskEnabled() {
  return Boolean(
    process.env.ZENDESK_SUBDOMAIN &&
      process.env.ZENDESK_EMAIL &&
      process.env.ZENDESK_API_TOKEN
  );
}

/**
 * Placeholder: later implement Zendesk search.
 * For now it returns a helpful message so your boss sees the plan.
 */
export async function zendeskSearchTickets(query) {
  if (!zendeskEnabled()) {
    return {
      ok: false,
      error: "Zendesk integration not configured yet. Set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN on Render.",
      query,
      tickets: [],
    };
  }

  // TODO later: call Zendesk Search API and normalize to your solver payload
  return { ok: true, query, tickets: [] };
}

/**
 * Placeholder: later implement ticket update (post reply + note + tags + status).
 */
export async function zendeskUpdateTicket(ticketId, updates) {
  if (!zendeskEnabled()) {
    return {
      ok: false,
      error: "Zendesk integration not configured yet. Set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN on Render.",
      ticketId,
      updates,
    };
  }

  // TODO later: PUT /api/v2/tickets/{id}.json
  return { ok: true, ticketId, updates };
}