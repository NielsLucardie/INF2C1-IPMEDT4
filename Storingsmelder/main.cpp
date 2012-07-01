/**
 * Geschreven door G.N.T. Lucardie.
 *
 * Deze klassen is de main (eerste aanroep) van de applicatie,
 * deze klasse bevat een aantal standaard functies die onaangepast zijn.
 *
 * Naast deze functies zijn er ook een aantal functies aangepast om samen te werken
 * met de frontend van de applicatie. Deze functionaliteiten zijn aangepast om samen
 * te werken met de "wormhole" van Mosync. Hiermee worden de meldingen aangeroepen.
 *
 * Hierwordt ook afgehandeld dat het scherm aanblijft omdat Sleep mode nog niet beschikbaar is
 * in mosync.
 *
 * Ook wordt hier de aanroep van de index gedaan.
 */

#include <Wormhole/WebAppMoblet.h>
#include <Wormhole/MessageProtocol.h>
#include <Wormhole/MessageStream.h>
#include <Wormhole/Libs/JSONMessage.h>
#include <Wormhole/Libs/PhoneGap/PhoneGapMessageHandler.h>
#include <Wormhole/Libs/JSNativeUI/NativeUIMessageHandler.h>
#include <Wormhole/Libs/JSNativeUI/ResourceMessageHandler.h>
#include "MAHeaders.h"
#include <mastring.h>
#include "ma.h"
#include "mactype.h"
#include <MAUtil/DataHandler.h>

using namespace MAUtil;
using namespace NativeUI;
using namespace Wormhole;

MAHandle myStore;

class MyMoblet : public WebAppMoblet, public TimerListener
{
public:
	MyMoblet() :
		mPhoneGapMessageHandler(getWebView()),
		mNativeUIMessageHandler(getWebView()),
		mResourceMessageHandler(getWebView())
	{
		extractFileSystem();

		enableWebViewMessages();

		getWebView()->setVisible(true);

		addTimer(this, 3000, 1);
		showPage("http://niels.lucardie.nl/RSSTEST/");
		int resofLock = maWakeLock(MA_WAKE_LOCK_ON);

		MAExtent scrSize = maGetScrSize();
		int width = EXTENT_X(scrSize);
		int height = EXTENT_Y(scrSize);
		char buf[512];
		sprintf(
				buf,
				"{mosyncScreenWidth=%d; mosyncScreenHeight = %d;}",
				width,
				height);
		callJS(buf);

		mPhoneGapMessageHandler.setBeepSound(BEEP_WAV);

		mPhoneGapMessageHandler.initializePhoneGap();
	}

	/**
	* Geschreven door G.N.T. Lucardie.
	*
	* Index aanroepen.
	*/
	void runTimerEvent() {
		showPage("index.html");
	}

	virtual ~MyMoblet()
	{

	}


	void keyPressEvent(int keyCode, int nativeCode)
	{
		mPhoneGapMessageHandler.processKeyEvent(keyCode, nativeCode);
	}

	/**
	* Geschreven door G.N.T. Lucardie.
	*
	* Het afvangen van meldingen via de wormhole uit de frontend. Hiermee worden
	* De meldingen aangeroepen.
	*/
	void handleWebViewMessage(WebView* webView, MAHandle data)
	{
		MessageProtocol protocol(data);
		if (protocol.isMessageStreamJSON())
		{
			handleMessageStreamJSON(webView, data);
		}
		else if (protocol.isMessageStream())
		{
			MessageStream stream(webView, data);

			const char* p;

			while (p = stream.getNext())
			{
				if (0 == strcmp(p, "Favouritepos"))
				{
					maMessageBox("Favorieten", "De storing is toegevoegd aan de favorieten lijst!");
				}

				if (0 == strcmp(p, "Favouriteneg"))
				{
					maMessageBox("Favorieten", "De storing bestaat al in de favorieten lijst!");
				}

				if (0 == strcmp(p, "Favouritenegrem"))
				{
					maMessageBox("Favorieten", "De storing bestaat niet in de favorieten lijst!");
				}

				if (0 == strcmp(p, "Favouriteposrem"))
				{
					maMessageBox("Favorieten", "De storing is verwijderd uit de favorieten lijst!");
				}

				if (0 == strcmp(p, "FavouriteSolved"))
				{
					maSoundPlay(BEEP_WAV, 0, maGetDataSize(BEEP_WAV));
					maMessageBox("Opgelost", "Er is een storing opgelost! Deze wordt automatisch verwijderd uit de lijst en uit de favorieten!");
				}
			}
		}
		else
		{
			lprintfln("@@@ MOSYNC: Undefined message protocol");
		}
	}

	/**
	* Geschreven door G.N.T. Lucardie.
	*
	* Niet gebruikt.
	*/
	void handleMessageStreamJSON(WebView* webView, MAHandle data)
	{
		JSONMessage message(webView, data);

		while (message.next())
		{
			if (message.is("PhoneGap"))
			{
				mPhoneGapMessageHandler.handlePhoneGapMessage(message);
			}
			else if (message.is("Custom"))
			{
				String command = message.getParam("command");
				if (command == "vibrate")
				{
					int duration = message.getParamInt("duration");
					maVibrate(duration);
				}
			}
		}
	}

	/**
	* Geschreven door G.N.T. Lucardie.
	*
	* Niet gebruikt.
	*/
	void handleMessageStream(WebView* webView, MAHandle data)
	{
		MessageStream stream(webView, data);

		const char* p;


		while (p = stream.getNext())
		{
			if (0 == strcmp(p, "NativeUI"))
			{
				mNativeUIMessageHandler.handleMessage(stream);
			}
			else if (0 == strcmp(p, "Resource"))
			{
				mResourceMessageHandler.handleMessage(stream);
			}
			else if (0 == strcmp(p, "close"))
			{
				close();
			}
			else if (0 == strcmp(p, "Custom"))
			{
				const char* command = stream.getNext();
				if (NULL != command && (0 == strcmp(command, "beep")))
				{
					maSoundPlay(BEEP_WAV, 0, maGetDataSize(BEEP_WAV));
				}
			}
		}
	}

	/**
	* Geschreven door G.N.T. Lucardie.
	*
	* Niet gebruikt (voor debuggen).
	*/
	void printMessage(MAHandle dataHandle)
	{
		int dataSize = maGetDataSize(dataHandle);

		char* stringData = (char*) malloc(dataSize + 1);

		maReadData(dataHandle, stringData, 0, dataSize);

		stringData[dataSize] = 0;

		maWriteLog("@@@ MOSYNC Message:", 19);
		maWriteLog(stringData, dataSize);

		free(stringData);
	}

private:
	/**
	 * Handler for PhoneGap messages.
	 */
	PhoneGapMessageHandler mPhoneGapMessageHandler;

	/**
	 * Handler for NativeUI messages
	 */
	NativeUIMessageHandler mNativeUIMessageHandler;

	/**
	 * Handler for resource messages used for NativeUI
	 */
	ResourceMessageHandler mResourceMessageHandler;
};

/**
 * Main function that is called when the program starts.
 * Here an instance of the MyMoblet class is created and
 * the program enters the main event loop.
 */
extern "C" int MAMain()
{
	Moblet::run(new MyMoblet());
	return 0;
}
