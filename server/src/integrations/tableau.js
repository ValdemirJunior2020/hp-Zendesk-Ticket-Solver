// /server/src/integrations/tableau.js
export function tableauEnabled() {
  return Boolean(
    process.env.TABLEAU_BASE_URL &&
      process.env.TABLEAU_TOKEN_NAME &&
      process.env.TABLEAU_TOKEN_SECRET
  );
}

/**
 * Placeholder: later implement itinerary lookup via Tableau.
 * For now it returns a helpful message.
 */
export async function tableauLookupItinerary(itineraryNumber) {
  if (!tableauEnabled()) {
    return {
      ok: false,
      error: "Tableau integration not configured yet. Set TABLEAU_BASE_URL, TABLEAU_TOKEN_NAME, TABLEAU_TOKEN_SECRET on Render.",
      itineraryNumber,
      itinerary: null,
    };
  }

  // TODO later: authenticate to Tableau + query view/datasource for itinerary details
  return { ok: true, itineraryNumber, itinerary: null };
}