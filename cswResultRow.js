/*
 * cswResultRow builds a panel that can be added to the result table defined in searchTool.js
 * 	Input should be a dictionary of the attributes of the record to be conveyed.
 * 	Checks for the presence of a variable called "searchMap". If this variable is
 * 	present, then buttons allowing interaction with a map are added
 */

function cswResultRow(record) {
	record = record.data;
	/*
	 * buildToolbar constructs the tools appropriate for the record passed in
	 * 	Much of the logic here is for determining which buttons to make available
	 * 	and is determined based on the "protocol" attribute of the record passed in
	 */
	function buildToolbar(record) {
		spacerWidth = 3;
		
		// these three buttons are standard.
		lockButton = new Ext.Button({
			handler: function(btn, e) {
				lockRecord(btn.fileid); // to be defined
			},
			text: 'Lock',
			fileid: record.fileid,
			icon: 'csw/img/lock.png'
		});
		
		removeButton = new Ext.Button({
			handler: function(btn, e) {
				removeRecord(btn.fileid); // to be defined
			},
			text: 'Remove',
			fileid: record.fileid,
			icon: 'csw/img/cancel.png'
		});
		
		detailsButton = new Ext.Button({
			handler: function(btn, e) {
				detailsRecord(btn.fileid); // to be defined
			},
			text: 'Details',
			fileid: record.fileid,
			icon: 'csw/img/magnifier.png'
		});
		
		// Construct the toolbar
		toolbar = new Ext.Toolbar({
			buttonAlign: 'center',
			items: [ 
		         lockButton, 
		         new Ext.Toolbar.Spacer({ width: spacerWidth }), 
		         removeButton, 
		         new Ext.Toolbar.Spacer({ width: spacerWidth }), 
		         detailsButton 
	        ]
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
			toolbar.insertButton(6, addButton);
			toolbar.insert(7, new Ext.Toolbar.Spacer({ width: spacerWidth }));
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
			insertIndex = toolbar.items.indexOf(removeButton) + 2;
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
			insertIndex = toolbar.items.indexOf(removeButton) + 2;
			toolbar.insertButton(insertIndex, downloadButton);
			toolbar.insert(insertIndex + 1, new Ext.Toolbar.Spacer({ width: spacerWidth }));
		}
		
		if (availableProtocols.hasOwnProperty('contact')) {
			contactButton = new Ext.Button({
				handler: function(btn, e) {
					alert("Not Implemented Yet!"); // to be defined
				},
				text: 'Contact',
				fileid: record.fileid,
				icon: 'csw/img/email_open.png'
			});
			insertIndex = toolbar.items.indexOf(removeButton) + 2;
			toolbar.insertButton(insertIndex, contactButton);
			toolbar.insert(insertIndex + 1, new Ext.Toolbar.Spacer({ width: spacerWidth }));
		}
		
		// return the toolbar
		return toolbar;
	}
	
	/*
	 * panel is the panel itself that can be added to the table
	 */
	return new Ext.Panel({
		id: record.fileid + '-result-row',
		cls: 'result-container',
		html: '<div class="result-heading">' + record.title + '</div><div class="result-abstract">' + record.abstract + '</div>',
		bbar: buildToolbar(record),
		record: record,
		feature: new OpenLayers.Feature.Vector(record.bbox.toGeometry(), record)
	});
}