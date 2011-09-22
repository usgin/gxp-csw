Ext.namespace("gxp.plugins");

gxp.plugins.CswSearch = Ext.extend(gxp.plugins.Tool, {
	ptype: "csw_search",
	
	constructor: function(config) {
		gxp.plugins.CswSearch.superclass.constructor.apply(this, arguments);		
	},
	
	addOutput: function(config) {
		config = Ext.apply({
			xtype: "panel",
			id: "csw-search-container",			
			layout: "border",
			tbar: [
			       "Search: ", 
			       " ", 
			       new Ext.form.TriggerField({
						id: "csw-search-field",
						width: 300,
						triggerClass: "x-form-search-trigger",
						app: this.target,
						cswUrl: this.outputConfig.cswUrl,
						onTriggerClick: function() {
							performSearch(this.cswUrl, this.getSearchTerms(), this.getBbox(), 1);
						},
						getSearchTerms: function() {
							return this.getValue().replace(',', '').split(' ');
						},
						getBbox: function() {
							var checkBox = Ext.getCmp('limit-by-map-extent');
							bbox = null;
							if (checkBox.getValue() == true) {
								// Get bbox of mapExtent in EPSG:3857
								webBounds = this.app.mapPanel.map.getExtent();
								
								// Project it to EPSG:4326
								sourceProj = new OpenLayers.Projection("EPSG:3857");
								destProj = new OpenLayers.Projection("EPSG:4326");
								return webBounds.transform(sourceProj, destProj);
							}
							else { return null; }
						},
						listeners: {
							specialkey: function(f, e) {
								if(e.getKey() == e.ENTER) {
									this.onTriggerClick();
								}
							}
						}
					})
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
				        		notImplementedYet().show();
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
					searchStore: cswResultsStore(false, this.target.mapPanel.map, this.outputConfig.cswUrl),
					savedStore: cswResultsStore(true, this.target.mapPanel.map, this.outputConfig.cswUrl),			        
		        }
	        ]
		}, config || {});
		
		var cswSearch = gxp.plugins.CswSearch.superclass.addOutput.call(this, config);
		return cswSearch;
	}
});

Ext.preg(gxp.plugins.CswSearch.prototype.ptype, gxp.plugins.CswSearch);