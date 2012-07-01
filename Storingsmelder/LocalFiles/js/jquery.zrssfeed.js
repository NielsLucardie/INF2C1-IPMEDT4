/**
* Geschreven door G.N.T. Lucardie.
* 
* De klasse gaat uit van de backend RSS feed zoals aangeboden op:
* 
* http://niels.lucardie.nl/RSSTEST/results.rss
* 
* Deze hele klasse is van de volgende bron overgenomen (open source, no limitations):
* 
* http://www.zazar.net/developers/jquery/zrssfeed/
* 
* Deze klasse is bijna volledig aangepast om het gewenste resultaat te geven.
* Ophalen van de feed en in html vorm terug geven aan javascript/html. Deze
* gegevens worden in de juiste Div geplaatst. Deze klasse is dus niet simpelweg
* gebruikt en direct ingezet. Er is veel werk verricht om de klasse aan te passen
* De werkelijke klasse is bijna volledig aangepast.
* 
* De gebruikte klasse is afkomstig van de bovenstaande website en mag gebruikt en 
* aangepast worden zonder nodige licenties.
* 
*/



/**
* Geschreven door G.N.T. Lucardie.
* 
* Nodige variabelen, oa. om op te slaan en een aantal constanten om te bepalen om welke provider het gaat.
*/
var theProvider;
var typeFilter;
var favArray;
var idXS4ALL = 1;
var idNS = 2;
var idOVERIG = 8;
var StoringArray = new Array();

/**
* Geschreven door G.N.T. Lucardie.
* 
* Deze functie controleert of er favorieten zijn en geeft deze terug aan de frontend. 
* De functie wordt gebruikt om te kijken of een favoriet gebruikt moet worden om een alarm aan te roepen.
*/
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
* Geschreven door G.N.T. Lucardie.
* 
* Deze functie is de meest gebruikte functie binnen de applicatie. De functie haalt RSS feed op en doet dit op 
* basis van een aantal gegeven variabelen zoals; provider, type. Aan deze functie wordt een html div mee gegeven
* deze div wordt gevuld met gegeven (in opmaak) op basis van de gegeven variabelen. Deze functie maakt als het ware
* de hele applicatie aangezien het de RSS ophaalt uit de backend en en luistert naar de frontend. Binnen de functie
* is er van commentaar voorzien waar nodig.
*/
(function($){

	$.fn.rssfeed = function(favoArr, type, provider, url, options, fn) {	

		theProvider = provider;
		typeFilter = type;
		favArray = favoArr;

		/**
		* Geschreven door G.N.T. Lucardie.
		* 
		* Hier stellen we default waarden in voor de functie. Deze mogen voor deze APP niet aangepast worden, 
		* dit heeft namelijk invloed op de output van de functie en dus de RSS feed.
		*/
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

		return this.each(function(i, e) {

			var $e = $(e);
			var s = '';

			if (options.ssl) s = 's';

			if (!$e.hasClass('rssFeed')) $e.addClass('rssFeed');

			if(url == null) return false;

			/**
			* Geschreven door G.N.T. Lucardie.
			* 
			* Hier wordt het adres van de Google API Feed samengesteld.
			*/
			var api = "http"+ s +"://ajax.googleapis.com/ajax/services/feed/load?v=1.0&callback=?&q=" + encodeURIComponent(url);
			if (options.limit != null) api += "&num=" + options.limit;
			if (options.key != null) api += "&key=" + options.key;
			api += "&output=json_xml"

				$.getJSON(api, function(data){

					if (data.responseStatus == 200) {

						_process(e, data.responseData, options);

						/**
						* Geschreven door G.N.T. Lucardie.
						* 
						* Wij gebruiken geen callback functie.
						*/
						if ($.isFunction(fn)) fn.call(this,$e);

					} else {
						
						/**
						* Geschreven door G.N.T. Lucardie.
						* 
						* Error div, als het goed is wordt deze nooit aangeroepen.
						*/
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

	/**
	* Geschreven door G.N.T. Lucardie.
	* 
	* Het opbouwen van de opgehaalde feed (resultaten) in HTML opbouw.
	*/
	var _process = function(e, data, options) {

		var feeds = data.feed;
		if (!feeds) {
			return false;
		}
		var html = '';	
		var row = 'odd';

		if (options.media) {
			var xml = getXMLDocument(data.xmlString);
			var xmlEntries = xml.getElementsByTagName('item');
		}

		if (options.header)
			html +=	'<div class="rssHeader">' +
			'<a href="'+feeds.link+'" title="'+ feeds.description +'">'+ feeds.title +'</a>' +
			'</div>';

		html += '<div class="rssBody">';

		/**
		 * Geschreven door G.N.T. Lucardie.
		 * 
		 * Hier wordt de feed verwerkt naar html op basis van provider. 
		 * Dus als het type 'provider' wordt meegegeven als variabelen dan komen we in deze code.
		 * 
		 * Deze code doet het volgende:
		 * 
		 * Zet de storing op basis van een filter (provider en provider ID) in een html opbouw 
		 * van deze storingen. Deze storingen bevatten dus al de opbouw die en de links die nodig zijn 
		 * in de frontend. In een later stadium is het nodig om deze in een CSS stylesheet te zetten zodat
		 * er met verschillende thema's gewerkt kan worden, dat is nu niet nodig.
		 * 
		 * De titel van de feed bestaat uit een lange string met gegevens die te onderscheiden zijn met [haakjes].
		 * Deze string wordt uit elkaar gehaald zodat het duidelijk is om wat voor storing het gaat. Op basis van 
		 * deze gegevens kan de storing gefilterd worden en kunnen indien nodig de gegevens hiervan (zoals naam)
		 * gebruikt worden.
		 **/
		if(typeFilter == 'provider'){

			StoringArray = new Array();
			
			for (var i=0; i<feeds.entries.length; i++) {

				var entry = feeds.entries[i];
				var pubDate;

				if (entry.publishedDate) {
					var entryDate = new Date(entry.publishedDate);
					var pubDate = entryDate.toLocaleDateString() + ' ' + entryDate.toLocaleTimeString();
				}
		
				var destructionString = entry.title;

				var clientId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
				destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

				if(clientId == theProvider){

					html += '<div style="background-color:#99CCFF; border-radius: 15px; padding:5px; font-size:9px; margin-bottom:5px;">';

					var pubId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
					destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

					StoringArray[i] = pubId;

					html += '<input type="image" src="images/star.png" name="image" value=' + pubId + ' style="margin-right:5px; float:right; width:25px; height:25px;" onclick="goFavourite(' + pubId + ')">';
					html += '<br>';

					var solved = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
					destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);
					if(solved == 'false'){
						html += '<p style="color:#FF0000;">Niet Opgelost.</p>';
					}else{
						html += '<p style="color:#008000;">Opgelost</p>';
					}

					html += '<p>' + destructionString +'</p>'
					if (options.date && pubDate) html += '<p>'+ pubDate +'</p>'
					if (options.content) {

						if (options.snippet && entry.contentSnippet != '') {
							var content = entry.contentSnippet;
						} else {
							var content = entry.content;
						}

						html += '<p>'+ content +'</p>'
					}	

					html += '<p><a href="'+ entry.link +'" title="View this feed at '+ feeds.title +'">'+ 'Ga naar de website.' +'</a></p>';

					html += '</div>';
				}
			}
		}

		/**
		 * Geschreven door G.N.T. Lucardie.
		 * 
		 * Hier wordt de feed verwerkt naar html op basis van datum. 
		 * Dus als het type 'date' wordt meegegeven als variabelen dan komen we in deze code.
		 * 
		 * Deze code doet het volgende:
		 * 
		 * Zet de storing op basis van geen filter (alle meldingen op chronologische volgorde)
		 * in een html opbouw. Deze storingen bevatten dus al de opbouw die en de links die nodig zijn 
		 * in de frontend. In een later stadium is het nodig om deze in een CSS stylesheet te zetten zodat
		 * er met verschillende thema's gewerkt kan worden, dat is nu niet nodig.
		 * 
		 * De titel van de feed bestaat uit een lange string met gegevens die te onderscheiden zijn met [haakjes].
		 * Deze string wordt uit elkaar gehaald zodat het duidelijk is om wat voor storing het gaat. Op basis van 
		 * deze gegevens kan de storing gefilterd worden en kunnen indien nodig de gegevens hiervan (zoals naam)
		 * gebruikt worden.
		 **/
		if(typeFilter == 'date'){

			var DateSelection = new Array();

			StoringArray = new Array();

			for (var i=0; i<feeds.entries.length; i++) {
				var post = new Array();

				var entry = feeds.entries[i];

				var entryDate = new Date(entry.publishedDate);

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
				valueA = a[1];
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

				for (var i=0; i<feeds.entries.length; i++) {

					var entry = feeds.entries[i];
					var pubDate;

					if (entry.publishedDate) {
						var entryDate = new Date(entry.publishedDate);
						var pubDate = entryDate.toLocaleDateString() + ' ' + entryDate.toLocaleTimeString();
					}
	
					var destructionString = entry.title;

					var clientId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
					destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

					var pubId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
					destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

					StoringArray[i] = pubId;

					if(tempPub == pubId){

						if(true){ 

							html += '<div style="background-color:#99CCFF; border-radius: 15px; padding:5px; font-size:9px; margin-bottom:5px;">';

							html += '<input type="image" src="images/star.png" name="image" value=' + pubId + ' style="margin-right:5px; float:right; width:25px; height:25px;" onclick="goFavourite(' + pubId + ')">';
							html += '<br>';

							if(clientId == idXS4ALL){
								html += '<p>XS4ALL</p>';
							}else if(clientId == idNS){
								html += '<p>Nederlandse Spoorwegen</p>';
							}else if(clientId == idOVERIG){
								html += '<p>Overige Storingen</p>';
							}

							var solved = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
							destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);
							if(solved == 'false'){
								html += '<p style="color:#FF0000;">Niet Opgelost.</p>';
							}else{
								html += '<p style="color:#008000;">Opgelost</p>';
							}
			
							html += '<p>' + destructionString +'</p>';
							if (options.date && pubDate) html += '<p>'+ pubDate +'</p>';
							if (options.content) {

								if (options.snippet && entry.contentSnippet != '') {
									var content = entry.contentSnippet;
								} else {
									var content = entry.content;
								}

								html += '<p>'+ content +'</p>';
							}	

							html += '<p><a href="'+ entry.link +'" title="View this feed at '+ feeds.title +'">'+ 'Ga naar de website.' +'</a></p>';

							html += '</div>';
						}
					}
				}
			}
		}

		/**
		 * Geschreven door G.N.T. Lucardie.
		 * 
		 * Hier wordt de feed verwerkt naar html op basis van een favoriet. 
		 * Dus als het type 'favo' wordt meegegeven als variabelen dan komen we in deze code.
		 * 
		 * Deze code doet het volgende:
		 * 
		 * Zet de storing op basis van een filter (favorieten uit de local storage van de telefoon) 
		 * in een html opbouw van deze storingen. Deze storingen bevatten dus al de opbouw die en de 
		 * links die nodig zijn in de frontend. In een later stadium is het nodig om deze in een CSS 
		 * stylesheet te zetten zodat er met verschillende thema's gewerkt kan worden, dat is nu niet nodig.
		 * 
		 * De titel van de feed bestaat uit een lange string met gegevens die te onderscheiden zijn met [haakjes].
		 * Deze string wordt uit elkaar gehaald zodat het duidelijk is om wat voor storing het gaat. Op basis van 
		 * deze gegevens kan de storing gefilterd worden en kunnen indien nodig de gegevens hiervan (zoals naam)
		 * gebruikt worden.
		 **/
		if(typeFilter == 'favourite'){

			StoringArray = new Array()

			for (var i=0; i<feeds.entries.length; i++) {

				var entry = feeds.entries[i];
				var pubDate;

				if (entry.publishedDate) {
					var entryDate = new Date(entry.publishedDate);
					var pubDate = entryDate.toLocaleDateString() + ' ' + entryDate.toLocaleTimeString();
				}
		
				var destructionString = entry.title;

				var clientId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
				destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

				var pubId = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
				destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);

				StoringArray[i] = pubId;

				for(var j=0; j<favArray.length; j++) {
					if(favArray[j] == pubId){

						if(true){ 

							html += '<div style="background-color:#99CCFF; border-radius: 15px; padding:5px; font-size:9px; margin-bottom:5px;">';

							html += '<input type="image" src="images/cross.png" name="image" value=' + pubId + ' style="margin-right:5px; float:right; width:25px; height:25px;" onclick="noFavourite(' + pubId + '); goFAVOURITES();">';
							html += '<br>';

							if(clientId == idXS4ALL){
								html += '<p>XS4ALL</p>';
							}else if(clientId == idNS){
								html += '<p>Nederlandse Spoorwegen</p>';
							}else if(clientId == idOVERIG){
								html += '<p>Overige Storingen</p>';
							}

							var solved = destructionString.substring(destructionString.indexOf("[") +1, destructionString.indexOf("]"));
							destructionString = destructionString.substring(destructionString.indexOf("]") + 1, destructionString.length);
							if(solved == 'false'){
								html += '<p style="color:#FF0000;">Niet Opgelost.</p>';
							}else{
								html += '<p style="color:#008000;">Opgelost</p>';
							}
			
							html += '<p>' + destructionString +'</p>';
							if (options.date && pubDate) html += '<p>'+ pubDate +'</p>';
							if (options.content) {

								if (options.snippet && entry.contentSnippet != '') {
									var content = entry.contentSnippet;
								} else {
									var content = entry.content;
								}

								html += '<p>'+ content +'</p>';
							}	

							html += '<p><a href="'+ entry.link +'" title="View this feed at '+ feeds.title +'">'+ 'Ga naar de website.' +'</a></p>';

							html += '</div>';
						}
					}
				}
			}
		}

		
		/**
		 * Geschreven door G.N.T. Lucardie.
		 * 
		 * Na het opbowen van de nodige html is geven we deze terug aan de frontend zodat deze geplaatst kan 
		 * worden in de juiste html Div.
		 **/
		html += '</div>';
		$(e).html(html);
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


