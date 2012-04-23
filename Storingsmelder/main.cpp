/**
 * @file main.cpp
 *
 * This template application shows how to extend the functionality
 * in HTML5/JS with custom code written in C++. See code below
 * for custom code added in methods handleMessageStreamJSON()
 * and handleMessageStream().
 *
 * When reading the code below, it is good to know that there are
 * two message formats: JSON and string streams. String streams are
 * generally faster. See comments in the code below for further details.
 * PhoneGap uses JSON messages, NativeUI uses string streams.
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

// Namespaces we want to access.
using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.
using namespace Wormhole; // Wormhole library.

MAHandle myStore;

/**
 * The application class.
 * Het volgende wordt hier in de C++ code afgehandeld:
 * Meldingen, alle meldingen via de bridge/wormhole.
 * Scherm aan houden voor testen (geen sleep mode).
 * Aanroep index.html en rss feed (eerste aanroep).
 */
class MyMoblet : public WebAppMoblet, public TimerListener
{
public:
	MyMoblet() :
		mPhoneGapMessageHandler(getWebView()),
		mNativeUIMessageHandler(getWebView()),
		mResourceMessageHandler(getWebView())
	{
		// Extract files in LocalFiles folder to the device.
		extractFileSystem();

		// Enable message sending from JavaScript to C++.
		enableWebViewMessages();

		// Show the WebView that contains the HTML/CSS UI
		// and the JavaScript code.
		getWebView()->setVisible(true);

		/**
		 * De timer roept de index.html aan,
		 * dit geeft de online pagina met de rss feed de tijd om te verversen.
		 * maWakeLock zorgt ervoor dat het scherm aan blijft
		 * */
		addTimer(this, 3000, 1);
		showPage("http://niels.lucardie.nl/RSSTEST/");
		int resofLock = maWakeLock(MA_WAKE_LOCK_ON);

		// Send the Device Screen size to JavaScript.
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

		// Set the beep sound. This is defined in the
		// Resources/Resources.lst file. You can change
		// this by changing the sound file in that folder.
		mPhoneGapMessageHandler.setBeepSound(BEEP_WAV);

		// Initialize PhoneGap.
		mPhoneGapMessageHandler.initializePhoneGap();
	}

	void runTimerEvent() {
		showPage("index.html");
	}

	virtual ~MyMoblet()
	{
		// Add cleanup code as needed.
	}

	/**
	 * This method is called when a key is pressed.
	 * Forwards the event to PhoneGapMessageHandler.
	 */
	void keyPressEvent(int keyCode, int nativeCode)
	{
		// Forward to PhoneGap MessageHandler.
		mPhoneGapMessageHandler.processKeyEvent(keyCode, nativeCode);
	}

	/**
	 * This method handles messages sent from the WebView.
	 *
	 * Note that the data object will be valid only during
	 * the life-time of the call of this method, then it
	 * will be deallocated.
	 *
	 * @param webView The WebView that sent the message.
	 * @param urlData Data object that holds message content.
	 */
	void handleWebViewMessage(WebView* webView, MAHandle data)
	{
		// Uncomment to print message data for debugging.
		// You need to build the project in debug mode for
		// the log output to be displayed.
		//printMessage(data);

		// Check the message protocol.
		MessageProtocol protocol(data);
		if (protocol.isMessageStreamJSON())
		{
			handleMessageStreamJSON(webView, data);
		}
		else if (protocol.isMessageStream())
		{
			MessageStream stream(webView, data);

			// Pointer to a string in the message stream.
			const char* p;

			/**
			 * Alle meldingen worden heir afgevangen! (via de bridge)
			 * */
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
	 * Handles JSON messages. This is used by PhoneGap.
	 *
	 * You can send your own messages from JavaScript and handle them here.
	 *
	 * @param webView A pointer to the web view posting this message.
	 * @param data The raw encoded JSON message array.
	 */
	void handleMessageStreamJSON(WebView* webView, MAHandle data)
	{
		// Create the message object. This parses the message data.
		// The message object contains one or more messages.
		JSONMessage message(webView, data);

		// Loop through messages.
		while (message.next())
		{
			// This detects the PhoneGap protocol.
			if (message.is("PhoneGap"))
			{
				mPhoneGapMessageHandler.handlePhoneGapMessage(message);
			}
			// Here we add our own messages. See index.html for
			// the JavaScript code used to send the message.
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
	 * Handles string stream messages (generally faster than JSON messages).
	 * This is used by the JavaScript NativeUI system.
	 *
	 * You can send your own messages from JavaScript and handle them here.
	 *
	 * @param webView A pointer to the web view posting this message.
	 * @param data The raw encoded stream of string messages.
	 */
	void handleMessageStream(WebView* webView, MAHandle data)
	{
		// Create a message stream object. This parses the message data.
		// The message object contains one or more strings.
		MessageStream stream(webView, data);

		// Pointer to a string in the message stream.
		const char* p;

		// Process messages while there are strings left in the stream.
		while (p = stream.getNext())
		{
			if (0 == strcmp(p, "NativeUI"))
			{
				//Forward NativeUI messages to the respective message handler
				mNativeUIMessageHandler.handleMessage(stream);
			}
			else if (0 == strcmp(p, "Resource"))
			{
				//Forward Resource messages to the respective message handler
				mResourceMessageHandler.handleMessage(stream);
			}
			else if (0 == strcmp(p, "close"))
			{
				// Close the application (calls method in class Moblet).
				close();
			}
			// Here we add your own messages. See index.html for
			// the JavaScript code used to send the message.
			else if (0 == strcmp(p, "Custom"))
			{
				const char* command = stream.getNext();
				if (NULL != command && (0 == strcmp(command, "beep")))
				{
					// This is how to play the sound in the resource BEEP_WAV.
					maSoundPlay(BEEP_WAV, 0, maGetDataSize(BEEP_WAV));
				}
			}
		}
	}

	/**
	 * For debugging.
	 */
	void printMessage(MAHandle dataHandle)
	{
		// Get length of the data, it is not zero terminated.
		int dataSize = maGetDataSize(dataHandle);

		// Allocate buffer for string data.
		char* stringData = (char*) malloc(dataSize + 1);

		// Get the data.
		maReadData(dataHandle, stringData, 0, dataSize);

		// Zero terminate.
		stringData[dataSize] = 0;

		// Print unparsed message data.
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
