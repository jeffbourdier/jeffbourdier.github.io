var CHANNEL_COUNT = 17;
var CHANNEL_WIDTH = 8;
var CHANNEL_SPACE = 40;
var BEGIN_YEAR = 1870;
var EPOCH_YEAR = 1980;
var END_YEAR = 2020;
var YEAR_LOW = 4;
var YEAR_HIGH = 16;
var EPOCH_Y = (EPOCH_YEAR - BEGIN_YEAR) * YEAR_LOW;


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
  element.setAttribute("stroke-width", CHANNEL_WIDTH / 2);
  element.setAttribute("stroke-dasharray", "8,4");
  s = nameArrowheadMarker(color, true);
  element.setAttribute("marker-end", s);
  svgElement.appendChild(element);
}


function labelEvent(svgElementId, channel, year, dx, dy, text, textAnchor, color)
{
  var x;
  var y;

  x = channelToX(channel);
  y = yearToY(year);
  drawLabel(svgElementId, x, y, false, x + dx, y + dy, year + " - " + text, textAnchor, color);
}


function labelCompany(svgElementId, channel, text, color)
{
  var x;
  var y;

  x = channelToX(channel);
  y = yearToY(2017);
  drawLabel(svgElementId, x, y, false, x, y + 16, text, "middle", color);
}


function labelYear(svgElementId, year, width)
{
  var x;
  var y;

  y = yearToY(year);
  x = (CHANNEL_SPACE - CHANNEL_WIDTH) / 2;
  drawLabel(svgElementId, x, y, false, 0, 0, year, "middle", "gray");
  drawLabel(svgElementId, width - x, y, false, 0, 0, year, "middle", "gray");
}


function channelToX(channel)
{
  return channel * CHANNEL_SPACE;
}


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


function addPointToString(s, x, y)
{
  var z;

  z = (s !== undefined && s.length) ? (s + " ") : "";
  return z + x + "," + y;
}
