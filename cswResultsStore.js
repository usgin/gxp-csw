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
	// Get a couple of references from the record passed in
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

/*
 * cswResultsStore is an Ext.data.JsonStore containing the results of the current csw output.
 * 	Its loadData method expects an object that is the parsed output from OpenLayers.Format.CSWRecords
 * 
 * TODO: Make sure fields are valid in GeoNetwork responses
 */

function cswResultsStore(tableId, map) {
	return new Ext.data.JsonStore({
		root: "records",
		tableId: tableId,
		viewerMap: map,
		idProperty: "identifier[0].value",
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
      			table = Ext.getCmp(store.tableId);
      			for (var i = 0; i < store.getCount(); i++) {
      				table.add(store.getRecordAsPanel(store.getAt(i)));
      			}
      			table.doLayout();
      		},
      		remove: function(store, record, index) {
      			table = Ext.getCmp(store.tableId);
      			panel = table.findById(record.get('fileid') + '-result-row');
      			table.remove(panel);
      		},
      		clear: function(store, records) {
      			table = Ext.getCmp(store.tableId);
      			table.removeAll();
      		}
      	},
      	getRecordAsPanel: function(record) {
      		return cswResultRow(record);
      	}
	});
}
	
