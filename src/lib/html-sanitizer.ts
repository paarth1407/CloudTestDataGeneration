import { load } from 'cheerio';

/**
 * Extracts the visible, text-based markup from a raw HTML document.
 *
 * The goal is to drastically reduce token usage for the LLM while still
 * preserving enough structural context (input elements, labels, table rows,
 * etc.) so that the `analyzeHtmlForm` prompt can accurately infer field
 * names and types.
 *
 * 1.  Scripts / styles / meta content are removed entirely.
 * 2.  Only the contents of the `<body>` tag are returned.
 * 3.  Excess whitespace is collapsed to a single space to further shrink
 *     the prompt size.
 */
export function extractRelevantHtml(rawHtml: string): string {
  try {
    const $ = load(rawHtml);

    // Remove non-semantic elements that do not contribute to form analysis
    $('script, style, noscript, meta, link').remove();

    // Cheerio's html() returns undefined if body is missing
    const body = $('body').html() ?? rawHtml;

    // Collapse consecutive whitespace/newlines to a single space to save tokens
    return body.replace(/\s+/g, ' ').trim();
  } catch (err) {
    // If anything goes wrong, fall back to the original HTML so that we don't
    // silently break form analysis.
    return rawHtml;
  }
}
