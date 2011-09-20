function retrieveRecord(fileid) {
	var ds = Ext.getCmp("csw-results-table").resultsStore;
	var index = ds.find('fileid', fileid);
	return ds.getAt(index);
}

function retrievePanel(fileid) {
	return Ext.getCmp("csw-results-table").findById(fileid + '-result-row');
}

function downloadFile(url, filename) {
	window.open(url, filename);
}

function zoomRecord(fileid) {
	record = retrieveRecord(fileid);
	map = record.store.viewerMap;
	map.zoomToExtent(record.get('bbox'));
	bboxSelector = map.getControl('bbox-select-control');
	
	if (map.getLayersByName("CSW Bounding Boxes")[0].selectedFeatures.length > 0) { bboxSelector.unselectAll(); }
	bboxSelector.select(retrievePanel(fileid).feature);
}

function detailsRecord(fileid) {
	var record = retrieveRecord(fileid);
	var detailsUrl = record.get('protocols').details;
	window.open(detailsUrl);
}

function lockRecord(fileid) {
	/*
	var record = retrieveRecord(fileid);
	var newPanel = new cswResultRow(record.data).panel;
	var preexisting = Ext.getCmp("locked-results-panel");
	if ( preexisting == null) {
		var lockedResults = new lockedResultsPanel({
			items: [ newPanel ]
		});
		lockedResults.addPanel();
	}
	else {
		preexisting.addItems( [ newPanel ] );
	}
	*/
}

function removeRecord(fileid) {
	var panel = retrievePanel(fileid);
	var table = Ext.getCmp("csw-results-table");
	table.remove(panel);
}

function downloadRecord(fileid, url) {
	downloadFile(url, fileid);
}

function addRecord(fileid, protocols) {
	// determine which protocol to use. Preference is WMS, ESRI, WFS
	var connectUrl = "";
	var connectProtocol = "";
	if (protocols.hasOwnProperty("wfs")) { connectUrl = protocols['wfs']; connectProtocol = 'wfs';}
	if (protocols.hasOwnProperty("esri")) { connectUrl = protocols['esri']; connectProtocol = 'esri';}
	if (protocols.hasOwnProperty("wms")) { connectUrl = protocols['wms']; connectProtocol = 'wms';}
	
	// Create the appropriate type of layer
	var layer = new mapLayer(connectProtocol, connectUrl, fileid);
	
	// Connect to the new layer
	layer.connect(true);
}

function arcmapRecord(fileid, url) {
	// Construct the URL to download a layer file
	layerUrl = url + "?f=lyr&v=9.2";
	
	// Give some little instructions
	arcmapHelp = new Ext.Window({
		title: "Adding a Data Service to ArcMap",
		id: "add-arcmap-service",
		html: "<p class='window-text'>Clicking the download button below will prompt you to download a layer file. This layer file can be opened in ArcMap and will display the contents of the data service you selected.",
		width: 300,
		bbar: [
	       { text: "Download Layer File", icon: "csw/img/arrow_down.png", handler: function(btn, e) { downloadFile(btn.layerUrl); Ext.getCmp("add-arcmap-service").destroy();}, layerUrl: layerUrl },
	       "->",
	       { text: "Cancel", icon: "csw/img/cancel.png", handler: function(btn, e) { Ext.getCmp("add-arcmap-service").destroy(); } }
        ]
	});
	arcmapHelp.show();
	
}