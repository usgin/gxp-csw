var mapLayer = Ext.extend(Object, {
		constructor: function(type, url, name, map) {
			this.type = type;
			this.url = url;
			this.name = name;
			this.map = map;
			// TODO: Remove dependency on app variable
			this.app = app;
		},
		connect: function() {
			var expander = new Ext.grid.RowExpander({
	            tpl: new Ext.Template("<p><b>Abstract:</b> {abstract}</p>")
	        });
			
			// TODO: Adjust so that proxy location is read from OpenLayers or Viewer config
			var capabilitiesUrl = "proxy?url=" + encodeURIComponent(this.url + "?request=GetCapabilities&service=WMS");
			
			if (this.type == "wms") {
				this.app.addLayerSource({
					id: this.url,
					config: {
						ptype: "gxp_wmssource",
						url: capabilitiesUrl
					},
					callback: function() {
						Ext.getCmp(this.name + "-add-button").setIcon("csw/img/map_add.png");
						source = this.app.layerSources[this.url];
						layerChooser = new Ext.Window({
							id: "wms-layer-chooser",
							title: "WMS Layers Available",
							tbar: [ "Available layers from " + source.title ],
							layout: "fit",
							height: 300,
							width: 450,
							modal: true,
							items: [
						        new Ext.grid.GridPanel({
						        	id: "wms-grid",
						        	store: source.store,
						        	autoScroll: true,
						        	autoExpandColumn: "title",
						        	plugins: [ expander ],
						        	loadMask: true,
						        	colModel: new Ext.grid.ColumnModel([
								        expander,
								        {id: "title", header: this.panelTitleText, dataIndex: "title", sortable: true},
								        {header: "Id", dataIndex: "name", width: 150, sortable: true}
								    ]),
								    bbar: [ "->",
							           new Ext.Button({
							        	   text: "Add layers",
							        	   iconCls: "gxp-icon-addlayers",
							        	   source: source,
							        	   layers: this.app.mapPanel.layers,
							               handler: function() {
							            	   records = Ext.getCmp("wms-grid").getSelectionModel().getSelections();
							            	   var addThese = [];
										       for (var i=0, ii=records.length; i<ii; ++i) {
										        	addThese.push(this.source.createLayerRecord({
										                name: records[i].get("name"),
										                source: this.source
										            }));
										        }
										        this.layers.add(addThese);
							               }
							           }),
							           new Ext.Button({
							        	   text: "Done",
							        	   handler: function() { Ext.getCmp("wms-layer-chooser").destroy(); }
							           })
						            ]
						        })
					        ]
						});
						layerChooser.show();
					},
					scope: this
				});
			}
		}
});