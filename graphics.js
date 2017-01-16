var NS = "http://www.w3.org/2000/svg";


function drawLabel(svgElementId, x, y, arrowhead, labelX, labelY, text, textAnchor, color)
{
  var FONT_SIZE = 12;
  var FACTOR = 3 / 4;

  var v;
  var element;
  var svgElement;
  var pathElement;

  svgElement = document.getElementById(svgElementId);

  /* If applicable, draw the leader line. */
  if (labelX && labelY)
  {
    element = initLine(labelX, labelY, x, y, color);
    if (arrowhead)
    {
      v = nameArrowheadMarker(color, true);
      element.setAttribute("marker-end", v);
    }
    svgElement.appendChild(element);
  }

  /* Draw the text. */
  textNode = document.createTextNode(text);
  element = document.createElementNS(NS, "text");
  element.setAttribute("x", labelX ? labelX : x);
  v = labelY ? (labelY + (FACTOR - ((labelY > y) ? 0 : 1)) * FONT_SIZE) : (y + FONT_SIZE / 2 - 1);
  element.setAttribute("y", v);
  element.setAttribute("text-anchor", textAnchor);
  element.setAttribute("fill", color);
  element.setAttribute("font-size", FONT_SIZE + "px");
  element.appendChild(textNode);
  svgElement.appendChild(element);
}


function createArrowheadMarker(svgElementId, color)
{
  var element;
  var svgElement;
  var pathElement;

  svgElement = document.getElementById(svgElementId);

  pathElement = document.createElementNS(NS, "path");
  pathElement.setAttribute("d", "M 0 0 L 8 3 L 0 6 Z");
  pathElement.setAttribute("stroke", "none");
  pathElement.setAttribute("fill", color);

  element = document.createElementNS(NS, "marker");
  element.id = nameArrowheadMarker(color, false);
  element.setAttribute("markerWidth", "8");
  element.setAttribute("markerHeight", "6");
  element.setAttribute("refX", "8");
  element.setAttribute("refY", "3");
  element.setAttribute("viewBox", "0 0 12 9");
  element.setAttribute("orient", "auto");
  element.appendChild(pathElement);
  svgElement.appendChild(element);
}


function nameArrowheadMarker(color, withURL)
{
  var s;

  s = color + "ArrowheadMarker";
  if (withURL) s = "url(#" + s + ")";
  return s;
}


function degreesToRadians(degrees)
{
  return degrees * Math.PI / 180;
}


function radiansToDegrees(radians)
{
  return radians * 180 / Math.PI;
}


function initLine(x1, y1, x2, y2, color)
{
  var element;

  element = document.createElementNS(NS, "line");
  element.setAttribute("x1", x1);
  element.setAttribute("y1", y1);
  element.setAttribute("x2", x2);
  element.setAttribute("y2", y2);
  element.setAttribute("stroke", color);
  return element;
}
