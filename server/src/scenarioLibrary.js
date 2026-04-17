// /server/src/scenarioLibrary.js
// Small-but-powerful demo scenario library.
// Generates lots of unique tickets via combinatorics in the generator.

export const SUPPLIERS = [
  "Agoda",
  "Expedia",
  "Booking.com",
  "Priceline",
  "Hotelbeds",
  "Direct",
];

export const BRANDS = ["Lodging Support", "Reservations", "Post Stay", "Group Support"];
export const STATUSES = ["New", "Open", "Pending", "Solved"];
export const BOOKING_TYPES = ["PREPAID", "PAY_AT_HOTEL", "VOUCHER", "GROUP"];

export const FIRST_NAMES = [
  "Meredith",
  "Trisha",
  "Denver",
  "Brianna",
  "Christopher",
  "Joseph",
  "Olivia",
  "Sophia",
  "Ethan",
  "Noah",
  "Ava",
  "Mia",
  "Isabella",
  "Liam",
  "Amelia",
];

export const LAST_NAMES = [
  "Fishman",
  "Cole",
  "Harris",
  "Woods",
  "Jackson",
  "Moore",
  "Davis",
  "Martinez",
  "Johnson",
  "Brown",
  "Wilson",
  "Thompson",
  "Anderson",
  "Clark",
  "Rodriguez",
];

export const HOTELS = [
  { name: "Wyndham Grand Orlando Resort Bonnet Creek", phone: "407-390-2300", city: "Orlando", state: "FL" },
  { name: "Hyatt Regency Miami", phone: "305-358-1234", city: "Miami", state: "FL" },
  { name: "Four Seasons Nashville", phone: "615-610-6999", city: "Nashville", state: "TN" },
  { name: "The Westin Times Square", phone: "212-201-2700", city: "New York", state: "NY" },
  { name: "Marriott Marquis San Diego Marina", phone: "619-234-1500", city: "San Diego", state: "CA" },
  { name: "Sheraton New Orleans", phone: "504-525-2500", city: "New Orleans", state: "LA" },
  { name: "Embassy Suites Las Vegas", phone: "702-795-2800", city: "Las Vegas", state: "NV" },
  { name: "Best Western Plus Dallas Love Field", phone: "214-353-8444", city: "Dallas", state: "TX" },
  { name: "Holiday Inn Express Atlanta Downtown", phone: "404-524-5555", city: "Atlanta", state: "GA" },
  { name: "Caribe Internacional Cancun", phone: "+52 998 000 0000", city: "Cancun", state: "QR" },
  { name: "InterContinental Miami", phone: "305-577-1000", city: "Miami", state: "FL" },
  { name: "JW Marriott Austin", phone: "512-474-4777", city: "Austin", state: "TX" },
];

// The generator stitches these together:
//   description = issue + context + evidence
// Placeholders: {itinerary} {hotel} {city} {state} {supplier} {policy} {bookingType}
export const CONTEXT_SNIPPETS = [
  "Guest is checking in today and is currently at the front desk.",
  "Guest check-in is within 24 hours and they need written confirmation.",
  "Guest says the hotel redirected them back to us.",
  "Guest requests clear next steps and a firm update timeline.",
  "Guest is traveling for work and needs documentation.",
];

export const EVIDENCE_SNIPPETS = [
  "Guest can forward screenshots/receipts by email if needed.",
  "Guest confirms their best callback number is on file.",
  "Guest states they never stayed and wants charges reviewed.",
  "Guest says the booking shows policy: {policy}.",
  "Guest says the booking source is {supplier} and booking type is {bookingType}.",
];

// 48 case keys (must match matrix.json exactly).
// Each case keeps it small: 1 subject, 1 issue snippet.
// Subjects align to the patterns you use in your solver rules. :contentReference[oaicite:2]{index=2}
export const CASE_DEFS = [
  { caseKey: "Ticket | Reservation not found at check-in", weight: 5, tags: ["checkin"], subjectTemplates: ["Reservation not found at check-in -- ({itinerary})"], issueSnippets: ["Hotel cannot find itinerary {itinerary} under the guest name."] },
  { caseKey: "Ticket | Overbooking leading to relocation (“walked” reservation) or Hotel Is Closed Down", weight: 4, tags: ["walked"], subjectTemplates: ["Overbooked / walked reservation -- ({itinerary})"], issueSnippets: ["Hotel advised they cannot honor the reservation (overbooked/closed)."] },
  { caseKey: "Ticket | Incorrect guest name or modifying name", weight: 4, tags: ["name"], subjectTemplates: ["Incorrect guest name -- ({itinerary})"], issueSnippets: ["Guest name is incorrect/misspelled and hotel will not check them in."] },
  { caseKey: "Ticket | Incorrect  dates or modifying dates", weight: 5, tags: ["dates"], subjectTemplates: ["Incorrect dates / modify dates -- ({itinerary})"], issueSnippets: ["Guest says the reservation dates are incorrect and need modification."] },
  { caseKey: "Ticket | Incorrect number of guests or modifying guest count", weight: 4, tags: ["occupancy"], subjectTemplates: ["Incorrect occupancy / guest count -- ({itinerary})"], issueSnippets: ["Hotel says occupancy does not match and guest count needs correction."] },
  { caseKey: "Ticket | Payment declined at check-in despite prepayment", weight: 4, tags: ["payment"], subjectTemplates: ["Payment declined at check-in -- ({itinerary})"], issueSnippets: ["Hotel says payment declined even though booking was prepaid."] },
  { caseKey: "Ticket | Rebooking due to wrong hotel booked or modifying to a new hotel", weight: 5, tags: ["rebook"], subjectTemplates: ["Wrong hotel booked / rebook -- ({itinerary})"], issueSnippets: ["Guest says they booked the wrong hotel and wants to switch properties."] },
  { caseKey: "Ticket | Shuttle not available to get to property", weight: 2, tags: ["shuttle"], subjectTemplates: ["Shuttle not available -- ({itinerary})"], issueSnippets: ["Guest expected a shuttle but property says no shuttle is available."] },
  { caseKey: "Ticket | Early check-in or late check-out requests", weight: 2, tags: ["early_late"], subjectTemplates: ["Early check-in / late check-out request -- ({itinerary})"], issueSnippets: ["Guest requests early check-in or late check-out and wants approval."] },
  { caseKey: "Ticket | Early check-in or late check-out not honored", weight: 2, tags: ["early_late"], subjectTemplates: ["Early/late request not honored -- ({itinerary})"], issueSnippets: ["Guest states the hotel did not honor the early/late request."] },
  { caseKey: "Ticket | Hotel unaware of special requests or notes", weight: 2, tags: ["notes"], subjectTemplates: ["Hotel unaware of notes -- ({itinerary})"], issueSnippets: ["Guest says notes/special requests were added but hotel cannot see them."] },
  { caseKey: "Ticket | Additional deposits or incidentals required unexpectedly", weight: 2, tags: ["deposit"], subjectTemplates: ["Unexpected deposit/incidentals -- ({itinerary})"], issueSnippets: ["Guest is upset about an unexpected deposit/incidentals at check-in."] },
  { caseKey: "Ticket | Long wait times or poor service at check-in", weight: 2, tags: ["service"], subjectTemplates: ["Poor service / long check-in wait -- ({itinerary})"], issueSnippets: ["Guest reports poor service or long wait time at check-in."] },
  { caseKey: "Ticket | Duplicate bookings made accidentally", weight: 2, tags: ["duplicate"], subjectTemplates: ["Duplicate booking made accidentally -- ({itinerary})"], issueSnippets: ["Guest states they booked twice and needs one cancelled."] },
  { caseKey: "Ticket | Room type, Bed type or accessibility features not honored or Modifying Room Request", weight: 2, tags: ["room"], subjectTemplates: ["Room/bed type not honored -- ({itinerary})"], issueSnippets: ["Hotel did not honor the booked room/bed type or guest needs room request modified."] },
  { caseKey: "Ticket | Promised amenities missing (breakfast, parking, Wi-Fi, view)", weight: 2, tags: ["amenities"], subjectTemplates: ["Promised amenities missing -- ({itinerary})"], issueSnippets: ["Guest says promised amenities were missing or hotel is charging."] },
  { caseKey: "Ticket | Rate does not include expected inclusions", weight: 2, tags: ["inclusions"], subjectTemplates: ["Rate inclusions dispute -- ({itinerary})"], issueSnippets: ["Guest disputes what is included in the rate."] },
  { caseKey: "Ticket | Hotel requests payment again for a prepaid booking", weight: 2, tags: ["pay_again"], subjectTemplates: ["Hotel requests payment again -- ({itinerary})"], issueSnippets: ["Hotel says itinerary is unpaid and requests payment again."] },
  { caseKey: "Ticket | Charged more than expected  (resort fees or local fees)", weight: 2, tags: ["fees"], subjectTemplates: ["Charged more than expected -- ({itinerary})"], issueSnippets: ["Guest disputes unexpected resort/local fees."] },
  { caseKey: "Ticket | Price Matching & Complaints regarding Tax Recovery & Fees", weight: 2, tags: ["price_match"], subjectTemplates: ["Price match / tax & fees complaint -- ({itinerary})"], issueSnippets: ["Guest found a lower rate or disputes tax recovery & fees."] },
  { caseKey: "Ticket | Currency conversion discrepancies", weight: 1, tags: ["currency"], subjectTemplates: ["Currency conversion discrepancy -- ({itinerary})"], issueSnippets: ["Guest disputes currency conversion/exchange rate amounts."] },
  { caseKey: "Ticket | Refund delays after cancellation or modification", weight: 3, tags: ["refund_delay"], subjectTemplates: ["Refund Missing -- ({itinerary})"], issueSnippets: ["Guest says they cancelled/modified but refund has not been received."] },
  { caseKey: "Ticket | Discrepanies from booking refundable vs. non-refundable", weight: 2, tags: ["policy"], subjectTemplates: ["Refundable vs non-refundable discrepancy -- ({itinerary})"], issueSnippets: ["Guest disputes that the booking policy type is incorrect."] },
  { caseKey: "Ticket | Unable to \"Create a Refund\" in the refund queue", weight: 1, tags: ["refund_queue"], subjectTemplates: ["Unable to create refund in queue -- ({itinerary})"], issueSnippets: ["Agent reports refund queue error while attempting to create refund."] },
  { caseKey: "Ticket | Supplier, Hotel, and Group Calls", weight: 1, tags: ["calls"], subjectTemplates: ["Offline message / call received -- ({itinerary})"], issueSnippets: ["Offline message indicates a caller requested follow-up about booking details."] },
  { caseKey: "Ticket | Hotel Calls", weight: 1, tags: ["hotel_call"], subjectTemplates: ["Hotel called re: confirmation/payment -- ({itinerary})"], issueSnippets: ["Hotel requests confirmation/cancellation or payment verification."] },
  { caseKey: "Ticket | Supplier Calls", weight: 1, tags: ["supplier_call"], subjectTemplates: ["Supplier called requesting clarification -- ({itinerary})"], issueSnippets: ["Supplier requests clarification on cancellation/refund/payment status."] },
  { caseKey: "Ticket | Group Clients", weight: 2, tags: ["group"], subjectTemplates: ["Group client follow-up needed"], issueSnippets: ["Group client cannot reach planner or needs status update/access assistance."] },
  { caseKey: "Ticket | Cancellation & Confirmations", weight: 2, tags: ["cancel_confirm"], subjectTemplates: ["Cancellation confirmation needed -- ({itinerary})"], issueSnippets: ["Guest wants written confirmation of cancellation or status."] },
  { caseKey: "Ticket | Cancelling Refundable", weight: 3, tags: ["cancel_ref"], subjectTemplates: ["Client Requesting to Cancel -- ({itinerary})"], issueSnippets: ["Guest requests cancellation of a refundable booking."] },
  { caseKey: "Ticket | Cancelling Non Refundable", weight: 3, tags: ["cancel_nr"], subjectTemplates: ["Client Requesting to Cancel (NR) -- ({itinerary})"], issueSnippets: ["Guest requests cancellation of a non-refundable booking and requests exception."] },
  { caseKey: "Ticket | Conflicting information between hotel and booking provider", weight: 2, tags: ["conflict"], subjectTemplates: ["Conflicting info - hotel vs provider -- ({itinerary})"], issueSnippets: ["Hotel and provider notes conflict; guest wants reconciliation."] },
  { caseKey: "Ticket | Guest directed to the wrong customer service provider", weight: 2, tags: ["wrong_provider"], subjectTemplates: ["Guest sent to wrong provider -- ({itinerary})"], issueSnippets: ["Guest was redirected multiple times and wants one point of resolution."] },
  { caseKey: "Ticket | Confirmation email not received or went to spam", weight: 4, tags: ["confirmation"], subjectTemplates: ["Confirmation email not received -- ({itinerary})"], issueSnippets: ["Guest did not receive confirmation email and needs it resent."] },
  { caseKey: "Ticket | Delayed or unclear resolution timelines", weight: 3, tags: ["timeline"], subjectTemplates: ["No update yet -- ({itinerary})"], issueSnippets: ["Guest requests an update and clear timeline."] },
  { caseKey: "Ticket | Post Stay Issues", weight: 2, tags: ["post_stay"], subjectTemplates: ["Post-stay issue -- ({itinerary})"], issueSnippets: ["Guest has a post-stay issue and wants follow-up."] },
  { caseKey: "Ticket | Incorrect final charges", weight: 2, tags: ["charges"], subjectTemplates: ["Incorrect final charges -- ({itinerary})"], issueSnippets: ["Guest says final charges do not match expectation."] },
  { caseKey: "Ticket | Missing or delayed refunds", weight: 3, tags: ["refund"], subjectTemplates: ["Missing refund -- ({itinerary})"], issueSnippets: ["Guest says refund is missing/delayed and requests confirmation."] },
  { caseKey: "Ticket | Disputes over no-show or cancellation fees", weight: 2, tags: ["no_show"], subjectTemplates: ["No-show/cancellation fee dispute -- ({itinerary})"], issueSnippets: ["Guest disputes a no-show or cancellation fee."] },
  { caseKey: "Ticket | Hotel provided internal receipt to guest", weight: 2, tags: ["folio"], subjectTemplates: ["Hotel folio differs from charge -- ({itinerary})"], issueSnippets: ["Guest provided hotel folio showing a different total than charged."] },
  { caseKey: "Ticket | Needs receipt or invoice", weight: 4, tags: ["receipt"], subjectTemplates: ["Needs receipt / invoice -- ({itinerary})"], issueSnippets: ["Guest requests an itemized receipt/folio for reimbursement."] },
  { caseKey: "Ticket | Double Charged", weight: 3, tags: ["double_charge"], subjectTemplates: ["Double charged -- ({itinerary})"], issueSnippets: ["Guest claims they were charged twice and requests review."] },
  { caseKey: "Ticket | Mismatch between listing description and actual property", weight: 1, tags: ["listing"], subjectTemplates: ["Property not as described -- ({itinerary})"], issueSnippets: ["Guest says property did not match listing description/photos."] },
  { caseKey: "Ticket | Early departure after check in  (R and NR)", weight: 1, tags: ["early_departure"], subjectTemplates: ["Early departure after check-in -- ({itinerary})"], issueSnippets: ["Guest checked in but left early and wants refund for unused nights."] },
  { caseKey: "Ticket | Asking for a refund on \"REFUND PROTECTION PLAN\"", weight: 1, tags: ["rpp"], subjectTemplates: ["Refund Protection Plan refund request -- ({itinerary})"], issueSnippets: ["Guest requests refund of the Refund Protection Plan."] },
  { caseKey: "Ticket | Promised accessible or handicapped room was not provided", weight: 1, tags: ["accessible"], subjectTemplates: ["Accessible room not provided -- ({itinerary})"], issueSnippets: ["Guest required an accessible room but it was not provided."] },
  { caseKey: "Ticket | Call Review Needed", weight: 1, tags: ["call_review"], subjectTemplates: ["Call review needed -- ({itinerary})"], issueSnippets: ["Ticket flagged for call review to confirm what was promised."] },
  { caseKey: "Ticket | Legal or Government Complaints", weight: 1, tags: ["legal"], subjectTemplates: ["Legal escalation / BBB complaint -- ({itinerary})"], issueSnippets: ["Guest threatens legal/government complaint and requests written response."] },
];

export const CASE_KEYS = CASE_DEFS.map((c) => c.caseKey);