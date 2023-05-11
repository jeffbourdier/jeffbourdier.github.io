/* Mapping functionality for DUMPROWS (Database Utility Map-Producing Read-Only Web Service).
 *
 * Copyright (c) 2021-3 Jeffrey Paul Bourdier
 *
 * Licensed under the MIT License.  This file may be used only in compliance with this License.
 * Software distributed under this License is provided "AS IS", WITHOUT WARRANTY OF ANY KIND.
 * For more information, see the accompanying License file or the following URL:
 *
 *   https://opensource.org/licenses/MIT
 */


var tableDiv, mapDiv, horizontal, usableWidth, usableHeight, halfWidth, halfHeight, control, tileLayer, pointLayer,
  nonpointLayer, map, rows, backPoint, forePoint,  backLine, foreLine, backPolygon, forePolygon, selectedIndex = 0,
  selectedGeometry, extents = [[90, 180], [-90, -180]], geoObject = { type: 'FeatureCollection', features: [] };


function initMapping(table, geoColumn)
{
  /* Put the table in a div. */
  tableDiv = document.createElement('div');
  tableDiv.style.overflow = 'auto';
  tableDiv.style.marginBottom = '8px';
  tableDiv.style.marginRight = '8px';
  tableDiv.appendChild(table);
  document.body.appendChild(tableDiv);

  /* Create a div for the map. */
  mapDiv = document.createElement('div');
  mapDiv.style.border = '2px solid gray';
  document.body.appendChild(mapDiv);

  /* Split the view between the table and the map. */
  window.onresize = function () { if (window.innerHeight > window.innerWidth) splitHorizontally(); else splitVertically(); };
  window.onresize();

  /* Initialize controls and layers for the Leaflet map. */
  control = L.control();
  control.onAdd = function ()
  {
    var n, i, q, p = L.DomUtil.create('div', 'leaflet-bar'), a =
      [
        {
          svg:
            '<rect stroke="gray" fill="gray" x="1" y="1" width="2" height="7" />' +
            '<rect stroke="gray" fill="gray" x="5" y="1" width="2" height="7" />' +
            '<rect stroke="gray" fill="gray" x="10" y="10" width="7" height="2" />' +
            '<rect stroke="gray" fill="gray" x="10" y="14" width="7" height="2" />' +
            '<path stroke="black" fill="none" d="M 1,10 l 0,5 7,0 m 0,0 -2,-2 0,4 z M 17,8 l 0,-5 -7,0 m 0,0 2,-2 0,4 z" />',
          title: 'Switch View',
          call: 'switchView()'
        },
        {
          svg:
            '<rect stroke="gray" fill="#FFD" x="1" y="1" width="16" height="16" />' +
            '<line stroke-width="2" stroke="black" x1="18" y1="18" x2="9" y2="9" />' +
            '<circle stroke="black" fill="silver" cx="9" cy="9" r="4" />' +
            '<polygon stroke="black" fill="black" points="16,2 12,2 16,6" />' +
            '<polygon stroke="black" fill="black" points="2,2 2,6 6,2" />' +
            '<polygon stroke="black" fill="black" points="2,16 6,16 2,12" />',
          title: 'Zoom to Full Extent',
          call: 'zoomToFullExtent()'
        },
        {
          svg:
            '<polygon stroke="maroon" fill="#FFCCCC" points="8,1 17,1 17,4 11,7" />' +
            '<polygon stroke="maroon" fill="#FFCCCC" points="17,4 17,13 14,13 11,7" />' +
            '<polygon stroke="teal" fill="aqua" points="5,1 8,1 14,13 5,13" />' +
            '<line stroke-width="2" stroke="black" x1="12" y1="18" x2="5" y2="11" />' +
            '<circle stroke="black" fill="silver" cx="5" cy="11" r="4" />',
          title: 'Zoom to Selection',
          call: 'zoomToSelection()'
        },
        {
          svg:
            '<polygon stroke="maroon" fill="#FFCCCC" points="8,1 17,1 17,4 11,7" />' +
            '<polygon stroke="maroon" fill="#FFCCCC" points="17,4 17,13 14,13 11,7" />' +
            '<polygon stroke="teal" fill="aqua" points="5,1 8,1 14,13 5,13" />' +
            '<path stroke="black" fill="white" d="m 5,19 -4,-4 0,-1 1,-1 1,0 2,2 1,-1 -4,-4 0,-1 1,-1 1,0 0,1 0,-2 1,0 1,1 0,1 0,-1 1,-1 1,1 0,1 1,-1 1,1 2,10 z" />' +
            '<path stroke="white" fill="black" d="m 3,9 4,4 1,0 -3,-5 3,5 1,0 -2,-5 2,5 1,0 -1,-4" />',
          title: 'Pan to Selection',
          call: 'panToSelection()'
        },
        {
          svg:
            '<polygon stroke="maroon" fill="#FFCCCC" points="5,1 17,1 17,5 9,9" />' +
            '<polygon stroke="maroon" fill="#FFCCCC" points="17,5 17,17 13,17 9,9" />' +
            '<polygon stroke="maroon" fill="#FFCCCC" points="1,1 5,1 13,17 1,17" />',
          title: 'Clear Selection',
          call: 'clearSelection()'
        }
      ];
    for (n = a.length, i = 0; i < n; ++i)
    {
      q = L.DomUtil.create('a', null, p);
      q.innerHTML = '<svg width="18" height="18">' + a[i].svg + '</svg>';
      q.title = a[i].title;
      q.href = 'javascript:' + a[i].call;
    }
    return p;
  };
  const url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osm = 'Base data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  tileLayer = L.tileLayer(url, { attribution: osm });
  pointLayer = L.geoJSON(null, { pointToLayer: stylePoint, onEachFeature: addListener });
  nonpointLayer = L.geoJSON(null, { style: { color: 'maroon', fillColor: 'red' }, onEachFeature: addListener });

  /* Iterate through each row of the table, processing the GeoJSON cell as necessary. */
  for (let c, g, a, m, j, p, x, y, s, n = table.rows.length, i = 1; i < n; ++i)
  {
    c = table.rows[i].cells[geoColumn];
    g = JSON.parse(c.textContent);

    /* Determine the full bounds/extents. */
    switch (g.type)
    {
      case 'Point': a = [g.coordinates]; s = '&bull;&nbsp;Point'; break;
      case 'LineString': a = g.coordinates; s = '&acd;&nbsp;LineString'; break;
      case 'Polygon': a = g.coordinates[0]; s = '&rect;&nbsp;Polygon'; break;
      case 'MultiPolygon': a = g.coordinates.flat(2); s = '&boxbox;&nbsp;MultiPolygon';
    }
    for (m = a.length, j = 0; j < m; ++j)
    {
      p = a[j]; x = p[0]; y = p[1];
      if (y < extents[0][0]) extents[0][0] = y;
      if (x < extents[0][1]) extents[0][1] = x;
      if (y > extents[1][0]) extents[1][0] = y;
      if (x > extents[1][1]) extents[1][1] = x;
    }

    /* Add a GeoJSON feature to the appropriate layer. */
    geoObject.features.push(p = { type: 'Feature', properties: { index: i }, geometry: g });
    if (p.geometry.type == 'Point') pointLayer.addData(p); else nonpointLayer.addData(p);

    /* Replace the GeoJSON text in the geometry column with a feature selection link. */
    a = document.createElement('a');
    a.href = `javascript:selectFeature(${i}, false)`;
    a.innerHTML = s;
    c.textContent = '';
    c.appendChild(a);
  }

  /* Initialize the Leaflet map. */
  initMap();

  /* Initialize variables for feature selection. */
  rows = document.getElementsByTagName('tr');
  backPoint = L.circleMarker(null, { radius: 7, color: 'aqua', fillOpacity: 1 });
  forePoint = L.circleMarker(null, { radius: 5, color: 'teal', fill: false });
  backLine = L.polyline([null], { color: 'aqua', weight: 7 });
  foreLine = L.polyline([null], { color: 'teal' });
  backPolygon = L.polygon([null], { color: 'aqua', fillOpacity: 0.8, weight: 7 });
  forePolygon = L.polygon([null], { color: 'teal', fill: false });
}


function stylePoint(feature, latLng)
{ return L.circleMarker(latLng, { radius: 5, color: 'maroon', fillColor: 'red', fillOpacity: 1 }); }


function addListener(feature, layer) { layer.on('click', function () { selectFeature(feature.properties.index, true); }); }


function switchView()
{
  var i = selectedIndex;
  clearSelection();
  nonpointLayer.remove();
  pointLayer.remove();
  tileLayer.remove();
  control.remove();
  map.remove();
  if (horizontal) splitVertically(); else splitHorizontally();
  initMap();
  if (i) selectFeature(i, true);
}


function splitHorizontally()
{
  orientView(true);
  tableDiv.style.float = '';
  tableDiv.style.maxWidth = usableWidth + 'px';
  tableDiv.style.maxHeight = halfHeight + 'px';
  mapDiv.style.height = Math.max(halfHeight, usableHeight - tableDiv.clientHeight) + 'px';
}


function splitVertically()
{
  orientView(false);
  tableDiv.style.float = 'left';
  tableDiv.style.maxWidth = halfWidth + 'px';
  tableDiv.style.maxHeight = usableHeight + 'px';
  mapDiv.style.height = usableHeight + 'px';
}


function orientView(horizontally)
{
  const space = 20;
  halfWidth = (usableWidth = window.innerWidth - space) / 2;
  halfHeight = (usableHeight = window.innerHeight - space - ((horizontal = horizontally) ? 8 : 0)) / 2;
}


function initMap()
{
  map = L.map(mapDiv).fitBounds(extents);
  control.addTo(map);
  tileLayer.addTo(map);
  pointLayer.addTo(map);
  nonpointLayer.addTo(map);
}


function selectFeature(index, scroll)
{
  clearSelection();
  selectedGeometry = geoObject.features[(selectedIndex = index) - 1].geometry;
  selectRow(true);
  var latLng;
  switch (selectedGeometry.type)
  {
    case 'Point':
      latLng = L.GeoJSON.coordsToLatLng(selectedGeometry.coordinates);
      backPoint.setLatLng(latLng).addTo(map);
      forePoint.setLatLng(latLng).addTo(map);
      break;
    case 'LineString':
      latLng = L.GeoJSON.coordsToLatLngs(selectedGeometry.coordinates);
      backLine.setLatLngs(latLng).addTo(map);
      foreLine.setLatLngs(latLng).addTo(map);
      break;
    case 'Polygon': case 'MultiPolygon':
      latLng = L.GeoJSON.coordsToLatLngs(selectedGeometry.coordinates, (selectedGeometry.type == 'MultiPolygon') ? 2 : 1);
      backPolygon.setLatLngs(latLng).addTo(map);
      forePolygon.setLatLngs(latLng).addTo(map);
      break;
  }
  if (scroll) rows[index].scrollIntoView();
}


function zoomToFullExtent() { map.flyToBounds(extents); }


function zoomToSelection()
{
  if (!selectedIndex) return;
  var bounds;
  switch (selectedGeometry.type)
  {
    case 'Point': let latLng = forePoint.getLatLng(); bounds = L.latLngBounds(latLng, latLng); break;
    case 'LineString': bounds = foreLine.getBounds(); break;
    case 'Polygon': case 'MultiPolygon': bounds = forePolygon.getBounds(); break;
    default: return;
  }
  map.flyToBounds(bounds);
}


function panToSelection()
{
  if (!selectedIndex) return;
  var latLng;
  switch (selectedGeometry.type)
  {
    case 'Point': latLng = forePoint.getLatLng(); break;
    case 'LineString': latLng = foreLine.getCenter(); break;
    case 'Polygon': case 'MultiPolygon': latLng = forePolygon.getCenter(); break;
    default: return;
  }
  map.panTo(latLng);
}


function clearSelection()
{
  if (!selectedIndex) return;
  forePolygon.remove(); foreLine.remove(); forePoint.remove();
  backPolygon.remove(); backLine.remove(); backPoint.remove();
  selectRow(false);
  selectedIndex = 0;
}


function selectRow(selecting) { rows[selectedIndex].style.backgroundColor = selecting ? 'aqua' : ''; }
