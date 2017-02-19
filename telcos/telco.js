/**
 * @file Functionality unique to the Telcos page.
 */


/**
 * Font size to use when drawing the text for labels, in pixels.
 * @constant {number}
 */
var TELCO_FONT_SIZE = 12;

/**
 * Number of channels (# of telcos that can be represented at one point in time) on the timeline.
 * @constant {number}
 */
var CHANNEL_COUNT = 17;

/**
 * Width of a bar representing a telco within a channel, in pixels.
 * @constant {number}
 */
var CHANNEL_WIDTH = 8;

/**
 * Width of the total horizontal space allocated for a channel, in pixels.
 * @constant {number}
 */
var CHANNEL_SPACE = 40;

/**
 * Radius of a circle used as an endpoint marker for a leader line, in pixels.
 * @constant {number}
 */
var MARKER_RADIUS = CHANNEL_WIDTH / 4;

/**
 * Year at which the timeline begins.
 * @constant {number}
 */
var BEGIN_YEAR = 1870;

/**
 * Year at which the scale changes.
 * @constant {number}
 */
var EPOCH_YEAR = 1980;

/**
 * Year at which the timeline ends.
 * @constant {number}
 */
var END_YEAR = 2020;

/**
 * Number of pixels per year before the scale change.
 * @constant {number}
 */
var YEAR_LOW = 4;

/**
 * Number of pixels per year after the scale change.
 * @constant {number}
 */
var YEAR_HIGH = 16;

/**
 * Y-coordinate at which the scale changes.
 * @constant {number}
 */
var EPOCH_Y = (EPOCH_YEAR - BEGIN_YEAR) * YEAR_LOW;


/**
 * Draw a grid representing a timeline within an SVG element.
 * The SVG element is sized automatically to fit the grid.
 * @param {string} svgElementId Identifer of the SVG element to contain the grid.
 * @param {number} yearInterval Number of years between horizontal lines.
 * @param {string} color Color to use for the grid.
 */
function drawTimeGrid(svgElementId, yearInterval, color)
{
  var d;
  var y;
  var width;
  var year;
  var element;
  var svgElement;

  /* Size the SVG element. */
  svgElement = document.getElementById(svgElementId);
  width = ((CHANNEL_COUNT + 1) * CHANNEL_SPACE);
  svgElement.style.width = width + "px";
  svgElement.style.height = ((EPOCH_YEAR - BEGIN_YEAR) * YEAR_LOW + (END_YEAR - EPOCH_YEAR) * YEAR_HIGH) + "px";

  /* Draw the outline. */
  element = document.createElementNS(NS, "rect");
  element.setAttribute("x", 0);
  element.setAttribute("y", 0);
  element.setAttribute("width", svgElement.style.width);
  element.setAttribute("height", svgElement.style.height);
  element.setAttribute("stroke", color);
  element.setAttribute("stroke-width", 3);
  element.setAttribute("fill", "none");
  svgElement.appendChild(element);

  /* Draw horizontal gridlines to mark year-intervals. */
  d = 2 * yearInterval;
  for (year = BEGIN_YEAR + yearInterval; year < END_YEAR; year += yearInterval)
  {
    y = yearToY(year);
    element = initLine(0, y, svgElement.style.width, y, color);
    svgElement.appendChild(element);

    /* Label every other year-interval. */
    if (year % d) continue;
    labelYear(svgElementId, year, width);
  }
}


/**
 * Draw a vertical bar (representing a telco) on a timeline within an SVG element.
 * @param {string} svgElementId Identifer of the SVG element containing the timeline.
 * @param {number} channel Channel in which to draw the bar.
 * @param {number} beginYear Year on the timeline at which the bar is to begin.
 * @param {number} endYear Year on the timeline at which the bar is to end.
 * @param {number} branchChannel If nonzero, channel from which this bar should branch.
 * @param {number} mergeChannel If nonzero, channel into which this bar should merge.
 * @param {string} color Color to use for the bar.
 */
function drawTimeBar(svgElementId, channel, beginYear, endYear, branchChannel, mergeChannel, color)
{
  var R = CHANNEL_SPACE / 5;

  var x;
  var y;
  var dy;
  var s;
  var element;
  var svgElement;

  /* Build the points string. */

  /* The x of the begin-point is determined by the branch channel.  (The y is determined by begin-year.)
   * If there is a branch channel, there will be a subsequent point to align the bar within its own channel.
   */
  x = channelToX(branchChannel ? branchChannel : channel);
  y = yearToY(beginYear);
  s = addPointToString(s, x, y);
  if (branchChannel)
  {
    x = channelToX(channel);
    y += Math.abs(channel - branchChannel) * R;
    s = addPointToString(s, x, y);
  }

  /* Similarly, the x of the end-point is determined by the merge channel.  (The y is determined by end-year.)
   * If there is a merge channel, there will be a preceding point to maintain alignment within the bar's own channel.
   */
  y = yearToY(endYear);
  if (mergeChannel)
  {
    dy = Math.abs(mergeChannel - channel) * R;
    s = addPointToString(s, x, y - dy);
    x = channelToX(mergeChannel);
  }
  s = addPointToString(s, x, y);

  /* Draw the bar on the grid. */
  svgElement = document.getElementById(svgElementId);
  element = document.createElementNS(NS, "polyline");
  element.setAttribute("points", s);
  element.setAttribute("stroke", color);
  element.setAttribute("stroke-width", CHANNEL_WIDTH);
  element.setAttribute("stroke-linecap", "round");
  element.setAttribute("fill", "none");
  svgElement.appendChild(element);
}


/**
 * Draw a line representing a transfer from one channel to another on a timeline within an SVG element.
 * @param {string} svgElementId Identifer of the SVG element containing the timeline.
 * @param {number} year Year during which the transfer occurred.
 * @param {number} fromChannel Channel from which the transfer occurred.
 * @param {number} toChannel Channel to which the transfer occurred.
 * @param {string} color Color to use for the line.
 */
function drawLineTransfer(svgElementId, year, fromChannel, toChannel, color)
{
  var x1;
  var x2;
  var y;
  var s;
  var element;
  var svgElement;

  svgElement = document.getElementById(svgElementId);
  x1 = channelToX(fromChannel);
  x2 = channelToX(toChannel);
  y = yearToY(year);
  element = initLine(x1, y, x2, y, color);
  element.setAttribute("stroke-width", CHANNEL_WIDTH / 4);
  element.setAttribute("stroke-dasharray", "8,4");
  s = nameArrowheadMarker(color, true);
  element.setAttribute("marker-end", s);
  svgElement.appendChild(element);
}


/**
 * Label an event on a timeline within an SVG element.
 * @param {string} svgElementId Identifer of the SVG element containing the timeline.
 * @param {number} channel Channel in which the event occurred.
 * @param {number} year Year during which the event occurred.
 * @param {number} dx X-coordinate offset for the text.
 * @param {number} dy Y-coordinate offset for the text.
 * @param {string} text Text to draw for the label.
 * @param {string} textAnchor Value to use for the "text-anchor" attribute of the text element.
 * @param {string} color Color to use for the label.
 */
function labelEvent(svgElementId, channel, year, dx, dy, text, textAnchor, color)
{
  var x;
  var y;

  x = channelToX(channel);
  y = yearToY(year);
  drawLabel(svgElementId, x, y, MARKER_RADIUS, x + dx, y + dy, year + " - " + text, TELCO_FONT_SIZE, textAnchor, color);
}


/**
 * Label a bar representing a telco at the bottom of a channel.
 * @param {string} svgElementId Identifer of the SVG element containing the timeline.
 * @param {number} channel Channel containing the bar representing the telco.
 * @param {string} text Text to draw for the label.
 * @param {string} color Color to use for the label.
 */
function labelCompany(svgElementId, channel, text, color)
{
  var x;
  var y;

  x = channelToX(channel);
  y = yearToY(2017);
  drawLabel(svgElementId, x, y, MARKER_RADIUS, x, y + 16, text, TELCO_FONT_SIZE, "middle", color);
}


/**
 * Label a year on a timeline within an SVG element.
 * @private
 * @param {string} svgElementId Identifer of the SVG element containing the timeline.
 * @param {number} year Year to label.
 * @param {number} width Width of the timeline, in pixels.
 */
function labelYear(svgElementId, year, width)
{
  var x;
  var y;

  y = yearToY(year) - 1;
  x = (CHANNEL_SPACE - CHANNEL_WIDTH) / 2;
  drawLabel(svgElementId, x, y, 0, 0, 0, year, TELCO_FONT_SIZE, "middle", "gray");
  drawLabel(svgElementId, width - x, y, 0, 0, 0, year, TELCO_FONT_SIZE, "middle", "gray");
}


/**
 * Convert a channel number to an X-coordinate.
 * @private
 * @param {number} channel
 * @returns {number} The X-coordinate of the channel.
 */
function channelToX(channel)
{
  return channel * CHANNEL_SPACE;
}


/**
 * Convert a year to a Y-coordinate.
 * @private
 * @param {number} year
 * @returns {number} The Y-coordinate corresponding to the year.
 */
function yearToY(year)
{
  var b;
  var r;
  var i;

  if (year < EPOCH_YEAR)
  {
    b = BEGIN_YEAR;
    r = YEAR_LOW;
    i = 0;
  }
  else
  {
    b = EPOCH_YEAR;
    r = YEAR_HIGH;
    i = EPOCH_Y;
  }

  return (year - b) * r + i;
}


/**
 * Add a point (coordinate pair) to a string for the purpose of the "points" attribute of a polyline.
 * @param {string} s String to which the coordinate pair should be added.
 * @param {number} x X-coordinate of the point.
 * @param {number} y Y-coordinate of the point.
 * @returns {string} The string with the coordinate pair added.
 */
function addPointToString(s, x, y)
{
  var z;

  z = (s !== undefined && s.length) ? (s + " ") : "";
  return z + x + "," + y;
}
