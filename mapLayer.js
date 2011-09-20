var mapLayer = Ext.extend(Object, {
		constructor: function(type, url, name, map) {
			this.type = type;
			this.url = url;
			this.name = name;
			this.map = map;
		},
		
		connect: function(addToMap) {
			if (this.type == 'wms') {
				var capabilitiesUrl = "/proxy?url=" + encodeURIComponent(this.url + "?request=GetCapabilities&service=WMS");
				// TODO: Find a better way to get access to the gxp.Viewer that isn't dependent on what the variable is called 
				app.addLayerSource({
					id: this.url,
					config: {
						ptype: "gxp_wmssource",
						url: capabilitiesUrl
					},
					callback: function(id) {
						source = app.layerSources[id];
						store = source.store;
						records = [];
						for (var i = 0; i < store.getCount(); i++) {
							name = store.getAt(i).get("name");
							records.push(source.createLayerRecord({
								name: name,
								source: id
							}));							
						}
						app.mapPanel.layers.add(records);
					}
				});
			}
		},
		
		addToMap: function() {			
			this.map.addLayer(this.layer);
		}


});