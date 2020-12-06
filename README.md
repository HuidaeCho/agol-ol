# AGOL-OL: ArcGIS Online (AGOL) Web Map using OpenLayers

I wrote this JavaScript code to display one of my web maps hosted on ArcGIS
Online (AGOL). I did not put much time and effort to polish this code, so it is
just good enough to display [this map](http://www.arcgis.com/home/item.html?id=b528fdc8b48e40ad925225387966f523)
and identify feature attributes. For demo, please visit https://app.isnew.info/agol-ol.

# Usage

```
createWebMap(mapDivId, itemId, extentLayerName);
```

# HTML Example

```
<html>
  <head>
    <title>ArcGIS Online (AGOL) Web Map using OpenLayers</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/openlayers/4.2.0/ol.css" type="text/css">
    <link rel="stylesheet" href="agol-ol.css" type="text/css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/openlayers/4.2.0/ol.js" type="text/javascript"></script>
    <script src="agol-ol.js" type="text/javascript"></script>
  </head>
  <body>
    <div id="map" class="map"></div>
    <script type="text/javascript">
      // create a web map
      createWebMap(
        // div ID for the map
        'map',
        // portal item ID of my web map
        'b528fdc8b48e40ad925225387966f523',
        // extent layer name
        'firestations');
    </script>
  </body>
</html>
```

# License

Copyright (C) 2017, Huidae Cho <https://idea.isnew.info>

This program is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option)
any later version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
more details.

You should have received a copy of the GNU General Public License along with
this program. If not, see <http://www.gnu.org/licenses/>.
