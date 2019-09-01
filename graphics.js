/**
 * @file       Generic drawing functions.
 *
 * @copyright  (c) 2016 Jeffrey Paul Bourdier
 *
 * @license    MIT
 * Licensed under the MIT License.  This file may be used only in compliance with this License.
 * Software distributed under this License is provided "AS IS", WITHOUT WARRANTY OF ANY KIND.
 * For more information, see the following URL:  {@link https://opensource.org/licenses/MIT}
 */


/**
 * Namespace to be used when creating SVG elements (with createElementNS).
 * @constant {string}
 */
var NS = "http://www.w3.org/2000/svg";


/**
 * Label a particular point within an SVG element by drawing text and a leader line.
 * @param {string} svgElementId Identifer of the SVG element in which the label should be drawn.
 * @param {number} x X-coordinate of the point where the leader line should end.
 * @param {number} y Y-coordinate of the point where the leader line should end.
 * @param {number} marker If positive (> 0), the radius of a circular point marker to put
 * at the end of the leader line.  If negative (< 0), an arrowhead marker is put at the
 * end of the leader line.  Otherwise (0), nothing is put at the end of the leader line.
 * @param {number} labelX X-coordinate where the leader line should begin and the text should be anchored.
 * @param {number} labelY Y-coordinate where the leader line should begin and the text should be anchored.
 * @param {string} text Text to draw for the label.
 * @param {number} fontSize Font size to use when drawing the text, in pixels.
 * @param {string} textAnchor Value to use for the "text-anchor" attribute of the text element.
 * @param {string} color Color to use for the label.
 */
function drawLabel(svgElementId, x, y, marker, labelX, labelY, text, fontSize, textAnchor, color)
{
  var FACTOR = 3 / 4;

  var v, element, svgElement, pathElement;

  /* Get the SVG element. */
  svgElement = document.getElementById(svgElementId);

  /* If applicable, draw the leader line. */
  if (labelX && labelY)
  {
    element = initLine(labelX, labelY, x, y, color);
    if (marker < 0)
    {
      v = nameArrowheadMarker(color, true);
      element.setAttribute("marker-end", v);
    }
    svgElement.appendChild(element);
    if (marker > 0) drawCircle(svgElement, x, y, marker, color);
  }

  /* Draw the text. */
  textNode = document.createTextNode(text);
  element = document.createElementNS(NS, "text");
  element.setAttribute("x", labelX ? labelX : x);
  v = labelY ? (labelY + (FACTOR - ((labelY > y) ? 0 : 1)) * fontSize) : (y + fontSize / 2 - 1);
  element.setAttribute("y", v);
  element.setAttribute("text-anchor", textAnchor);
  element.setAttribute("fill", color);
  element.setAttribute("font-size", fontSize + "px");
  element.appendChild(textNode);
  svgElement.appendChild(element);
}


/**
 * Draw a filled circle within an SVG element (often used to mark a point).
 * @param {string} svgElement SVG element to contain the circle (point marker).
 * @param {number} x X-coordinate of the point where the circle should be centered.
 * @param {number} y Y-coordinate of the point where the circle should be centered.
 * @param {number} radius Radius of the circle, in pixels.
 * @param {string} color Color to use for filling the circle.
 */
function drawCircle(svgElement, x, y, radius, color)
{
  var element = document.createElementNS(NS, "circle");
  element.setAttribute("cx", x);
  element.setAttribute("cy", y);
  element.setAttribute("r", radius);
  element.setAttribute("fill", color);
  svgElement.appendChild(element);
}


/**
 * Create an arrowhead marker within an SVG element.
 * @param {string} svgElementId Identifer of the SVG element in which the marker should be created.
 * @param {string} color Color to use for the marker.
 */
function createArrowheadMarker(svgElementId, color)
{
  /* Get the SVG element. */
  var svgElement = document.getElementById(svgElementId);

  /* Create a path element for the arrowhead, triangular and filled with the color. */
  var pathElement = document.createElementNS(NS, "path");
  pathElement.setAttribute("d", "M 0 0 L 8 3 L 0 6 Z");
  pathElement.setAttribute("stroke", "none");
  pathElement.setAttribute("fill", color);

  /* Create the marker element and add it to the SVG element. */
  var element = document.createElementNS(NS, "marker");
  element.id = nameArrowheadMarker(color, false);
  element.setAttribute("markerWidth", "8");
  element.setAttribute("markerHeight", "6");
  element.setAttribute("refX", "8");
  element.setAttribute("refY", "3");
  element.setAttribute("viewBox", "0 0 8 6");
  element.setAttribute("orient", "auto");
  element.appendChild(pathElement);
  svgElement.appendChild(element);
}


/**
 * Build a name for an arrowhead marker (based on its color).
 * @private
 * @param {string} color Color of the marker (which will be incorporated into its name).
 * @param {boolean} withURL Indicates whether or not to build the name as a URL.  In general, this should
 * be set to true when setting the "marker-end" attribute of the line; otherwise, it can be set to false.
 * @returns {string} A name for an arrowhead marker (based on its color).
 */
function nameArrowheadMarker(color, withURL)
{
  var s = color + "ArrowheadMarker";
  if (withURL) s = "url(#" + s + ")";
  return s;
}


/**
 * Convert degrees to radians.
 * @private
 * @param {number} degrees
 * @returns {number} The value equivalent to degrees, in radians.
 */
function degreesToRadians(degrees) { return degrees * Math.PI / 180; }


/**
 * Convert radians to degrees.
 * @private
 * @param {number} radians
 * @returns {number} The value equivalent to radians, in degrees.
 */
function radiansToDegrees(radians) { return radians * 180 / Math.PI; }


/**
 * Initialize an SVG line element.
 * @private
 * @param {number} x1 X-coordinate where the line should begin.
 * @param {number} y1 Y-coordinate where the line should begin.
 * @param {number} x2 X-coordinate where the line should end.
 * @param {number} y2 Y-coordinate where the line should end.
 * @param {string} color Color to use for the line.
 * @returns {Element} An initialized SVG line element to be drawn from (x1, y1) to (x2, y2) in the specified color.
 */
function initLine(x1, y1, x2, y2, color)
{
  var element = document.createElementNS(NS, "line");
  element.setAttribute("x1", x1);
  element.setAttribute("y1", y1);
  element.setAttribute("x2", x2);
  element.setAttribute("y2", y2);
  element.setAttribute("stroke", color);
  return element;
}
