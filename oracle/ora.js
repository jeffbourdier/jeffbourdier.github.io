/**
 * @file       Functionality unique to the Oracle page.
 *
 * @copyright  (c) 2018 Jeffrey Paul Bourdier
 *
 * @license    MIT
 * Licensed under the MIT License.  This file may be used only in compliance with this License.
 * Software distributed under this License is provided "AS IS", WITHOUT WARRANTY OF ANY KIND.
 * For more information, see the following URL:  {@link https://opensource.org/licenses/MIT}
 */


/**
 * Set of ASCII character codes that are valid for delimiters.
 * @see [PL/SQL Language Fundamentals (Table 2-2 PL/SQL Delimiters)]{@link https://docs.oracle.com/cd/E11882_01/appdev.112/e25519/fundamentals.htm}
 * @constant {number[]}
 */
var DELIMITER_CHAR_CODES = [0x21, 0x25, 0x28, 0x29, 0x2A, 0x2B, 0x2C,
  0x2D, 0x2E, 0x2F, 0x3A, 0x3B, 0x3C, 0x3D, 0x3E, 0x40, 0x5E, 0x7C, 0x7E];


/**
 * Identifiers that have special meaning in PL/SQL (must be followed and preceded by non-keyword characters).
 * @see [PL/SQL Reserved Words and Keywords]{@link https://docs.oracle.com/cd/E11882_01/appdev.112/e25519/reservewords.htm}
 * For performance reasons, this list should be sorted by frequency (descending).
 * @constant {string[]}
 */
var KEYWORDS = [
  "SELECT", "FROM", "END", "IN", "IF", "AS", "TABLE", "VARCHAR2", "LOOP", "THEN", "IS", "NULL", "BY", "WHERE", "ORDER",
  "BEGIN", "FOR", "INTO", "CREATE", "WHEN", "ON", "ELSE", "DECLARE", "AND", "COUNT", "NUMBER", "CONSTRAINT",
  "BULK", "COLLECT", "TYPE", "TRIM", "NOT", "DUAL", "CASE", "UPPER", "SUBSTR", "ALTER", "KEY", "PRIMARY", "OF",
  "MIN", "MAX", "CHECK", "INSERT", "OR", "JOIN", "INNER", "BOOLEAN", "RETURN", "PROCEDURE", "ROWTYPE", "REFERENCES",
  "DEFAULT", "INTEGER", "CEIL", "FIRST", "LAST", "BITAND", "VALUES", "GROUP", "DISTINCT", "OUT", "PLS_INTEGER",
  "BETWEEN", "ADD", "DROP", "EXCEPTION", "CHAR", "EXTEND", "FLOOR", "NOCOPY", "REPLACE", "REGEXP_SUBSTR", "LEVEL",
  "UPDATE", "LIKE", "ASC", "FUNCTION", "OTHERS", "INDEX", "INDEXTYPE", "COLUMN", "TRIGGER", "ROW",
  "CURSOR", "SYS_CONTEXT", "LISTAGG", "TRUE", "FALSE", "SQLERRM", "RAISE", "RAISE_APPLICATION_ERROR",
  "CONNECT", "MODIFY", "EACH", "BEFORE", "WITHIN", "SIGN", "SIGNTYPE", "RAW", "SYS_GUID"];


/**
 * Replace the HTML markup of a <pre> element representing a block of preformatted text
 * (i.e., Oracle SQL code) with a set of nodes containing syntax-highlighted tokens.
 * @param {Object} element  <pre> element containing Oracle SQL code.
 */
function highlightSyntax(element)
{
  var nodes, chars, j, i, fn, k, s;

  nodes = [];
  chars = [];
  j = 0;

  /* Iterate through each character of the HTML markup, looking for highlightable tokens. */
  for (i = 0; i < element.innerHTML.length; i++)
  {
    /* Determine if a highlightable token begins at this index. */
    fn = startComment(element.innerHTML, i);
    if (fn == null) fn = startString(element.innerHTML, i);
    if (fn == null) fn = startNumber(element.innerHTML, i);
    if (fn == null) fn = startDelimiter(element.innerHTML, i);

    /* If no other highlightable token begins at this index, start/continue
     * building another token, which might (or might not) be a keyword.
     */
    if (fn == null)
    {
      k = buildToken(chars, element.innerHTML, i);
      if (k >= 0) { i = k; continue; }
    }

    /* Either a highlightable token begins at this index, or another token (which might be a keyword) was explicitly
     * terminated (when a non-keyword character was encountered).  Either way, if the token in progress does indeed
     * represent a keyword, it becomes a highlightable token, so prepare to process it as such.  Otherwise (the token
     * is not a keyword), reset the token (and if no other highlightable token was found, move on to the next character).
     */
    if (isKeyword(chars)) i -= chars.length;
    else
    {
      chars.splice(0);
      if (fn == null) continue;
    }

    /* Process any intervening (unhighlighted) text. */
    processText(element.innerHTML, j, i, nodes);

    /* Process any keyword (from a token in progress), making sure to reset the token (and
     * again, if no other highlightable token was found, move on to the next character).
     */
    if (chars.length > 0)
    {
      s = chars.join("");
      addElement("keyword", s, nodes);
      i += chars.length;
      chars.splice(0);
      if (fn == null) { j = i; continue; }
    }

    /* Finally, process any highlightable token that was found. */
    j = fn(element.innerHTML, i, nodes);
    i = j - 1;
  }

  /* Process any last bit of (unhighlighted) text.  (This is most likely to
   * be an empty string, since every statement should end with a semicolon.)
   */
  processText(element.innerHTML, j, -1, nodes);

  /* Replace the HTML markup of the <pre> element with the resulting set of nodes. */
  element.innerHTML = "";
  for (i = 0; i < nodes.length; i++) element.appendChild(nodes[i]);
}


/**
 * Determine whether or not a comment starts at the indicated index of a <pre> element's HTML markup.
 * @private
 * @param {string} html  HTML markup from the <pre> element.
 * @param {number} i     Index into html.
 * @returns {Object}     Function to process the comment, or null.
 */
function startComment(html, i)
{
  var s = html.substr(i, 2);
  return (s == "/*" || s == "--") ? processComment : null;
}


/**
 * Determine whether or not a string literal starts at the indicated index of a <pre> element's HTML markup.
 * @private
 * @param {string} html  HTML markup from the <pre> element.
 * @param {number} i     Index into html.
 * @returns {Object}     Function to process the string literal, or null.
 */
function startString(html, i) { return (html.charAt(i) == "'") ? processString : null; }


/**
 * Determine whether or not a number literal starts at the indicated index of a <pre> element's HTML markup.
 * @private
 * @param {string} html  HTML markup from the <pre> element.
 * @param {number} i     Index into html.
 * @returns {Object}     Function to process the number literal, or null.
 */
function startNumber(html, i)
{
  var c = html.charCodeAt(i);

  /* A numeric character starts a number literal if the previous character was not a letter (e.g., as in 'VARCHAR2'). */
  if (c >= 0x30 && c <= 0x39)
  {
    if (i == 0) return processNumber;
    c = html.charCodeAt(i - 1);
    if (c < 0x41 || c > 0x7A) return processNumber;
    return (c > 0x5A && c < 0x61) ? processNumber : null;
  }

  /* A minus can start a number literal, but only if the next character is numeric. */
  if (c != 0x2D || i == (html.length - 1)) return null;
  c = html.charCodeAt(i + 1);
  return (c < 0x30 || c > 0x39) ? null : processNumber;
}


/**
 * Determine whether or not a delimiter starts at the indicated index of a <pre> element's HTML markup.
 * @private
 * @param {string} html  HTML markup from the <pre> element.
 * @param {number} i     Index into html.
 * @returns {Object}     Function to process the delimiter, or null.
 */
function startDelimiter(html, i)
{
  var c = html.charCodeAt(i);
  return isDelimiterCharCode(c) ? processDelimiter : null;
}


/**
 * Process the character at the indicated index of a <pre> element's
 * HTML markup with respect to the token in progress (if any).
 * @private
 * @param {string} chars  Array of characters representing the token in progress (may be empty).
 * @param {string} html   HTML markup from the <pre> element.
 * @param {number} i      Index (into html) of character to process.
 * @returns {number}      Ending index of the token/character, or -1 to terminate the token.
 */
function buildToken(chars, html, i)
{
  var c, j, b, s;

  c = html.charCodeAt(i);

  /* If there is no token in progress, either start one (if appropriate) or advance to the next token/character. */
  if (chars.length < 1)
  {
    /* A quoted identifier is user-defined, which means it is not a keyword, so "skip" it by advancing
     * to the next double-quote (or to the end of the HTML markup if no other double-quote is found).
     */
    if (c == 0x22)
    {
      j = html.indexOf('"', i + 1);
      return (j < 0) ? html.length : j;
    }

    /* A keyword must begin with a capital letter. */
    if (c < 0x41 || c > 0x5A) return i;

    /* Begin building a token (i.e., a potential keyword). */
    b = true;
  }
  else b = isKeywordCharCode(c);

  /* Either we're starting a new token, or there is one already in progress.
   * Either way, if the character is valid for a keyword, add it to the token.
   */
  if (b)
  {
    s = String.fromCharCode(c);
    chars.push(s);
    return i;
  }

  /* The character is not valid for a keyword, so terminate the token. */
  return -1;
}


/**
 * Determine whether or not an ASCII character code is valid for a keyword.
 * @private
 * @param {number} c   ASCII character code.
 * @returns {boolean}  True if a keyword could include the character; otherwise, false.
 */
function isKeywordCharCode(c)
{
  /* Capital letters are valid. */
  if (c >= 0x41 && c <= 0x5A) return true;

  /* Digits are valid. */
  if (c >= 0x30 && c <= 0x39) return true;

  /* Dollar sign, number sign, and underscore are valid. */
  if (c == 0x24 || c == 0x23 || c == 0x5F) return true;

  /* Anything else is invalid. */
  return false;
}


/**
 * Determine whether or not an array of characters represents a keyword.
 * @private
 * @param {string} chars  Array of characters (potential keyword).
 * @returns {boolean}     True if array of characters represents a keyword; otherwise, false.
 */
function isKeyword(chars)
{
  var s;

  if (chars.length < 1) return false;
  s = chars.join("");
  return (KEYWORDS.indexOf(s) >= 0);
}


/**
 * Create a new <span> element of the "comment" class, containing a comment from
 * the HTML markup of a <pre> element, and add the new node to the end of a NodeList.
 * @private
 * @param {string} html     HTML markup from the <pre> element.
 * @param {number} i        Starting index of the comment.
 * @param {Object[]} nodes  NodeList to add the new node to.
 * @returns {number}        Ending index of the comment.
 */
function processComment(html, i, nodes)
{
  var j, s;

  /* The expected ending depends on what kind of comment this is (single-line or multiline). */
  if (html.substr(i, 2) == "/*") j = html.indexOf("*/", i) + 2;
  else
  {
    j = html.indexOf("\r\n", i);
    if (j < 0) j = html.indexOf("\n", i);
  }

  /* If the expected ending was not found, the comment ends when the HTML markup ends.  Otherwise, the
   * expected ending was found, so return the next index (i.e., that of the first character after the comment).
   */
  if (j < 0)
  {
    s = html.substr(i);
    j = html.length;
  }
  else s = html.substring(i, j);
  addElement("comment", s, nodes);
  return j;
}


/**
 * Create a new <span> element of the "string" class, containing a string literal from
 * the HTML markup of a <pre> element, and add the new node to the end of a NodeList.
 * @private
 * @param {string} html     HTML markup from the <pre> element.
 * @param {number} i        Starting index of the string literal.
 * @param {Object[]} nodes  NodeList to add the new node to.
 * @returns {number}        Ending index of the string literal.
 */
function processString(html, i, nodes)
{
  var j, s;

  /* The string literal ends with the next single-quote that is not followed by another single-quote. */
  for (j = i; j > 0 && html.charAt(j) == "'"; j = html.indexOf("'", j + 1) + 1);

  /* If the expected ending was not found, the string literal ends when the HTML markup ends.  Otherwise, the
   * expected ending was found, so return the next index (i.e., that of the first character after the string literal).
   */
  if (j < 1)
  {
    s = html.substr(i);
    j = html.length;
  }
  else s = html.substring(i, j);
  addElement("string", s, nodes);
  return j;
}


/**
 * Create a new <span> element of the "number" class, containing a number literal from
 * the HTML markup of a <pre> element, and add the new node to the end of a NodeList.
 * @private
 * @param {string} html     HTML markup from the <pre> element.
 * @param {number} i        Starting index of the number literal.
 * @param {Object[]} nodes  NodeList to add the new node to.
 * @returns {number}        Ending index of the number literal.
 */
function processNumber(html, i, nodes)
{
  var decimal, j, c, s;

  /* The number literal ends when a non-numeric character is encountered (or the HTML markup ends).
   * The one exception is a decimal point, which is considered part of the number literal.
   */
  decimal = false;
  for (j = i + 1; j < html.length; j++)
  {
    c = html.charCodeAt(j);

    /* If the character is numeric, the number literal has not yet ended. */
    if (c >= 0x30 && c <= 0x39) continue;

    /* The character is not numeric.  If it is not a decimal point, or if a
     * decimal point has already been encountered, the number literal has ended.
     */
    if (c != 0x2E || decimal) break;

    /* The character is a decimal point, but it is allowed only if the next character is numeric.
     * If the next character is not numeric (or there is no next character), the number literal has ended.
     */
    j++;
    if (j == html.length) break;
    c = html.charCodeAt(j);
    if (c < 0x30 || c > 0x39) break;

    /* The next character is numeric, so the decimal point is allowed.
     * Only one is allowed, though, so indicate that it has been encountered.
     */
    decimal = true;
  }

  /* If the expected ending was found, return the next index (i.e., that of the first character after the number literal).
   * (Otherwise, the expected ending was not found, so the number literal ends when the HTML markup ends.)
   */
  s = (j < html.length) ? html.substring(i, j) : html.substr(i);
  addElement("number", s, nodes);
  return j;
}


/**
 * Create a new <span> element of the "delimiter" class, containing any number of consecutive
 * delimiters from the HTML markup of a <pre> element, and add the new node to the end of a NodeList.
 * @private
 * @param {string} html     HTML markup from the <pre> element.
 * @param {number} i        Starting index of the delimiter.
 * @param {Object[]} nodes  NodeList to add the new node to.
 * @returns {number}        Ending index of the delimiter.
 */
function processDelimiter(html, i, nodes)
{
  var j, c, s;

  /* The delimiter ends when a non-delimiter character is encountered (or the HTML markup ends). */
  for (j = i + 1; j < html.length; j++)
  {
    c = html.charCodeAt(j);
    if (!isDelimiterCharCode(c)) break;
  }

  /* If the expected ending was found, return the next index (i.e., that of the first character after the delimiter).
   * (Otherwise, the expected ending was not found, so the delimiter ends when the HTML markup ends.)
   */
  s = (j < html.length) ? html.substring(i, j) : html.substr(i);
  addElement("delimiter", s, nodes);
  return j;
}


/**
 * Determine whether or not an ASCII character code is valid for a delimiter.
 * @private
 * @param {number} c   ASCII character code.
 * @returns {boolean}  True if a delimiter could include the character; otherwise, false.
 */
function isDelimiterCharCode(c) { return (DELIMITER_CHAR_CODES.indexOf(c) >= 0); }


/**
 * Create a new <span> element of a given class, containing a highlightable syntax token, and add it the end of a NodeList.
 * @private
 * @param {string} className  Class of the element.
 * @param {string} token      Highlightable syntax token.
 * @param {Object[]} nodes    NodeList to add the element to.
 */
function addElement(className, token, nodes)
{
  var element = document.createElement("span");
  element.className = className;
  element.innerHTML = token;
  nodes.push(element);
}


/**
 * Create a new text node by extracting a substring from the HTML markup
 * of a <pre> element, and add the new node to the end of a NodeList.
 * @private
 * @param {string} html     HTML markup from the <pre> element.
 * @param {number} start    Index of the first character to include in the substring.
 * @param {number} end      Index of the first character to exclude in the substring.
 * @param {Object[]} nodes  NodeList to add the new node to.
 */
function processText(html, start, end, nodes)
{
  var s, node;

  /* Don't attempt to process an empty or inverted string. */
  if (start >= html.length || (end >= 0 && start >= end)) return;

  /* A negative 'end' value means to extract characters to the end of the HTML markup. */
  s = (end < 0) ? html.substr(start) : html.substring(start, end);
  node = document.createTextNode(s);
  nodes.push(node);
}
