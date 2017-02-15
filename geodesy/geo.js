/**
 * @file Functionality unique to the Geodesy page.
 */


/**
 * Draw a "globe" (an ellipse with lines of latitude and longitude) within an SVG element.
 * The SVG element is sized automatically to fit the dimensions of the globe.
 * The globe will be oriented such that the equator is centered and horizontal.  To
 * draw a globe oriented such that one of the poles is centered, call drawGlobePolar.
 * @param {string} svgElementId Identifer of the SVG element to contain the globe.
 * @param {number} equatorialRadius Equatorial radius of the globe, in pixels.
 * @param {number} polarRadius Polar radius of the globe, in pixels.
 * @param {number} n Number of lines (of latitude/longitude) to draw within each hemisphere.
 * @param {string} strokeColor Color to use for the outline, parallels, and meridians.
 * @param {string} fillColor Color to use for the area within the globe.
 */
function drawGlobe(svgElementId, equatorialRadius, polarRadius, n, strokeColor, fillColor)
{
  var i;
  var a;
  var element;
  var svgElement;

  /* Size the SVG element. */
  svgElement = document.getElementById(svgElementId);
  svgElement.style.width = 2 * equatorialRadius + "px";
  svgElement.style.height = 2 * polarRadius + "px";

  /* Draw the outline. */
  drawGlobeOutline(svgElement, equatorialRadius, polarRadius, strokeColor, fillColor);

  /* Draw the parallels and meridians. */
  for (i = 0; i < n; i++)
  {
    a = (i / n) * (Math.PI / 2);
    drawParallels(svgElement, equatorialRadius, polarRadius, a, strokeColor);
    drawMeridians(svgElement, equatorialRadius, polarRadius, a, strokeColor);
  }
}


/**
 * Draw a pair of meridians (lines of longitude) on a globe within an SVG element.
 * The SVG element is assumed to be sized to fit the globe, and the globe is assumed to be
 * oriented such that the equator is centered and horizontal.  (See also drawMeridiansPolar.)
 * @param {string} svgElementId Identifer of the SVG element containing the globe on which to draw the meridians.
 * @param {number} equatorialRadius Equatorial radius of the globe, in pixels.
 * @param {number} polarRadius Polar radius of the globe, in pixels.
 * @param {number} angle Angle (of longitude) at which to draw the meridians, in radians.
 * @param {string} color Color to use for the meridians.
 */
function drawMeridians(svgElement, equatorialRadius, polarRadius, angle, color)
{
  var nodeName;
  var radiusX;
  var element;

  /* Special case:  If angle is zero, that's the prime meridian.  However, if we draw an ellipse with
   * a radius of zero, nothing will be drawn.  Therefore, draw instead a line for the prime meridian.
   * Otherwise, draw an ellipse representing two meridians equidistant from the prime meridian.
   */
  nodeName = angle ? "ellipse" : "line"
  element = document.createElementNS(NS, nodeName);
  element.setAttribute("stroke", color);
  if (angle)
  {
    element.setAttribute("fill", "none");
    element.setAttribute("cx", equatorialRadius);
    element.setAttribute("cy", polarRadius);
    radiusX = equatorialRadius * Math.sin(angle);
    element.setAttribute("rx", radiusX);
    element.setAttribute("ry", polarRadius);
  }
  else
  {
    element.setAttribute("x1", equatorialRadius);
    element.setAttribute("x2", equatorialRadius);
    element.setAttribute("y1", 0);
    element.setAttribute("y2", 2 * polarRadius);
  }
  svgElement.appendChild(element);
}


/**
 * Draw a pair of parallels (lines of latitude) on a globe within an SVG element.
 * The SVG element is assumed to be sized to fit the globe, and the globe is assumed to be
 * oriented such that the equator is centered and horizontal.  (See also drawParallelsPolar.)
 * @param {string} svgElementId Identifer of the SVG element containing the globe on which to draw the parallels.
 * @param {number} equatorialRadius Equatorial radius of the globe, in pixels.
 * @param {number} polarRadius Polar radius of the globe, in pixels.
 * @param {number} angle Angle (of latitude) at which to draw the parallels, in radians.
 * @param {string} color Color to use for the parallels.
 */
function drawParallels(svgElement, equatorialRadius, polarRadius, angle, color)
{
  var d;
  var element;

  /* The default case is to draw two lines representing two parallels equidistant from the equator.  The
   * same Element object can be used for both lines.  Instantiate this object and set its common attributes.
   */
  element = document.createElementNS(NS, "line");
  element.setAttribute("stroke", color);
  d = equatorialRadius * Math.cos(angle);
  element.setAttribute("x1", equatorialRadius - d);
  element.setAttribute("x2", equatorialRadius + d);

  /* The remaining attributes diverge depending on which side of the equator the line
   * is to be drawn.  First, draw the parallel on the upper/"northern" hemisphere.
   */
  d = polarRadius * Math.sin(angle);
  element.setAttribute("y1", polarRadius - d);
  element.setAttribute("y2", polarRadius - d);
  svgElement.appendChild(element);

  /* Next, clone the Element object and set its attributes for the lower/"southern" hemisphere.
   * Special case:  If angle is zero, we're drawing the equator, in which case it's unnecessary to draw
   * a second line (it would be identical to the first), so save a little overhead and return here.
   */
  if (!angle) return;
  element = element.cloneNode();
  element.setAttribute("y1", polarRadius + d);
  element.setAttribute("y2", polarRadius + d);
  svgElement.appendChild(element);
}


/**
 * Draw a "globe" (an ellipse with lines of latitude and longitude) within an SVG element.
 * The SVG element is sized automatically to fit the dimensions of the globe.
 * The globe will be oriented such that one of the poles is centered.  To
 * draw a globe oriented such that the equator is centered, call drawGlobe.
 * @param {string} svgElementId Identifer of the SVG element to contain the globe.
 * @param {number} radius Radius of the globe, in pixels.
 * @param {number} n Number of lines (of latitude/longitude) to draw within each hemisphere.
 * @param {string} strokeColor Color to use for the outline, parallels, and meridians.
 * @param {string} fillColor Color to use for the area within the globe.
 */
function drawGlobePolar(svgElementId, radius, n, strokeColor, fillColor)
{
  var i;
  var a;
  var element;
  var svgElement;

  /* Size the SVG element. */
  svgElement = document.getElementById(svgElementId);
  svgElement.style.width = 2 * radius + "px";
  svgElement.style.height = 2 * radius + "px";

  /* Draw the outline. */
  drawGlobeOutline(svgElement, radius, radius, strokeColor, fillColor);

  /* Draw the parallels and meridians. */
  for (i = 0; i < n; i++)
  {
    a = (i / n) * (Math.PI / 2);
    drawParallelsPolar(svgElement, radius, a, strokeColor);
    drawMeridiansPolar(svgElement, radius, a, strokeColor);
  }
}


/**
 * Draw a pair of meridians (lines of longitude) on a globe within an SVG element.
 * The SVG element is assumed to be sized to fit the globe, and the globe is assumed
 * to be oriented such that one of the poles is centered.  (See also drawMeridians.)
 * @param {string} svgElementId Identifer of the SVG element containing the globe on which to draw the meridians.
 * @param {number} radius Radius of the globe, in pixels.
 * @param {number} angle Angle (of longitude) at which to draw the meridians, in radians.
 * @param {string} color Color to use for the meridians.
 */
function drawMeridiansPolar(svgElement, radius, angle, color)
{
  var d;
  var element;

  /* The default case is to draw two lines representing two meridian halves equidistant from the prime meridian.  (Half
   * of each meridian half will be in the eastern hemisphere, the other half in the western.)  Assuming we are looking at
   * the north pole and the prime meridian is oriented horizontally on the right side, those meridian halves in quadrants
   * I and II would be in the eastern hemisphere, while those in quadrants III and IV would be in the western hemisphere.
   * The same Element object can be used for both lines.  Instantiate this object and set its common attributes.
   */
  element = document.createElementNS(NS, "line");
  element.setAttribute("stroke", color);
  d = radius * Math.cos(angle);
  element.setAttribute("x1", radius - d);
  element.setAttribute("x2", radius + d);

  /* The remaining attributes differ depending on which side of the prime meridian
   * the line is to be drawn.  First, draw the meridian halves in quadrants I and III.
   */
  d = radius * Math.sin(angle);
  element.setAttribute("y1", radius - d);
  element.setAttribute("y2", radius + d);
  svgElement.appendChild(element);

  /* Next, clone the Element object and set its attributes for quadrants II and IV.
   * Special case:  If angle is zero, we're drawing the prime and anti-meridians.  In this case,
   * make the second line vertical, to represent 90 degrees (east and west of the prime meridian).
   */
  element = element.cloneNode();
  if (angle)
  {
    element.setAttribute("y1", radius + d);
    element.setAttribute("y2", radius - d);
  }
  else
  {
    element.setAttribute("x1", radius);
    element.setAttribute("x2", radius);
    element.setAttribute("y1", 0);
    element.setAttribute("y2", 2 * radius);
  }
  svgElement.appendChild(element);
}


/**
 * Draw a parallel (line of latitude) on a globe within an SVG element.
 * The SVG element is assumed to be sized to fit the globe, and the globe is assumed
 * to be oriented such that one of the poles is centered.  (See also drawParallels.)
 * @param {string} svgElementId Identifer of the SVG element containing the globe on which to draw the parallel.
 * @param {number} radius Radius of the globe, in pixels.
 * @param {number} angle Angle (of latitude) at which to draw the parallel, in radians.
 * @param {string} color Color to use for the parallel.
 */
function drawParallelsPolar(svgElement, radius, angle, color)
{
  var r;
  var element;

  element = document.createElementNS(NS, "ellipse");
  element.setAttribute("cx", radius);
  element.setAttribute("cy", radius);
  r = radius * Math.sin(angle);
  element.setAttribute("rx", r);
  element.setAttribute("ry", r);
  element.setAttribute("stroke", color);
  element.setAttribute("fill", "none");
  svgElement.appendChild(element);
}


/**
 * Draw elliptical outline of a "globe" within an SVG element.
 * @param {string} svgElementId Identifer of the SVG element to contain the globe.
 * @param {number} equatorialRadius Equatorial radius of the globe, in pixels.
 * @param {number} polarRadius Polar radius of the globe, in pixels.
 * @param {string} strokeColor Color to use for the outline.
 * @param {string} fillColor Color to use for the area within the globe.
 */
function drawGlobeOutline(svgElement, equatorialRadius, polarRadius, strokeColor, fillColor)
{
  var element;

  element = document.createElementNS(NS, "ellipse");
  element.setAttribute("cx", equatorialRadius);
  element.setAttribute("cy", polarRadius);
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
  var y;
  var element;
  var svgElement;

  svgElement = document.getElementById(svgElementId);
  y = parseInt(svgElement.style.height) / 2;
  element = initLine(0, y, svgElement.style.width, y, color);
  element.setAttribute("stroke-width", 4);
  svgElement.appendChild(element);
}


/**
 * Draw a radial line from the center of a "globe" within an SVG element.
 * The SVG element is assumed to be sized to fit the globe.
 * @param {string} svgElementId Identifer of the SVG element containing the globe on which to draw the radial.
 * @param {number} angle Angle (with respect to the horizontal) at which to draw the radial, in degrees.
 * @param {string} color Color to use for the radial.
 */
function drawRadial(svgElementId, angle, supplementary, color)
{
  var STROKE_WIDTH = 2;
  var ARC_FACTOR = 7 / 16;
  var ANNO_FACTOR = 3 / 4;
  var FONT_SIZE = 24;

  var x;
  var y;
  var d;
  var cx;
  var cy;
  var rx;
  var ry;
  var textNode;
  var element;
  var svgElement
  var cosAngle;
  var sinAngle;
  var supFactor;

  /* Get the SVG element and the sine and cosine of the angle, which will be needed throughout. */
  svgElement = document.getElementById(svgElementId);
  cosAngle = Math.cos(degreesToRadians(angle));
  sinAngle = Math.sin(degreesToRadians(angle));

  /* Draw the radial. */
  cx = parseInt(svgElement.style.width) / 2;
  cy = parseInt(svgElement.style.height) / 2;
  x = cx * (1 + cosAngle);
  y = cy * (1 - sinAngle);
  element = initLine(cx, cy, x, y, color);
  element.setAttribute("stroke-width", STROKE_WIDTH);
  element.setAttribute("stroke-dasharray", "8,4");
  svgElement.appendChild(element);

  /* Mark the point on the surface. */
  element = document.createElementNS(NS, "circle");
  element.setAttribute("cx", x);
  element.setAttribute("cy", y);
  element.setAttribute("r", 3 * STROKE_WIDTH);
  element.setAttribute("fill", "red");
  svgElement.appendChild(element);
  element = document.createElementNS(NS, "circle");
  element.setAttribute("cx", x);
  element.setAttribute("cy", y);
  element.setAttribute("r", STROKE_WIDTH);
  element.setAttribute("fill", color);
  svgElement.appendChild(element);

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
