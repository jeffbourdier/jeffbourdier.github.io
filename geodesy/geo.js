/**
 * @file       Functionality unique to the Geodesy page.
 *
 * @copyright  (c) 2016 Jeffrey Paul Bourdier
 *
 * @license    MIT
 * Licensed under the MIT License.  This file may be used only in compliance with this License.
 * Software distributed under this License is provided "AS IS", WITHOUT WARRANTY OF ANY KIND.
 * For more information, see the following URL:  {@link https://opensource.org/licenses/MIT}
 */


/**
 * SVG element padding, in pixels.
 * @constant {number}
 */
var SVG_PADDING = 8;


/**
 * Draw a "globe" (an ellipse with lines of latitude and longitude) within an SVG element.
 * The SVG element is sized automatically to fit the dimensions of the globe (with padding).
 * The globe will be oriented such that the equator is centered and horizontal.
 * To draw a globe oriented such that one of the poles is centered, call drawGlobePolar.
 * @param {string} svgElementId Identifer of the SVG element to contain the globe.
 * @param {number} equatorialRadius Equatorial radius of the globe, in pixels.
 * @param {number} polarRadius Polar radius of the globe, in pixels.
 * @param {number} n Number of lines (of latitude/longitude) to draw within each hemisphere.
 * @param {string} strokeColor Color to use for the outline, parallels, and meridians.
 * @param {string} fillColor Color to use for the area within the globe.
 */
function drawGlobe(svgElementId, equatorialRadius, polarRadius, n, strokeColor, fillColor)
{
  var a, svgElement = initSVGElement(svgElementId, equatorialRadius, polarRadius);
  drawGlobeOutline(svgElement, equatorialRadius, polarRadius, strokeColor, fillColor);

  /* Draw the parallels and meridians. */
  for (var i = 0; i < n; i++)
  {
    a = (i / n) * (Math.PI / 2);
    drawParallels(svgElement, equatorialRadius, polarRadius, a, strokeColor);
    drawMeridians(svgElement, equatorialRadius, polarRadius, a, strokeColor);
  }
}


/**
 * Draw a pair of meridians (lines of longitude) on a globe within an SVG element.
 * The SVG element is assumed to be sized to fit the globe (with padding), and the globe is assumed
 * to be oriented such that the equator is centered and horizontal.  (See also drawMeridiansPolar.)
 * @param {string} svgElement SVG element containing the globe on which to draw the meridians.
 * @param {number} equatorialRadius Equatorial radius of the globe, in pixels.
 * @param {number} polarRadius Polar radius of the globe, in pixels.
 * @param {number} angle Angle (of longitude) at which to draw the meridians, in radians.
 * @param {string} color Color to use for the meridians.
 */
function drawMeridians(svgElement, equatorialRadius, polarRadius, angle, color)
{
  /* Special case:  If angle is zero, that's the prime meridian.  However, if we draw an ellipse with
   * a radius of zero, nothing will be drawn.  Therefore, draw instead a line for the prime meridian.
   * Otherwise, draw an ellipse representing two meridians equidistant from the prime meridian.
   */
  var element = document.createElementNS(NS, angle ? "ellipse" : "line"), x = SVG_PADDING + equatorialRadius;
  element.setAttribute("stroke", color);
  if (angle)
  {
    element.setAttribute("fill", "none");
    element.setAttribute("cx", x);
    element.setAttribute("cy", SVG_PADDING + polarRadius);
    element.setAttribute("rx", equatorialRadius * Math.sin(angle));
    element.setAttribute("ry", polarRadius);
  }
  else
  {
    element.setAttribute("x1", x);
    element.setAttribute("x2", x);
    element.setAttribute("y1", SVG_PADDING);
    element.setAttribute("y2", SVG_PADDING + 2 * polarRadius);
  }
  svgElement.appendChild(element);
}


/**
 * Draw a pair of parallels (lines of latitude) on a globe within an SVG element.
 * The SVG element is assumed to be sized to fit the globe (with padding), and the globe is assumed
 * to be oriented such that the equator is centered and horizontal.  (See also drawParallelsPolar.)
 * @param {string} svgElement SVG element containing the globe on which to draw the parallels.
 * @param {number} equatorialRadius Equatorial radius of the globe, in pixels.
 * @param {number} polarRadius Polar radius of the globe, in pixels.
 * @param {number} angle Angle (of latitude) at which to draw the parallels, in radians.
 * @param {string} color Color to use for the parallels.
 */
function drawParallels(svgElement, equatorialRadius, polarRadius, angle, color)
{
  var m, d, element = document.createElementNS(NS, "line");
  element.setAttribute("stroke", color);

  /* The default case is to draw two lines representing two parallels equidistant from the equator.  The
   * same Element object can be used for both lines.  Instantiate this object and set its common attributes.
   */
  m = SVG_PADDING + equatorialRadius;
  d = equatorialRadius * Math.cos(angle);
  element.setAttribute("x1", m - d);
  element.setAttribute("x2", m + d);

  /* The remaining attributes diverge depending on which side of the equator the line
   * is to be drawn.  First, draw the parallel on the upper/"northern" hemisphere.
   */
  m = SVG_PADDING + polarRadius;
  d = polarRadius * Math.sin(angle);
  element.setAttribute("y1", m - d);
  element.setAttribute("y2", m - d);
  svgElement.appendChild(element);

  /* Next, clone the Element object and set its attributes for the lower/"southern" hemisphere.
   * Special case:  If angle is zero, we're drawing the equator, in which case it's unnecessary to draw
   * a second line (it would be identical to the first), so save a little overhead and return here.
   */
  if (!angle) return;
  element = element.cloneNode();
  element.setAttribute("y1", m + d);
  element.setAttribute("y2", m + d);
  svgElement.appendChild(element);
}


/**
 * Draw a "globe" (an ellipse with lines of latitude and longitude) within an SVG element.
 * The SVG element is sized automatically to fit the dimensions of the globe (with padding).
 * The globe will be oriented such that one of the poles is centered.
 * To draw a globe oriented such that the equator is centered, call drawGlobe.
 * @param {string} svgElementId Identifer of the SVG element to contain the globe.
 * @param {number} radius Radius of the globe, in pixels.
 * @param {number} n Number of lines (of latitude/longitude) to draw within each hemisphere.
 * @param {string} strokeColor Color to use for the outline, parallels, and meridians.
 * @param {string} fillColor Color to use for the area within the globe.
 */
function drawGlobePolar(svgElementId, radius, n, strokeColor, fillColor)
{
  var a, svgElement = initSVGElement(svgElementId, radius, radius);
  drawGlobeOutline(svgElement, radius, radius, strokeColor, fillColor);

  /* Draw the parallels and meridians. */
  for (var i = 0; i < n; i++)
  {
    a = (i / n) * (Math.PI / 2);
    drawParallelsPolar(svgElement, radius, a, strokeColor);
    drawMeridiansPolar(svgElement, radius, a, strokeColor);
  }
}


/**
 * Draw a pair of meridians (lines of longitude) on a globe within an SVG element.
 * The SVG element is assumed to be sized to fit the globe (with padding), and the globe is
 * assumed to be oriented such that one of the poles is centered.  (See also drawMeridians.)
 * @param {string} svgElement SVG element containing the globe on which to draw the meridians.
 * @param {number} radius Radius of the globe, in pixels.
 * @param {number} angle Angle (of longitude) at which to draw the meridians, in radians.
 * @param {string} color Color to use for the meridians.
 */
function drawMeridiansPolar(svgElement, radius, angle, color)
{
  var d, element = document.createElementNS(NS, "line"), m = SVG_PADDING + radius;
  element.setAttribute("stroke", color);

  /* The default case is to draw two lines representing two meridian halves equidistant from the prime meridian.  (Half
   * of each meridian half will be in the eastern hemisphere, the other half in the western.)  Assuming we are looking at
   * the north pole and the prime meridian is oriented horizontally on the right side, those meridian halves in quadrants
   * I and II would be in the eastern hemisphere, while those in quadrants III and IV would be in the western hemisphere.
   * The same Element object can be used for both lines.  Instantiate this object and set its common attributes.
   */
  d = radius * Math.cos(angle);
  element.setAttribute("x1", m - d);
  element.setAttribute("x2", m + d);

  /* The remaining attributes differ depending on which side of the prime meridian
   * the line is to be drawn.  First, draw the meridian halves in quadrants I and III.
   */
  d = radius * Math.sin(angle);
  element.setAttribute("y1", m - d);
  element.setAttribute("y2", m + d);
  svgElement.appendChild(element);

  /* Next, clone the Element object and set its attributes for quadrants II and IV.
   * Special case:  If angle is zero, we're drawing the prime and anti-meridians.  In this case,
   * make the second line vertical, to represent 90 degrees (east and west of the prime meridian).
   */
  element = element.cloneNode();
  if (angle)
  {
    element.setAttribute("y1", m + d);
    element.setAttribute("y2", m - d);
  }
  else
  {
    element.setAttribute("x1", m);
    element.setAttribute("x2", m);
    element.setAttribute("y1", SVG_PADDING);
    element.setAttribute("y2", SVG_PADDING + 2 * radius);
  }
  svgElement.appendChild(element);
}


/**
 * Draw a parallel (line of latitude) on a globe within an SVG element.
 * The SVG element is assumed to be sized to fit the globe (with padding), and the globe is
 * assumed to be oriented such that one of the poles is centered.  (See also drawParallels.)
 * @param {string} svgElement SVG element containing the globe on which to draw the parallel.
 * @param {number} radius Radius of the globe, in pixels.
 * @param {number} angle Angle (of latitude) at which to draw the parallel, in radians.
 * @param {string} color Color to use for the parallel.
 */
function drawParallelsPolar(svgElement, radius, angle, color)
{
  var m, element = document.createElementNS(NS, "ellipse");
  m = SVG_PADDING + radius;
  element.setAttribute("cx", m);
  element.setAttribute("cy", m);
  m = radius * Math.sin(angle);
  element.setAttribute("rx", m);
  element.setAttribute("ry", m);
  element.setAttribute("stroke", color);
  element.setAttribute("fill", "none");
  svgElement.appendChild(element);
}


/**
 * Initialize an SVG element to contain a globe.
 * @private
 * @param {string} id Identifer of the SVG element to size.
 * @param {number} widthRadius Radius used to determine the width, in pixels.
 * @param {number} heightRadius Radius used to determine the height, in pixels.
 * @returns {object} SVG element identified by id.
 */
function initSVGElement(id, widthRadius, heightRadius)
{
  var svgElement = document.getElementById(id);
  svgElement.style.width = formatSVGSize(widthRadius);
  svgElement.style.height = formatSVGSize(heightRadius);
  svgElement.style.padding = SVG_PADDING + "px";
  return svgElement;
}


/**
 * Return a formatted string for sizing one dimension (width or height) of an SVG element.
 * @private
 * @param {number} radius Radius used to determine the dimension, in pixels.
 * @returns {number} Formatted string for sizing the dimension.
 */
function formatSVGSize(radius) { return (2 * (radius + SVG_PADDING)) + "px"; }


/**
 * Draw elliptical outline of a "globe" within an SVG element.
 * @param {string} svgElement SVG element to contain the globe.
 * @param {number} equatorialRadius Equatorial radius of the globe, in pixels.
 * @param {number} polarRadius Polar radius of the globe, in pixels.
 * @param {string} strokeColor Color to use for the outline.
 * @param {string} fillColor Color to use for the area within the globe.
 */
function drawGlobeOutline(svgElement, equatorialRadius, polarRadius, strokeColor, fillColor)
{
  var element = document.createElementNS(NS, "ellipse");
  element.setAttribute("cx", SVG_PADDING + equatorialRadius);
  element.setAttribute("cy", SVG_PADDING + polarRadius);
  element.setAttribute("rx", equatorialRadius);
  element.setAttribute("ry", polarRadius);
  element.setAttribute("stroke", strokeColor);
  element.setAttribute("stroke-width", 2);
  element.setAttribute("fill", fillColor);
  svgElement.appendChild(element);
}


/**
 * Draw a horizontal line across an SVG element.
 * @param {string} svgElementId Identifer of the SVG element across which to draw the horizontal line.
 * @param {string} color Color to use for the horizontal line.
 */
function drawHorizontal(svgElementId, color)
{
  var svgElement = document.getElementById(svgElementId);
  var y = parseInt(svgElement.style.height) / 2;
  var element = initLine(SVG_PADDING, y, parseInt(svgElement.style.width) - SVG_PADDING, y, color);
  element.setAttribute("stroke-width", 4);
  svgElement.appendChild(element);
}


/**
 * Draw a radial line from the center of a "globe" within an SVG element.
 * The SVG element is assumed to be sized to fit the globe (with padding).
 * @param {string} svgElementId Identifer of the SVG element containing the globe on which to draw the radial.
 * @param {number} angle Angle (with respect to the horizontal) at which to draw the radial, in degrees.
 * @param {string} color Color to use for the radial.
 */
function drawRadial(svgElementId, angle, supplementary, color)
{
  var STROKE_WIDTH = 2;
  var ARC_FACTOR = 7 / 16;
  var ANNO_FACTOR = 3 / 4;
  var FONT_SIZE = 36;

  var x, y, d, cx, cy, rx, ry, textNode, element, svgElement, cosAngle, sinAngle, supFactor;

  /* Get the SVG element and the sine and cosine of the angle, which will be needed throughout. */
  svgElement = document.getElementById(svgElementId);
  cosAngle = Math.cos(degreesToRadians(angle));
  sinAngle = Math.sin(degreesToRadians(angle));

  /* Draw the radial. */
  cx = parseInt(svgElement.style.width) / 2;
  cy = parseInt(svgElement.style.height) / 2;
  x = cx + (cx - SVG_PADDING) * cosAngle;
  y = cy - (cy - SVG_PADDING) * sinAngle;
  element = initLine(cx, cy, x, y, color);
  element.setAttribute("stroke-width", STROKE_WIDTH);
  element.setAttribute("stroke-dasharray", "8,4");
  svgElement.appendChild(element);

  /* Mark the point on the surface. */
  drawCircle(svgElement, x, y, 5 * STROKE_WIDTH, "red");
  drawCircle(svgElement, x, y, 2 * STROKE_WIDTH, color);

  /* Draw an arc for the angle. */
  element = document.createElementNS(NS, "path");
  rx = ARC_FACTOR * cx;
  ry = ARC_FACTOR * cy;
  x = cx + rx * cosAngle;
  y = cy - ry * sinAngle;
  supFactor = supplementary ? -1 : 1;
  d = " M " + (cx + supFactor * rx) + " " + cy
    + " A "
      + rx + " " + ry + " 0 0 "
      + ((supplementary && angle > 0) || (!supplementary > 0 && angle < 0)? 1 : 0)
      + " " + x + " " + y;
  element.setAttribute("d", d);
  element.setAttribute("stroke", color);
  element.setAttribute("stroke-width", STROKE_WIDTH);
  element.setAttribute("fill", "none");
  svgElement.appendChild(element);

  /* Annotate the angle. */
  d = (supplementary ? (180 - angle) : angle);
  textNode = document.createTextNode(d + String.fromCharCode(176));
  d = degreesToRadians(d);
  x = cx + supFactor * ANNO_FACTOR * rx * Math.cos(d / 2);
  y = cy + (sinAngle < 0 ? + 1 : (ANNO_FACTOR - 1)) * FONT_SIZE;
  element = document.createElementNS(NS, "text");
  element.setAttribute("x", x);
  element.setAttribute("y", y);
  element.setAttribute("text-anchor", "middle");
  element.setAttribute("fill", color);
  element.setAttribute("font-size", FONT_SIZE + "px");
  element.appendChild(textNode);
  svgElement.appendChild(element);
}
