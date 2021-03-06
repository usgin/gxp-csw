/*
 * bboxLayer is just an OpenLayers.Layer.Vector
 */
function bboxLayer() {
	return  new OpenLayers.Layer.Vector(
		"Search Result Footprints", 
		{
			styleMap: new OpenLayers.StyleMap({
				'default': new OpenLayers.Style({
					fillOpacity: 0,
					strokeColor: '#3C52FA',
					strokeWidth: 1
				}),
				'select': new OpenLayers.Style({
					fillColor: '#FF6426',
					fillOpacity: 0.2,
					strokeColor: '#FF6426',
					strokeWidth: 3
				}),
				'hover': new OpenLayers.Style({
					strokeColor: '#16F7EC',
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
					store = Ext.getCmp("csw-tab-container").searchStore;
					record = store.getAt(store.find('fileid', feature.attributes.fileid));
					panel = store.getRecordPanel(record);
					if (store.selectedPanel || false) { store.selectedPanel.removeClass("result-row-selected"); }
					panel.addClass("result-row-selected");
					store.selectedPanel = panel;
				}							
			}
	);
	
	// allow mousedown events to propagate to other controls
	hover.handlers.feature.stopDown = false;
	select.handlers.feature.stopDown = false;
	
	// Add the controls to the map
	map.addControls([ hover, select ]);
}
