import { queryGBrain, parseGbrainResults } from "../lib/gbrain-client.mjs";
import { summarizeEmails } from "../lib/gemini-client.mjs";

/**
 * Email Agent - Searches email memory, filters relevant emails, extracts action items.
 */

/**
 * Filter raw GBrain search results to only contain email matches.
 * @param {string} rawResults
 * @returns {string} Reconstructed raw result string
 */
function filterRawResultsToEmails(rawResults) {
  if (!rawResults || rawResults.trim().length === 0) return "";
  const matches = parseGbrainResults(rawResults);
  const emailMatches = matches.filter((m) => m.slug.startsWith("email-"));
  
  return emailMatches.map(m => {
    return `${m.header}\n${m.bodyLines.join("\n")}`;
  }).join("\n\n");
}

/**
 * Search emails by topic using semantic search.
 * @param {string} query - Search query
 * @param {string|null} sender - Optional sender filter
 * @returns {Promise<string>} Formatted results
 */
export async function searchEmails(query, sender = null) {
  let searchQuery = query;
  if (sender) {
    searchQuery = `from ${sender} ${query}`;
  }

  const rawResults = queryGBrain(searchQuery);

  if (!rawResults || rawResults.trim().length === 0) {
    return "No relevant emails found. Try broadening your search terms.";
  }

  // Parse all matches into structured blocks
  const allMatches = parseGbrainResults(rawResults);

  // Filter: ONLY include results that are emails (slug starts with 'email-')
  let emailMatches = allMatches.filter((m) => m.slug.startsWith("email-"));

  // Filter by sender if specified
  if (sender) {
    emailMatches = emailMatches.filter((m) => {
      const fromLine = m.bodyLines.find(l => l.toLowerCase().startsWith("from:"));
      return fromLine && fromLine.toLowerCase().includes(sender.toLowerCase());
    });
  }

  if (emailMatches.length === 0) {
    return sender 
      ? `No emails found from "${sender}" matching your search.`
      : "No relevant emails found matching your search.";
  }

  return formatEmailSearchResults(emailMatches);
}

/**
 * Get recent emails for summarization.
 * @returns {Promise<string>} Summarized emails
 */
export async function summarizeTodaysEmails() {
  // Search for recent emails
  const rawResults = queryGBrain("email subject from");
  const filtered = filterRawResultsToEmails(rawResults);

  if (!filtered || filtered.trim().length === 0) {
    return "No emails found in memory. Make sure the ingestion pipeline has run.";
  }

  try {
    const summary = await summarizeEmails(filtered, "daily");
    return summary;
  } catch (err) {
    return "Summarization is temporarily unavailable. Please try again.";
  }
}

/**
 * Get important emails ranked by priority.
 * @returns {Promise<string>}
 */
export async function getImportantEmails() {
  const rawResults = queryGBrain("urgent important deadline ASAP security alert action required");
  const filtered = filterRawResultsToEmails(rawResults);

  if (!filtered || filtered.trim().length === 0) {
    return "No important emails found in recent messages.";
  }

  try {
    const summary = await summarizeEmails(filtered, "important");
    return summary;
  } catch (err) {
    return "Summarization is temporarily unavailable. Please try again.";
  }
}

/**
 * Extract action items from recent emails.
 * @returns {Promise<string>}
 */
export async function extractActionItems() {
  const rawResults = queryGBrain("action required please do deadline follow up task");
  const filtered = filterRawResultsToEmails(rawResults);

  if (!filtered || filtered.trim().length === 0) {
    return "No pending action items detected in recent emails. Try expanding your search range.";
  }

  try {
    const summary = await summarizeEmails(filtered, "action_items");
    return summary;
  } catch (err) {
    return "Action item extraction is temporarily unavailable. Please try again.";
  }
}

/**
 * Format raw GBrain results into a readable format.
 */
function formatEmailSearchResults(matches) {
  return matches.slice(0, 5).map((m, i) => {
    // Subject header is after " -- "
    const subjectHeader = m.header.split(" -- ")[1] || "";
    const subject = subjectHeader.replace("# Email: ", "").replace("# Email:", "").trim();
    
    const fromLine = m.bodyLines.find(l => l.startsWith("From:")) || "";
    const dateLine = m.bodyLines.find(l => l.startsWith("Date:")) || "";
    
    // Extract snippet: skip metadata headers and join non-empty lines
    const snippet = m.bodyLines
      .filter(l => !l.startsWith("From:") && !l.startsWith("To:") && !l.startsWith("Subject:") && !l.startsWith("Date:") && l.trim().length > 0)
      .join(" ")
      .substring(0, 150)
      .trim();

    let result = `✉️ **Email ${i + 1}**\n`;
    result += `• **Subject:** ${subject || "(No Subject)"}\n`;
    if (fromLine) result += `• **${fromLine}**\n`;
    if (dateLine) result += `• **${dateLine}**\n`;
    if (snippet) result += `• **Snippet:** ${snippet}...`;
    return result;
  }).join("\n\n");
}
