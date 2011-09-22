performSearch = function(cswUrl, searchTerms, bbox, start) {
	var theFilter = generateFilters(searchTerms, bbox);
		
	// Build the searchObject
	var searchObject = {
		maxRecords: 20,
		resultType: "results",
		startPosition: start,
		Query: {					
			ElementSetName: {"value": "summary"},
			Constraint: {
				version: "1.1.0",
				Filter: theFilter
			}
		}			
	};
	
	// Generate the CSW Search String
	var parser = new OpenLayers.Format.CSWGetRecords();
	var cswSearchString = parser.write(searchObject);
	
	// Send the request
	Ext.Ajax.request({
		// TODO: Adjust so that proxy location is read from OpenLayers or Viewer config
		url: "proxy?url=" + encodeURIComponent(cswUrl),
		method: "POST",
		xmlData: cswSearchString,
		callback: function(options, success, response) {
			// Parse the response
			if (success) {
				cswResponse = response.responseText;
				parsedResponse = parser.read(cswResponse);
				
				tabContainer = Ext.getCmp("csw-tab-container");
				resultsStore = tabContainer.searchStore;
				if (tabContainer.findById("csw-search-table") == null) {
					tabContainer.add(Ext.apply(resultsStore.panel, {
						listeners: {
							add: function(table, newPanel, index) {
								// Make sure the map contains a bboxLayer
								if (table.layout == "toolbar") { return; }
								map = table.map;
								bboxLyrs = map.getLayersByName("CSW Bounding Boxes");
								if (bboxLyrs.length < 1) {
									bboxLyr = bboxLayer();
									map.addLayer(bboxLyr);
									addBboxControls(bboxLyr, map, table);
								}
								else {
									bboxLyr = bboxLyrs[0];
								}
								
								// Add a bbox to the layer								
								bboxLyr.addFeatures([ newPanel.feature ]);
							},
							remove: function(table, removedPanel) {
								table.map.getLayersByName("CSW Bounding Boxes")[0].removeFeatures([ removedPanel.feature ]);
							}
						}
					}));
				}
				
				// parsedResponse.success = false indicates an exception was returned
				resultsStore.removeAll();
				if (parsedResponse.success == false) { return; }
				else { 
					resultsStore.loadData(parsedResponse);
					resultsStore.adjustPaginator(parsedResponse.SearchResults);
				}
				tabContainer.activate("csw-results-table");
			}
			else {
				alert("Search Failed!");
			}
		}
	});
};

/**
 * Create OpenLayers.Filter for use in CSW GetRecords request. Of the general type
 * 	(keyword OR keyword OR ...) AND WITHIN bbox
 * @param searchTerms -- a simple array of keywords
 * @param bbox -- an OpenLayers.Bounds object, assumed projection of WGS84
 * @returns -- an OpenLayers.Filter, or null if no terms or bbox was provided.
 */	
function generateFilters(searchTerms, bbox) {
	if (searchTerms.length > 0) {
		var keywordFilters = [];
		fullFilter = null;
		for (var i = 0; i < searchTerms.length; i++) {
			keywordFilters.push(new OpenLayers.Filter.Comparison({
				type: OpenLayers.Filter.Comparison.LIKE,
				property: "AnyText",
				value: searchTerms[i]
			}));
		}
		keywordFilter = new OpenLayers.Filter.Logical({
			type: OpenLayers.Filter.Logical.OR,
			filters: keywordFilters
		});
		fullFilter = keywordFilter;
	}
	
	if (bbox) {
		bboxFilter = new OpenLayers.Filter.Spatial({
			type: OpenLayers.Filter.Spatial.WITHIN,
			property: 'ows:BoundingBox',
			value: bbox, // should be of type OpenLayers.Bounds(xmin,ymin,xmax,ymax), should be in WGS84
			projection: "EPSG: 4326"
		});
		fullFilter = bboxFilter;
	}
	
	if (searchTerms.length > 0 && bbox) {
		fullFilter = new OpenLayers.Filter.Logical({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ keywordFilter, bboxFilter ]
		});
	}
	
	return fullFilter;
};