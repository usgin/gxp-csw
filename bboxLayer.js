/*
 * bboxLayer is just an OpenLayers.Layer.Vector
 */
function bboxLayer() {
	return  new OpenLayers.Layer.Vector(
		"CSW Bounding Boxes", 
		{
			styleMap: new OpenLayers.StyleMap({
				'default': new OpenLayers.Style({
					fillOpacity: 0,
					strokeColor: '#0CAFF0',
					strokeWidth: 1
				}),
				'select': new OpenLayers.Style({
					fillColor: '#ee9900',
					fillOpacity: 0.2,
					strokeColor: '#ee9900',
					strokeWidth: 3
				}),
				'hover': new OpenLayers.Style({
					strokeColor: '#FEFE00',
					strokeWidth: 3
				})
			}) 
		}
	);
}

function addBboxControls(bboxLyr, map, resultsTable) {
	// One control to highlight boxes as you hover over them
	var hover = new OpenLayers.Control.SelectFeature(
			bboxLyr,
			{
				hover: true,
				highlightOnly: true,
				renderIntent: "hover",
				autoActivate: true,
				id: 'bbox-hover-control',
				eventListeners: {
					featurehighlighted: function(e) {
						// If the feature is selected by the other control, do not highlight it
						thisFeature = e.feature;
						if (bboxLyr.selectedFeatures[0] == thisFeature) {
							// This just redraws the feature with the "select" style defined above
							bboxLyr.drawFeature(thisFeature, 'select');
						}
					}
				}
			}
	);
	
	// Another control to actually select the features
	var select = new OpenLayers.Control.SelectFeature(
			bboxLyr,
			{
				renderIntent: "select",
				autoActivate: true,
				id: 'bbox-select-control',
				onSelect: function(feature) {
					// Select the Panel that corresponds to this bbox
					// TODO: Implement selection of the result in the table
				}							
			}
	);
	
	// allow mousedown events to propagate to other controls
	hover.handlers.feature.stopDown = false;
	select.handlers.feature.stopDown = false;
	
	// Add the controls to the map
	map.addControls([ hover, select ]);
}
