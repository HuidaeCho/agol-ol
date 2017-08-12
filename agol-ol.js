// JavaScript code to display a web map hosted on ArcGIS Online (AGOL) using
// OpenLayers 4.2.0
//
// vim: ts=2 sw=2
//
// Copyright (C) 2017, Huidae Cho <https://idea.isnew.info>
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option)
// any later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along with
// this program. If not, see <http://www.gnu.org/licenses/>.
//
// Usage: createWebMap(mapDivId, itemId, extentLayerName);
//
// References
// http://openlayers.org/en/latest/apidoc/
// https://resources.arcgis.com/en/help/rest/apiref/index.html

let debug = true;

function log(log) {
	if(debug)
		console.log(log);
}

function message(message) {
	console.log(message);
}

// portal item ID of my web map
let itemId = 'b528fdc8b48e40ad925225387966f523';

// [r, g, b, a] (0-255) => [r, g, b (0-255), a (0-1)]
function createColorFromEsriColor(color) {
	return color.slice(0, 3).concat(color[3] / 255);
}

// create a style from an ESRI PMS symbol
function createStyleFromEsriPMSSymbol(symbol) {
	/*
	// icon.getSize() returns null; let's try Image
	// I don't want to implement a callback function just to
	// get the icon size because it's getting more
	// complicated; let's just use its known size here
	let width, height;
	let img = new Image();
	img.src = 'data:' + symbol.contentType + ';base64,' + symbol.imageData;
	img.onload = function() {
		width = this.width;
		height = this.height;
		log([width, height]);
	}
	*/
	let width = 64;
	let height = 64;
	// take the average scale
	let scale = (symbol.width / width + symbol.height / height) / 2;
	return new ol.style.Style({
		image: new ol.style.Icon({
			src: 'data:' + symbol.contentType + ';base64,' + symbol.imageData,
			// size only clips and doesn't scale the icon
			scale: scale
		})
	});
}

// create a style from an ESRI SLS symbol
function createStyleFromEsriSLSSymbol(symbol) {
	let style;
	switch(symbol.style) {
		case 'esriSLSSolid':
			style = new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: createColorFromEsriColor(symbol.color),
					width: symbol.width
				})
			});
			break;
		default:
			message(symbol.style + ': Not implemented');
			break;
	}
	return style;
}

// create a style from an ESRI SFS symbol
function createStyleFromEsriSFSSymbol(symbol) {
	let style;
	switch(symbol.style) {
		case 'esriSFSSolid':
			style = new ol.style.Style({
				fill: new ol.style.Fill({
					color: createColorFromEsriColor(symbol.color)
				}),
				stroke: new ol.style.Stroke({
					color: createColorFromEsriColor(symbol.outline.color),
					width: symbol.outline.width
				})
			});
			break;
		default:
			message(symbol.style + ': Not implemented');
			break;
	}
	return style;
}

// create a style from an ESRI symbol
function createStyleFromEsriSymbol(symbol) {
	let style;
	switch(symbol.type) {
		case 'esriPMS':
			style = createStyleFromEsriPMSSymbol(symbol);
			break;
		case 'esriSLS':
			style = createStyleFromEsriSLSSymbol(symbol);
			break;
		case 'esriSFS':
			style = createStyleFromEsriSFSSymbol(symbol);
			break;
		default:
			message(symbol.type + ': Not implemented');
			break;
	}
	return style;
}

// create a style from an ESRI simple renderer
function createStyleFromEsriSimpleRenderer(renderer) {
	return createStyleFromEsriSymbol(renderer.symbol);
}

// create a style from an ESRI unique value renderer
function createStyleFromEsriUniqueValueRenderer(renderer) {
	return function(feature, res) {
		let style = createStyleFromEsriSymbol(renderer.defaultSymbol);
		let value = feature.get('attributes')[renderer.field1];
		let info = renderer.uniqueValueInfos;
		for(let i = 0; i < info.length; i++) {
			if(value == info[i].value) {
				style = createStyleFromEsriSymbol(info[i].symbol);
				break;
			}
		}
		return style;
	}
}

// create a style from an ESRI class breaks renderer
function createStyleFromEsriClassBreaksRenderer(renderer) {
	return function(feature, res) {
		let style = createStyleFromEsriSymbol(renderer.defaultSymbol);
		// not sure why this object is an array; let's use the first element
		let classBreakStyle = createStyleFromEsriSymbol(
			renderer.classBreakInfos[0].symbol);
		let visVars = renderer.visualVariables;
		// let's assume visualVariables are sorted by value for now; I may be
		// wrong
		for(let i = 0; i < visVars.length; i++) {
			if(visVars[i].type == 'colorInfo') {
				let value = feature.get('attributes')[visVars[i].field];
				let stops = visVars[i].stops;
				for(let j = 0; j < stops.length; j++) {
					if((j == 0 || value >= stops[j-1].value) &&
						 (j == stops.length - 1 || value < stops[j].value)) {
						style = new ol.style.Style({
							fill: new ol.style.Fill({
								color: createColorFromEsriColor(stops[j].color)
							}),
							stroke: classBreakStyle.getStroke()
						});
						break;
					}
				}
				break;
			}
		}
		return style;
	}
}

// create a style from an ESRI fixed symbols renderer
function createStyleFromEsriFixedSymbolsRenderer(renderer) {
	let style;
	switch(renderer.type) {
		case 'simple':
			style = createStyleFromEsriSimpleRenderer(renderer);
			break;
		case 'uniqueValue':
			style = createStyleFromEsriUniqueValueRenderer(renderer);
			break;
		case 'classBreaks':
			style = createStyleFromEsriClassBreaksRenderer(renderer);
			break;
	}
	return style;
}

// create a style from ESRI drawing info
function createStyleFromEsriDrawingInfo(drawingInfo) {
	let style;
	if(drawingInfo.fixedSymbols) {
		style = createStyleFromEsriFixedSymbolsRenderer(drawingInfo.renderer);
	} else {
		message('Non-fixed symbols: Not implemented');
	}
	return style;
}

// create a feature from an ESRI feature
function createFeatureFromEsriFeature(geomType, data) {
	var feature;
	// for now, only supports points, polylines, and polygons
	switch(geomType) {
		case 'esriGeometryPoint':
			feature = new ol.Feature({
				// create a point
				geometry: new ol.geom.Point([
					data.geometry.x, data.geometry.y]),
				// store feature attributes for query
				attributes: data.attributes
			});
			break;
		case 'esriGeometryPolyline':
			feature = new ol.Feature({
				// create a multi-line string
				geometry: new ol.geom.MultiLineString(data.geometry.paths),
				// store feature attributes
				attributes: data.attributes
			});
			break;
		case 'esriGeometryPolygon':
			feature = new ol.Feature({
				// create a polygon
				geometry: new ol.geom.Polygon(data.geometry.rings),
				// store feature attributes
				attributes: data.attributes
			});
			break;
		default:
			message(geomType + ': Not implemented');
	}
	//log(feature.get('attributes'));
	return feature;
}

// create features from an ESRI feature set
function createFeaturesFromEsriFeatureSet(data) {
	let geomType = data.geometryType;
	return data.features.map(data => {
		return createFeatureFromEsriFeature(geomType, data);
	});
}

// encode <, >, and &
function encodeHTML(text) {
	return text.replace('<', '&lt;').replace('>', '&gt;').replace('&', '&amp;');
}

// remove elements by class
function removeElementsByClass(className) {
	let elements = document.getElementsByClassName('info');
	while(elements.length > 0)
		elements[0].parentNode.removeChild(elements[0]);
}

// remove an element by ID
function removeElementById(id) {
	let element = document.getElementById(id);
	element.parentNode.removeChild(element);
}

// create a web map using an AGOL portal item ID
function createWebMap(mapDivId, itemId, extentLayerName) {
	// URL for AGOL REST resources
	let dataUrl = 'http://www.arcgis.com/sharing/rest/content/items/' + itemId +
		'/data';

	// fetch and process the web map JSON data
	fetch(dataUrl)
	.then(res => res.json())
	.then(data => {
		//log(data);
		// define a projection
		let projection = 'EPSG:' + data.spatialReference.latestWkid;
		// create basemap layers
		let basemapLayers = data.baseMap.baseMapLayers.map(data => {
			return new ol.layer.Tile({
				source: new ol.source.TileArcGISRest({
					url: data.url,
					projection: projection
				})
			});
		});
		// place holder for the extent
		let extent;
		// place holder for all layers in the web map
		let layers = [];
		// create an array of flattened layers
		data.operationalLayers.forEach(data => {
			//log(data);
			let id = data.id;
			let title = data.title;
			let visibility = data.visibility;
			let opacity = data.opacity;
			// create layers from data.featureCollection
			data.featureCollection.layers.map(data => {
				//log(data);
				// get the layer definition
				let layerDef = data.layerDefinition;
				// get the feature set
				let featureSet = data.featureSet;

				// set the layer projection
				let projection = 'EPSG:' + layerDef.spatialReference.latestWkid;
				// read symbology info
				let drawingInfo = layerDef.drawingInfo;
				log(drawingInfo);
				let style = createStyleFromEsriDrawingInfo(drawingInfo);
				// get field definitions
				let fields = layerDef.fields;
				// use the extent of the census blocks layer
				if(layerDef.name == extentLayerName)
					extent = ol.extent.boundingExtent([
						[layerDef.extent.xmin, layerDef.extent.ymin],
						[layerDef.extent.xmax, layerDef.extent.ymax]]);

				// create features
				let features = createFeaturesFromEsriFeatureSet(featureSet);
				log(style);
				// return a new vector layer
				return new ol.layer.Vector({
					source: new ol.source.Vector({
						features: features
					}),
					opacity: opacity,
					visible: visibility,
					style: style,
					// metadata from JSON
					id: id,
					title: title,
					fields: fields
				});
			}).forEach(layer => {
				layers.push(layer);
			});
		});

		// create a map
		let map = new ol.Map({
			target: mapDivId,
			// now add all web map layers to the map
			layers: basemapLayers.concat(layers),
			view: new ol.View({
				// make sure to use the same spatial reference as the web map
				projection: projection,
				// constrain panning inside the census layer
				extent: extent,
				// pan to the center of the census layer
				center: ol.extent.getCenter(extent),
				// default zoom level
				zoom: 10
			}),
			interactions: ol.interaction.defaults().extend([
				new ol.interaction.Select({
					condition: ol.events.condition.pointerMove,
					style: new ol.style.Style({
						image: new ol.style.Circle({
							radius: 8,
							stroke: new ol.style.Stroke({
								color: '#ff0000',
								width: 3
							})
						}),
						stroke: new ol.style.Stroke({
							color: '#ff0000',
							width: 3
						})
					})
				})
			])
		});
		// fit to the extent independent oof the zoom level
		map.getView().fit(extent);

		// implement the popup
		map.on('click', e => {
			// remove all existing feature info tables
			removeElementsByClass('info');
			let infoId = 0;
			let x = e.pixel[0];
			let y = e.pixel[1];

			// query features
			map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
				// retreive field definitions from the layer
				let fields = layer.get('fields');
				// retrieve feature attributes from the feature
				let attr = feature.get('attributes');
				// start a attribute table
				infoId++;
				let infoText = '<div class="titlebar">' + layer.get('title') +
					'<a class="close" href="#" title="Click to close" ' +
					'onclick="removeElementById(' + infoId +
					'); return false;">Close</a></div>' +
					'<table><tr><th>Key</th><th>Value</th></tr>';
				for(let key in attr) {
					let keyText = key;
					let valueTd = '<td class="right">' + attr[key] + '</td>';
					for(let i = 0; i < fields.length; i++) {
						if(fields[i].name == key) {
							if(fields[i].alias != fields[i].name)
								keyText = fields[i].alias;
							if(fields[i].type == 'esriFieldTypeString')
								// encode <, >, and & only if it's text
								valueTd = '<td class="left">' + encodeHTML(attr[key]) + '</td>';
							break;
						}
					}
					// encode <, >, and &
					keyText = encodeHTML(keyText);
					// add a new row
					infoText += '<tr><th>' + keyText + '</th>' + valueTd;
				}
				// close the attribute table
				infoText += '</table>';
				infoDiv = document.createElement('div');
				infoDiv.innerHTML = infoText;
				infoDiv.id = infoId;
				infoDiv.className = 'info';
				infoDiv.style.position = 'absolute';
				infoDiv.style.zIndex = 0;
				infoDiv.style.left = x + 'px';
				infoDiv.style.top = y + 'px';
				document.body.appendChild(infoDiv);
				x += 20;
				y += 20;
			});
		});
	});
}
