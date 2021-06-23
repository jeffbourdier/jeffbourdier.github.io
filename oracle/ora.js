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
 * @constant {string[]}
 */
var KEYWORDS = ["ADD", "ALTER", "AND", "AS", "BEFORE", "BEGIN", "BETWEEN", "BITAND", "BOOLEAN", "BULK", "BY",
  "CASE", "CEIL", "CHAR", "CHECK", "COLLECT", "COLUMN", "CONNECT", "CONSTRAINT", "COUNT", "CREATE", "CURSOR",
  "DATE", "DECLARE", "DEFAULT", "DISTINCT", "DROP", "DUAL", "EACH", "ELSE", "END", "EXCEPTION", "EXIT", "EXTEND",
  "FALSE", "FIRST", "FLOOR", "FOR", "FROM", "FUNCTION", "GROUP", "IF", "IN", "INDEX", "INDEXTYPE", "INNER",
  "INSERT", "INTEGER", "INTO", "IS", "JOIN", "KEY", "LAST", "LEVEL", "LIKE", "LISTAGG", "LOOP", "MAX", "MIN",
  "MODIFY", "NOCOPY", "NOT", "NULL", "NUMBER", "OF", "ON", "OR", "ORDER", "OTHERS", "OUT", "PLS_INTEGER",
  "PRIMARY", "PROCEDURE", "RAISE", "RAISE_APPLICATION_ERROR", "RAW", "REFERENCES", "REGEXP_SUBSTR", "REPLACE",
  "RETURN", "ROW", "ROWTYPE", "SELECT", "SIGN", "SIGNTYPE", "SQLERRM", "SUBSTR", "SYS_CONTEXT", "SYS_GUID", "TABLE",
  "THEN", "TRIGGER", "TRIM", "TRUE", "TYPE", "UPDATE", "UPPER", "VALUES", "VARCHAR2", "WHEN", "WHERE", "WITHIN"];


/**
 * Replace the HTML markup of a <pre> element representing a block of preformatted text
 * (i.e., Oracle SQL code) with a set of nodes containing syntax-highlighted tokens.
 * @param {Object} element  <pre> element containing Oracle SQL code.
 */
function highlightSyntax(element)
{
  var html, nodes = [], chars = [], j = 0, i, fn, k, s;

  /* Because "angle brackets" get converted to character reference names, the HTML markup must
   * be "pre-processed" to "unconvert" them so that they will be parsed and rendered properly.
   */
  html = element.innerHTML;
  html = html.replace(/&lt;/g, "<");
  html = html.replace(/&gt;/g, ">");

  /* Iterate through each character of the HTML markup, looking for highlightable tokens. */
  for (i = 0; i < html.length; i++)
  {
    /* Determine if a highlightable token begins at this index. */
    fn = startComment(html, i);
    if (fn == null) fn = startString(html, i);
    if (fn == null) fn = startNumber(html, i);
    if (fn == null) fn = startDelimiter(html, i);

    /* If no other highlightable token begins at this index, start/continue
     * building another token, which might (or might not) be a keyword.
     */
    if (fn == null)
    {
      k = buildToken(chars, html, i);
      if (k >= 0) { i = k; continue; }
    }

    /* Either a highlightable token begins at this index, or another token (which might be a keyword) was explicitly
     * terminated (when a non-keyword character was encountered).  Either way, if the token in progress does not
     * represent a keyword, reset the token (and if no other highlightable token was found, move on to the next character).
     * Otherwise, the token is indeed a keyword, which is a highlightable token, so prepare to process it as such.
     */
    k = getKeywordIndex(chars);
    if (k < 0)
    {
      chars.splice(0);
      if (fn == null) continue;
    }
    else i -= chars.length;

    /* Process any intervening (unhighlighted) text. */
    processText(html, j, i, nodes);

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
    j = fn(html, i, nodes);
    i = j - 1;
  }

  /* Process any last bit of (unhighlighted) text.  (This is most likely to
   * be an empty string, since every statement should end with a semicolon.)
   */
  processText(html, j, -1, nodes);

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
  var j, b, s, c = html.charCodeAt(i);

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

  /* If the character is not valid for a keyword, terminate the token. */
  if (!b) return -1;

  /* Either we're starting a new token, or there is one already in progress.
   * Either way, the character is valid for a keyword, so add it to the token.
   */
  s = String.fromCharCode(c);
  chars.push(s);
  return i;
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
 * @returns {number}      If array of characters represents a keyword, its index in the global KEYWORDS array; otherwise, -1.
 */
function getKeywordIndex(chars)
{
  if (chars.length < 1) return -1;
  var s = chars.join("");
  return KEYWORDS.indexOf(s);
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
  /* The number literal ends when a non-numeric character is encountered (or the HTML markup ends).
   * The one exception is a decimal point, which is considered part of the number literal.
   */
  var j, c, s, decimal = false;
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
  /* Don't attempt to process an empty or inverted string. */
  if (start >= html.length || (end >= 0 && start >= end)) return;

  /* A negative 'end' value means to extract characters to the end of the HTML markup. */
  var s = (end < 0) ? html.substr(start) : html.substring(start, end);
  var node = document.createTextNode(s);
  nodes.push(node);
}
