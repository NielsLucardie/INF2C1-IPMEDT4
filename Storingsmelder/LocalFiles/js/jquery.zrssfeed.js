/**
 * Deze hele klasse is van de volgende bron overgenomen:
 * 
 * http://www.zazar.net/developers/jquery/zrssfeed/
 * 
 * Deze klasse is bijna volledig aangepast om het gewenste resultaat te geven.
 * Ophalen van de feed en in html vorm terug geven aan javascript/html. Deze
 * gegevens worden in de juiste Div geplaatst.
 **/
var theProvider;
var typeFilter;
var favArray;
var idXS4ALL = 1;
var idNS = 2;
var idOVERIG = 8;
var StoringArray = new Array();

/**
 * Controleren van favorieten tegenover de feeds (opgebouwde array).
 **/
function checkFavo(favoArr){
	for (var j=0; j<favoArr.length; j++) {
		var retFav = favoArr[j];
		for (var i=0; i<StoringArray.length; i++) {
			if(favoArr[j] == StoringArray[i]){
				
				retFav = 0;
				
			}
		}
		if(retFav != 0){
			return retFav;
		}
	}
	return retFav;
}

/**
 * Feed verwerken
 **/
(function($){

	$.fn.rssfeed = function(favoArr, type, provider, url, options, fn) {	

		theProvider = provider;
		typeFilter = type;
		favArray = favoArr;

		// Set pluign defaults
		var defaults = {
				limit: 100,
				header: false,
				titletag: 'h4',
				date: true,
				content: true,
				snippet: false,
				media: true,
				showerror: true,
				errormsg: '',
				key: null,
				ssl: false,
				linktarget: '_self'
		};  
		var options = $.extend(defaults, options); 

		// Functions
		return this.each(function(i, e) {

			var $e = $(e);
			var s = '';

			// Check for SSL protocol
			if (options.ssl) s = 's';

			// Add feed class to user div
			if (!$e.hasClass('rssFeed')) $e.addClass('rssFeed');

			// Check for valid url
			if(url == null) return false;

			// Create Google Feed API address
			var api = "http"+ s +"://ajax.googleapis.com/ajax/services/feed/load?v=1.0&callback=?&q=" + encodeURIComponent(url);
			if (options.limit != null) api += "&num=" + options.limit;
			if (options.key != null) api += "&key=" + options.key;
			api += "&output=json_xml"

				// Send request
				$.getJSON(api, function(data){

					// Check for error
					if (data.responseStatus == 200) {

						// Process the feeds
						_process(e, data.responseData, options);

						// Optional user callback function
						if ($.isFunction(fn)) fn.call(this,$e);

					} else {

						// Handle error if required
						if (options.showerror)
							if (options.errormsg != '') {
								var msg = options.errormsg;
							} else {
								var msg = data.responseDetails;
							};
							$(e).html('<div class="rssError"><p>'+ msg +'</p></div>');
					};
				});				
		});
	};

	// Function to create HTML result
	var _process = function(e, data, options) {

		// Get JSON feed data
		var feeds = data.feed;
		if (!feeds) {
			return false;
		}
		var html = '';	
		var row = 'odd';

		// Get XML data for media (parseXML not used as requires 1.5+)
		if (options.media) {
			var xml = getXMLDocument(data.xmlString);
			var xmlEntries = xml.getElementsByTagName('item');
		}

		// Add header if required
		if (options.header)
			html +=	'<div class="rssHeader">' +
			'<a href="'+feeds.link+'" title="'+ feeds.description +'">'+ feeds.title +'</a>' +
			'</div>';

		//Add body
		html += '<div class="rssBody">';
		//'<ul>';

		/**
		 * Feed verwerken naar html op basis van provider (scherm)
		 **/
		if(typeFilter == 'provider'){

			StoringArray = new Array();
			// Add feeds
			for (var i=0; i<feeds.entries.length; i++) {

				// Get individual feed
				var entry = feeds.entries[i];
				var pubDate;

				// Format published date
				if (entry.publishedDate) {
					var entryDate = new Date(entry.publishedDate);
					var pubDate = entryDate.toLocaleDateString() + ' ' + entryDate.toLocaleTimeString();
				}

				// Add feed row
				//html += '<li class="rssRow '+row+'">'; 

				//Hier even de titel uit elkaar halen (client, publicatie, solved, naam)		
				var destructionString = entry.title;

				//min clientID
				var clientId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
				destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

				//Filter Storingen
				if(clientId == theProvider){ //All = (true) Filter = (clientId == ?)

					html += '<div style="background-color:#99CCFF; border-radius: 15px; padding:5px; font-size:9px; margin-bottom:5px;">';

					//html += '<p>Client ID: ' + clientId + '</p>';

					//min pubID
					var pubId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
					destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);
					//html += '<p>Publicatie ID: ' + pubId + '</p>';

					//Array vullen voor de favo check
					StoringArray[i] = pubId;

					html += '<input type="image" src="images/star.png" name="image" value=' + pubId + ' style="margin-right:5px; float:right; width:25px; height:25px;" onclick="goFavourite(' + pubId + ')">';
					html += '<br>';

					//min Solved
					var solved = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
					destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);
					if(solved == 'false'){
						html += '<p style="color:#FF0000;">Niet Opgelost.</p>';
					}else{
						html += '<p style="color:#008000;">Opgelost</p>';
					}

					//Add Titel
					html += '<p>' + destructionString +'</p>'
					if (options.date && pubDate) html += '<p>'+ pubDate +'</p>'
					if (options.content) {

						// Use feed snippet if available and optioned
						if (options.snippet && entry.contentSnippet != '') {
							var content = entry.contentSnippet;
						} else {
							var content = entry.content;
						}

						html += '<p>'+ content +'</p>'
					}	

					//hyperlink
					html += '<p><a href="'+ entry.link +'" title="View this feed at '+ feeds.title +'">'+ 'Ga naar de website.' +'</a></p>';

					html += '</div>';
				}
			}
		}

		/**
		 * Feed verwerken naar html op basis van datum (scherm/chronologisch)
		 **/
		if(typeFilter == 'date'){

			//Variabelen
			var DateSelection = new Array();

			StoringArray = new Array();

			//Array opbouwen voor datum selectie
			for (var i=0; i<feeds.entries.length; i++) {
				var post = new Array();

				var entry = feeds.entries[i];

				// Format published date
				var entryDate = new Date(entry.publishedDate);

				//min clientID
				var destructionString = entry.title;
				var clientId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
				destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);
				var pubId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));

				post[0] = pubId;
				post[1] = entryDate;

				DateSelection[i] = post;	
			}

			DateSelection.sort(function(a, b) {
				var valueA, valueB;
				valueA = a[1]; // Where 1 is your index, from your example
				valueB = b[1];
				if (valueA < valueB) {
					return -1;
				}
				else if (valueA > valueB) {
					return 1;
				}
				return 0;
			});

			for (var j=0; j<DateSelection.length; j++) {
				var tempArray = DateSelection[j];
				var tempPub = tempArray[0];

				// Add feeds
				for (var i=0; i<feeds.entries.length; i++) {

					// Get individual feed
					var entry = feeds.entries[i];
					var pubDate;

					// Format published date
					if (entry.publishedDate) {
						var entryDate = new Date(entry.publishedDate);
						var pubDate = entryDate.toLocaleDateString() + ' ' + entryDate.toLocaleTimeString();
					}

					// Add feed row
					//html += '<li class="rssRow '+row+'">'; 

					//Hier even de titel uit elkaar halen (client, publicatie, solved, naam)		
					var destructionString = entry.title;

					//min clientID
					var clientId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
					destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

					//min pubID
					var pubId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
					destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

					//Array vullen voor de favo check
					StoringArray[i] = pubId;

					//alert(tempArray[1] + ' en ' + pubId);

					if(tempPub == pubId){

						//Filter Storingen
						if(true){ //All = (true) Filter = (clientId == ?)

							html += '<div style="background-color:#99CCFF; border-radius: 15px; padding:5px; font-size:9px; margin-bottom:5px;">';

							//html += '<p>Client ID: ' + clientId + '</p>';

							//html += '<p>Publicatie ID: ' + pubId + '</p>';

							html += '<input type="image" src="images/star.png" name="image" value=' + pubId + ' style="margin-right:5px; float:right; width:25px; height:25px;" onclick="goFavourite(' + pubId + ')">';
							html += '<br>';

							//Provider naam kiezen
							if(clientId == idXS4ALL){
								html += '<p>XS4ALL</p>';
							}else if(clientId == idNS){
								html += '<p>Nederlandse Spoorwegen</p>';
							}else if(clientId == idOVERIG){
								html += '<p>Overige Storingen</p>';
							}

							//min Solved
							var solved = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
							destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);
							if(solved == 'false'){
								html += '<p style="color:#FF0000;">Niet Opgelost.</p>';
							}else{
								html += '<p style="color:#008000;">Opgelost</p>';
							}

							//Add Titel				
							html += '<p>' + destructionString +'</p>';
							if (options.date && pubDate) html += '<p>'+ pubDate +'</p>';
							if (options.content) {

								// Use feed snippet if available and optioned
								if (options.snippet && entry.contentSnippet != '') {
									var content = entry.contentSnippet;
								} else {
									var content = entry.content;
								}

								html += '<p>'+ content +'</p>';
							}	

							//hyperlink
							html += '<p><a href="'+ entry.link +'" title="View this feed at '+ feeds.title +'">'+ 'Ga naar de website.' +'</a></p>';

							html += '</div>';
						}
					}
				}
			}
		}

		/**
		 * Feed verwerken naar html op basis van favorieten (scherm)
		 **/
		if(typeFilter == 'favourite'){

			StoringArray = new Array()

			// Add feeds
			for (var i=0; i<feeds.entries.length; i++) {

				// Get individual feed
				var entry = feeds.entries[i];
				var pubDate;

				// Format published date
				if (entry.publishedDate) {
					var entryDate = new Date(entry.publishedDate);
					var pubDate = entryDate.toLocaleDateString() + ' ' + entryDate.toLocaleTimeString();
				}

				// Add feed row
				//html += '<li class="rssRow '+row+'">'; 

				//Hier even de titel uit elkaar halen (client, publicatie, solved, naam)		
				var destructionString = entry.title;

				//min clientID
				var clientId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
				destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

				//min pubID
				var pubId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
				destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

				//Array vullen voor de favo check
				StoringArray[i] = pubId;

				//alert(tempArray[1] + ' en ' + pubId);

				for(var j=0; j<favArray.length; j++) {
					if(favArray[j] == pubId){

						//Filter Storingen
						if(true){ //All = (true) Filter = (clientId == ?)

							html += '<div style="background-color:#99CCFF; border-radius: 15px; padding:5px; font-size:9px; margin-bottom:5px;">';

							//html += '<p>Client ID: ' + clientId + '</p>';

							//html += '<p>Publicatie ID: ' + pubId + '</p>';

							html += '<input type="image" src="images/cross.png" name="image" value=' + pubId + ' style="margin-right:5px; float:right; width:25px; height:25px;" onclick="noFavourite(' + pubId + '); goFAVOURITES();">';
							html += '<br>';

							//Provider naam kiezen
							if(clientId == idXS4ALL){
								html += '<p>XS4ALL</p>';
							}else if(clientId == idNS){
								html += '<p>Nederlandse Spoorwegen</p>';
							}else if(clientId == idOVERIG){
								html += '<p>Overige Storingen</p>';
							}

							//min Solved
							var solved = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
							destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);
							if(solved == 'false'){
								html += '<p style="color:#FF0000;">Niet Opgelost.</p>';
							}else{
								html += '<p style="color:#008000;">Opgelost</p>';
							}

							//Add Titel				
							html += '<p>' + destructionString +'</p>';
							if (options.date && pubDate) html += '<p>'+ pubDate +'</p>';
							if (options.content) {

								// Use feed snippet if available and optioned
								if (options.snippet && entry.contentSnippet != '') {
									var content = entry.contentSnippet;
								} else {
									var content = entry.content;
								}

								html += '<p>'+ content +'</p>';
							}	

							//hyperlink
							html += '<p><a href="'+ entry.link +'" title="View this feed at '+ feeds.title +'">'+ 'Ga naar de website.' +'</a></p>';

							html += '</div>';
						}
					}
				}
			}
		}

		//html += '</ul>' +
		html += '</div>';

		$(e).html(html);

		// Apply target to links
		$('a',e).attr('target',options.linktarget);
	};

	function formatFilesize(bytes) {
		var s = ['bytes', 'kb', 'MB', 'GB', 'TB', 'PB'];
		var e = Math.floor(Math.log(bytes)/Math.log(1024));
		return (bytes/Math.pow(1024, Math.floor(e))).toFixed(2)+" "+s[e];
	}

	function getXMLDocument(string) {
		var browser = navigator.appName;
		var xml;
		if (browser == 'Microsoft Internet Explorer') {
			xml = new ActiveXObject('Microsoft.XMLDOM');
			xml.async = 'false'
				xml.loadXML(string);
		} else {
			xml = (new DOMParser()).parseFromString(string, 'text/xml');
		}
		return xml;
	}

})(jQuery);


