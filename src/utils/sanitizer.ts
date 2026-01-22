import DOMPurify from "dompurify";

export class Sanitizer {
  /**
   * Sanitizes HTML content to prevent XSS.
   * @param html The raw HTML string.
   * @returns Sanitized HTML string.
   */
  static sanitize(html: string): string {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
      FORBID_ATTR: ["onerror", "onclick", "onload"],
    });
  }
}
