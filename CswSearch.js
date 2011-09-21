Ext.namespace("gxp.plugins");

gxp.plugins.CswSearch = Ext.extend(gxp.plugins.Tool, {
	ptype: "csw_search",
	
	constructor: function(config) {
		gxp.plugins.CswSearch.superclass.constructor.apply(this, arguments);
	},
	
	addOutput: function(config) {
		searchField = new Ext.form.TriggerField({
			id: "csw-search-field",
			width: 300,
			triggerClass: "x-form-search-trigger",
			app: this.target,
			cswUrl: this.outputConfig.cswUrl,
			onTriggerClick: function() {
				// Generate an array of search terms
				searchTerms = this.getValue().replace(',', '').split(' ');
				
				// Look for a defined area of interest
				var checkBox = Ext.getCmp('limit-by-map-extent');
				bbox = null;
				if (checkBox.getValue() == true) {
					// Get bbox of mapExtent in EPSG:3857
					webBounds = this.app.mapPanel.map.getExtent();
					
					// Project it to EPSG:4326
					sourceProj = new OpenLayers.Projection("EPSG:3857");
					destProj = new OpenLayers.Projection("EPSG:4326");
					bbox = webBounds.transform(sourceProj, destProj);
				}
				
				// Perform the search
				performSearch(this.cswUrl, searchTerms, bbox);
			}
		});
		searchField.on('specialkey', function(f, e) {
			if(e.getKey() == e.ENTER) {
				this.onTriggerClick();
			}
		});		
		
		config = Ext.apply({
			xtype: "panel",
			id: "csw-search-container",			
			layout: "border",
			tbar: [
			       "Search: ", " ", searchField
		        ],
			items: [
		        {
		        	xtype: "toolbar",
		        	id: "csw-bbox-tools",
					region: 'north',
					items: [
				        new Ext.Button({
				        	handler: function(btn, e) {
				        		// TODO: implement draw-a-bounding-box-button
				        	},
				        	text: 'Draw Area of Interest',
				        	icon: 'csw/img/shape_handles.png'
				        }),
				        '->',
				        new Ext.form.Checkbox({
				        	id: 'limit-by-map-extent',
				        	boxLabel: 'Use map extent to limit results',
				        }),
				        ' '
			        ],
			        height: 27,		        	
		        }, {
		        	xtype: "tabpanel",
		        	id: "csw-tab-container",
					region: "center",
					bodyStyle: "border: none;",
					headerStyle: "border-width: 0px; border-bottom-width: 1px;",
					activeTab: 0,
			        items: [
						{
							xtype: "panel",
							title: 'Search Results',
							layout: 'table',
							id: 'csw-results-table',
							app: this.target,
							padding: 5,
							autoScroll: true,
							layoutConfig: { columns: 1 },
							resultsStore: new cswResultsStore('csw-results-table', this.target.mapPanel.map), // defined in cswResultsStore.js
							listeners: {
								add: function(table, newPanel, index) {
									// Make sure the map contains a bboxLayer
									map = table.app.mapPanel.map;
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
									table.app.mapPanel.map.getLayersByName("CSW Bounding Boxes")[0].removeFeatures([ removedPanel.feature ]);
								}
							}
						}
		            ]
		        }
	        ]
		}, config || {});
		
		var cswSearch = gxp.plugins.CswSearch.superclass.addOutput.call(this, config);
		return cswSearch;
	}
});

Ext.preg(gxp.plugins.CswSearch.prototype.ptype, gxp.plugins.CswSearch);