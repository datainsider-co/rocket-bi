export class QueryUtils {
  static isLimitQuery(query: string) {
    const existLimitRegex = new RegExp(/\w*(limit)\s+[0-9]+/);
    return existLimitRegex.test(query);
  }

  /**
   * Extracts the AI command from a query.
   * Extracts the context following the `//@AI` command and subsequent comment lines
   * that start with `//` from the provided text.
   * The regex captures the command variations such as `//@AI`, `//@Ai`, `//@aI`, and `//@ai`,
   * and collects all the lines starting with `//` until a line that does not start with `//` is encountered.
   * @param {string} query - The query to extract AI command from.
   * @return {string} - The extracted AI command.
   */
  static extractAICommand(query: string): string {
    const regex = /\/\/@ai\s+([^\n]+)(\n\/\/[^\n]*)*/gi;
    // Use match to get all matching groups
    const match = query.match(regex);

    if (match) {
      // Remove the `//@AI` and `//` prefixes and join the lines with newline
      return match[0]
        .split('\n')
        .map(line => line.replace(/\/\/@ai\s*/i, '').replace(/\/\/\s*/, ''))
        .join('\n');
    }

    return '';
  }

  /**
   * Checks if the given text contains the `//@AI` command pattern or its case variations.
   *
   * The function looks for any of the following command variations: `//@AI`, `//@Ai`, `//@aI`, `//@ai`,
   * followed by some text and optional subsequent comment lines starting with `//`.
   *
   * @param {string} text - The input text to check for the pattern.
   * @returns {boolean} - Returns `true` if the pattern is found, otherwise `false`.
   */
  static hasAICommand(text: string): boolean {
    // Define the regular expression pattern with case-insensitive flag 'i'
    const pattern = /\/\/@ai\s+([^\n]+)(\n\/\/[^\n]*)*/gi;

    // Test if the pattern exists in the text
    return pattern.test(text);
  }

  /**
   * Extracts the text that appears after the `//@AI` command (or its case variations)
   * and any subsequent comment lines starting with `//`.
   *
   * @param {string} text - The input text to check for the `//@AI` pattern and extract the text following it.
   * @returns {string | null} - Returns the text after the `//@AI` command block or `null` if no match is found.
   */
  static getTextAfterAICommand(text: string): string {
    // Define the regex to match the `//@AI` block and capture the text after it
    const pattern = /\/\/@ai\s+([^\n]+)(\n\/\/[^\n]*)*\n([\s\S]*)/gi;

    // Match the pattern and capture the text after the command block
    const match = pattern.exec(text);

    // If a match is found, return the text after the command block
    return match ? match[3].trim() : '';
  }
}
