/*
 * buildToolbar constructs the tools appropriate for the record passed in
 * 	Much of the logic here is for determining which buttons to make available
 * 	and is determined based on the "protocol" attribute of the record passed in
 */
function buildToolbar(record, saved) {
	spacerWidth = 3;
	
	// Everything has a details button
	detailsButton = new Ext.Button({
		handler: function(btn, e) {
			detailsRecord(btn.fileid); // to be defined
		},
		text: 'Details',
		fileid: record.fileid,
		icon: 'csw/img/magnifier.png'
	});
	
	if (saved) {			
		// Locked results have an unlock button
		unlockButton = new Ext.Button({
			handler: function(btn, e) {
				unlockRecord(btn.fileid);
			},
			text: "Unlock",
			fileid: record.fileid,
			icon: 'csw/img/lock_open.png'
		});
		items = [ unlockButton, new Ext.Toolbar.Spacer({ width: spacerWidth }), detailsButton ];
	}
	else {			
		// these two buttons are standard for search results.
		lockButton = new Ext.Button({
			handler: function(btn, e) {
				lockRecord(btn.fileid); 
			},
			text: 'Lock',
			fileid: record.fileid,
			icon: 'csw/img/lock.png'
		});
		
		removeButton = new Ext.Button({
			handler: function(btn, e) {
				removeRecord(btn.fileid);
			},
			text: 'Remove',
			fileid: record.fileid,
			icon: 'csw/img/cancel.png'
		});
		items = [ lockButton, new Ext.Toolbar.Spacer({ width: spacerWidth }), removeButton, new Ext.Toolbar.Spacer({ width: spacerWidth }), detailsButton ];
	}					
	
	// Begin constructing the toolbar
	toolbar = new Ext.Toolbar({
		buttonAlign: 'center',
		items: items,
		style: "border: none; border-top: 1px solid #D0D0D0;"
	});
	
	// Add conditional buttons
	var availableProtocols = record.protocols;
			
	zoomButton = new Ext.Button({
		handler: function(btn, e) {
			zoomRecord(btn.fileid); 
		},
		text: 'Zoom To',
		fileid: record.fileid,
		icon: 'csw/img/arrow_in.png'
	});
	toolbar.insertButton(0, zoomButton);
	toolbar.insert(1, new Ext.Toolbar.Spacer({ width: spacerWidth }));
	
	if (availableProtocols.hasOwnProperty('wms') || availableProtocols.hasOwnProperty('wfs') || availableProtocols.hasOwnProperty('esri')) {
		addButton = new Ext.Button({
			handler: function(btn, e) {
				addRecord(btn.fileid, availableProtocols); 
			},
			text: 'Add to Map',
			fileid: record.fileid,
			icon: 'csw/img/map_add.png'
		});
		insertIndex = toolbar.items.indexOf(detailsButton) - 1;
		toolbar.insertButton(insertIndex, addButton);
		toolbar.insert(insertIndex + 1, new Ext.Toolbar.Spacer({ width: spacerWidth }));
	}
	
	if (availableProtocols.hasOwnProperty('esri')) {
		downloadButton = new Ext.Button({
			handler: function(btn, e) {
				arcmapRecord(btn.fileid, availableProtocols.esri); 
			},
			text: 'Add to ArcMap',
			fileid: record.fileid,
			icon: 'csw/img/world_add.png'
		});
		insertIndex = toolbar.items.indexOf(detailsButton) - 1;
		toolbar.insertButton(insertIndex, downloadButton);
		toolbar.insert(insertIndex + 1, new Ext.Toolbar.Spacer({ width: spacerWidth }));
	}
	
	if (availableProtocols.hasOwnProperty('download')) {
		downloadButton = new Ext.Button({
			handler: function(btn, e) {
				downloadRecord(btn.fileid, availableProtocols.download); // to be defined
			},
			text: 'Download',
			fileid: record.fileid,
			icon: 'csw/img/arrow_down.png'
		});
		insertIndex = toolbar.items.indexOf(detailsButton) - 1;
		toolbar.insertButton(insertIndex, downloadButton);
		toolbar.insert(insertIndex + 1, new Ext.Toolbar.Spacer({ width: spacerWidth }));
	}
	
	if (availableProtocols.hasOwnProperty('contact')) {
		contactButton = new Ext.Button({
			handler: function(btn, e) {
				//TODO: Implement contact functionality
				notImplementedYet().show();
			},
			text: 'Contact',
			fileid: record.fileid,
			icon: 'csw/img/email_open.png'
		});
		insertIndex = toolbar.items.indexOf(detailsButton) - 1;
		toolbar.insertButton(insertIndex, contactButton);
		toolbar.insert(insertIndex + 1, new Ext.Toolbar.Spacer({ width: spacerWidth }));
	}
	
	// return the toolbar
	return toolbar;
}

/*
 * keywords function takes the csw output, having been parsed by OpenLayers.Format.CSWRecords,
 * 	and returns a simpler array of keywords for the data store.
 */
keywords = function(v, rec) {
	keywordArray = [];
	if (typeof(rec.subject) == 'undefined') { return keywordArray; }
	for (var i = 0; i < rec.subject.length; i++) {
		keywordArray.push(rec.subject[i].value);
	}
	return keywordArray;
};

/*
 * projectBounds is a function to reproject the bounds object created during parsing of csw output
 * 	by OpenLayers.Format.CSWRecords. The OpenLayers.Bounds object is reprojected from WGS84 to 
 * 	standard Web Mercator.
 */
projectBounds = function(v, rec) {
	wgs84Bounds = rec.BoundingBox[1].bounds;			
	destProj = new OpenLayers.Projection("EPSG:3857");
	sourceProj = new OpenLayers.Projection("EPSG:4326");
	return wgs84Bounds.transform(sourceProj, destProj);				
};

/*
 * parseOgcCapabilitiesUrl is an attempt to parse two common forms of OGC url
 * 	It is supposed to recognize MapServer URLs which have a map=... parameter
 * 	which is required in order to function.
 */
parseOgcCapabilitiesUrl = function(inputUrl) {
	var urlBits = inputUrl.split('?');
	var finalUrl = urlBits[0];
	var parameters = urlBits[1].split('&');
	for (var i = 0; i < parameters.length; i++) {
		if (parameters[i].indexOf("map=") == 0) {
			finalUrl = finalUrl + "?" + parameters[i];
			continue;
		}
	}
	return finalUrl;
};

/*
 * guessAccessProtocol is a function to try and get access points out of the csw ouput that has
 * 	been parsed by OpenLayers.Format.CSWRecords already. Returns a dictionary keyed on general 
 * 	protocol type (contact, download, wms, wfs, esri) and valued with URLs
 * 
 * Right now this is dependent on Geoportal's assigned "type".
 * TODO: Generalize guessAccessProtocols to work with GeoNetwork csw:Record
 */
guessAccessProtocol = function(v, rec) {
	// Get a couple of references from the rTecord passed in
	geoportalAssigned = rec.type[0].value; // Geoportal-assigned "type"
	allUrls = rec.references; // List of urls that geoportal offered
	results = {}; // Dictionary of protocols guessed
	needsContact = true; // Boolean to determine if we need to offer a contact button (no URLs found)
	
	// Loop through the URLs in the record
	for (var i = 0; i < allUrls.length; i++) {
		thisUrl = allUrls[i];
		
		// See if this is the link directly to the metadata record itself
		if (thisUrl.indexOf("catalog.usgin.org") != -1) {
			results['details'] = thisUrl;
			continue;
		}
		
		// Different things to look for depending on the type that geoportal assigned
		if (geoportalAssigned == 'downloadableData') {
			/* downloadableData records tend to only have a download link and/or a details link
			 *  so just add this one. If we come across a record with more than one link, we'll
			 *  have to deal with it
			 */  
			results['download'] = thisUrl;
			needsContact = false;
		}
		else if (geoportalAssigned == 'liveData') {
			// If the URL has GetCapabilities in it then it is probably for a WMS or WFS
			if (thisUrl.indexOf("GetCapabilities") != -1 || thisUrl.indexOf("getcapabilities") != -1) {
				// Look for a WFS
				if (thisUrl.indexOf("wfs") != -1 || thisUrl.indexOf("WFS") != -1) {
					results['wfs'] = parseOgcCapabilitiesUrl(thisUrl);
					needsContact = false;
				}
				// Look for a WMS
				if (thisUrl.indexOf("wms") != -1 || thisUrl.indexOf("WMS") != -1) {
					results['wms'] = parseOgcCapabilitiesUrl(thisUrl);
					needsContact = false;
				}
			}
			// Look for what looks like an ESRI service -- that is, says "MapServer" somewhere in it
			if (thisUrl.indexOf("mapserver") != -1 || thisUrl.indexOf("MapServer") != -1) {
				lowCase = thisUrl.indexOf("mapserver");
				camelCase = thisUrl.indexOf("MapServer");
				index = camelCase != -1 ? camelCase : lowCase;
				
				basicUrl = thisUrl.substring(0, index + 9);
				if (basicUrl.indexOf("rest") == -1) {
					serviceIndex = basicUrl.indexOf("/services/");
					finalUrl = basicUrl.substring(0, serviceIndex) + "/rest" + basicUrl.substring(serviceIndex);
				}
				results['esri'] = finalUrl || basicUrl;
				needsContact = false;
			}
		}
	}
	
	// If we didn't find any acceptable URLs, then just give a contact protocol
	if (needsContact) {
		results['contact'] = "Please contact this dataset's curator at: NOT IMPLEMENTED";
	}
	
	// Return the results!
	return results;
};

function paginatorButtonHandler(btn, e) {
	performSearch(btn.url, Ext.getCmp("csw-search-field").getSearchTerms(), Ext.getCmp("csw-search-field").getBbox(), btn.start);
}

/*
 * cswResultsStore is an Ext.data.JsonStore containing the results of the current csw output.
 * 	Its loadData method expects an object that is the parsed output from OpenLayers.Format.CSWRecords
 * 
 * TODO: Make sure fields are valid in GeoNetwork responses
*/
function cswResultsStore(saved, map, url) {
	if (saved) {
		tableTitle = "Saved Results";
		tableId = "csw-saved-table";
		storeId = "csw-saved-store";
		bottomBar = ["->", 
          new Ext.Button({
			text: "Save these results",
			icon: "csw/img/disk.png",
			handler: function() {
				//TODO: Implement saving record functionality
				notImplementedYet().show();
			}
          })
        ];
	}
	else {
		tableTitle = "Search Results";
		tableId = "csw-search-table";
		storeId = "csw-search-store";
		bottomBar = ["->",
             new Ext.Button({
            	 id: "csw-results-first",
            	 icon: "csw/img/resultset_first.png",
            	 url: url,
            	 start: 1,
            	 handler: paginatorButtonHandler
             }),
             new Ext.Button({
            	 id: "csw-results-previous",
            	 icon: "csw/img/resultset_previous.png",
            	 url: url,
            	 start: 1,
            	 handler: paginatorButtonHandler
             }),
             {
            	 xtype: "tbtext",
            	 id: "csw-results-text",
            	 text: "Hello, here are some records!"
             },
             new Ext.Button({
            	 id: "csw-results-next",
            	 icon: "csw/img/resultset_next.png",
            	 url: url,
            	 start: 1,
            	 handler: paginatorButtonHandler
             })             
        ];
	}
	
	return new Ext.data.JsonStore({
		id: storeId,
		root: "records",
		tableId: tableId,
		viewerMap: map,
		saved: saved,
		url: url,
		fields: [
           {name: 'title', mapping: 'title[0].value'},
           {name: 'abstract', mapping: 'abstract[0]'},
           {name: 'subject', convert: keywords},
           {name: 'type', mapping: 'type[0].value'},
           {name: 'bbox', convert: projectBounds},
           {name: 'fileid', mapping: 'identifier[0].value'},
           {name: 'docid', mapping: 'identifier[1].value'},
           {name: 'modified', mapping: 'modified[0]', type: 'date', dateFormat: 'Y-m-d\\TG:i:sP'},
           {name: 'protocols', convert: guessAccessProtocol}
      	],
      	listeners: {
      		load: function(store, records, options) {
      			table = store.getTable();
      			Ext.getCmp("csw-tab-container").activate(table);
      			for (var i = 0; i < store.getCount(); i++) {
      				record = store.getAt(i);
      				table.add(store.getRecordPanel(record));
      			}
      			table.doLayout();
      		},
      		add: function(store, records, index) {
      			table = store.getTable();
      			Ext.getCmp("csw-tab-container").activate(table);
      			for (var i = 0; i < records.length; i++) {
      				lockedRow = store.getRecordPanel(records[i]);
      				table.add(lockedRow);
      			}
      			table.doLayout();
      		},
      		remove: function(store, record, index) {
      			table = store.getTable();
      			panel = store.getRecordPanel(record);
      			table.remove(panel);
      		},
      		clear: function(store, records) {
      			store.getTable().removeAll();
      		}
      	},
      	panel: {
    			xtype: "panel",
    			title: tableTitle,
    			layout: 'table',
    			map: map,
    			id: tableId,
    			padding: 5,
    			autoScroll: true,
    			layoutConfig: { columns: 1 },
    			bbar: bottomBar
		},
      	getTable: function() {
      		return Ext.getCmp(this.tableId);
      	},
      	getRecordPanel: function(record) {
      		if (this.saved) {
      			id = record.id + "-saved-row";
      		}
      		else {
      			id = record.id + "-search-row";
      		}
      		
      		return Ext.getCmp(id) || new Ext.Panel({
      			id: id,
				cls: 'result-container',
				html: '<div class="result-heading x-panel-header">' + record.get('title') + '</div><div class="result-abstract">' + record.get('abstract') + '</div>',
				bodyStyle: "border: none;",
				style: "border-width: 1px;",
				bbar: buildToolbar(record.data, saved),
				record: record,
				feature: new OpenLayers.Feature.Vector(record.get('bbox').toGeometry(), record.data)
      		});
      	},
      	adjustPaginator: function(resultsInfo) {
      		firstRecordShown = resultsInfo.nextRecord - resultsInfo.numberOfRecordsReturned;
      		theText = "Showing " + firstRecordShown + " - " + (resultsInfo.nextRecord - 1) + " of " + resultsInfo.numberOfRecordsMatched + " results";
      		
      		// Adjust text
      		Ext.getCmp("csw-results-text").setText(theText);
      		
      		terms = Ext.getCmp("csw-search-field").getSearchTerms();
      		bbox = Ext.getCmp("csw-search-field").getBbox();
      		
      		// Adjust button starts
      		moveBack = firstRecordShown - resultsInfo.numberOfRecordsReturned;
      		Ext.getCmp("csw-results-previous").start = moveBack > 0 ? moveBack : 1;
      		
      		Ext.getCmp("csw-results-next").start = resultsInfo.nextRecord;
      		
      		// Adjust the table Title
      		Ext.getCmp("csw-search-table").setTitle("Search Results (" + resultsInfo.numberOfRecordsMatched + ")");
      	}
	});
}
	
