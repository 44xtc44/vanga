.. role:: whiteText
.. role:: goldText 
.. role:: greenText

Help
========
This app is an *browser extension* app. That means that certain security
restrictions apply to it to keep you save.

audio element ::,Failed to open media
--------------------------------------
 | A typical candidate for a non-HTTPS (non-secure HTTP) connection established
 | by the browser's audio element. Some stations suffer from this behaviour.

 | This can be seen as a browser *over-secure* feature or as a bug.

 | Anyway. The only way to circumvent this feature-bug is to either
 | click the *copy URL* icon of the station and paste it in a new browser tab.
 | Or use the link provided in the log monitor. 

 | The log monitor link uses the first part of the station URL and *tries* 
 | to connect to the server, where the station is hosted by a station provider.

.. note::
   | Some provider host multiple streams of a station.
   | So it is worth to discover those streams to find a better bit rate or
   | another stream endpoint (URL) which you like more.
   | You can save those URLs in Vangas *Custom URL* or share your discovery
   | whith others by adding it to the public database https://radio-browser.info.
   | Update Vanga some minutes, or a day later to see the added station.

   | IceCast provider pages show mostly a *Mount Point /atlantisfm.aac* style layout.
   | The full mount point URL would be https://extra-radio.radionetz.de/atlantisfm.aac

Votes badge
------------
 | Vanga sends the clicked station ID and votes to the public database.
 | Other apps do the same. The result (trend) of clicks for a station 
 | is calculated by the public database. 
 
 | Vanga is requesting the updated datasets from the radio-browser.info API.
 
.. raw:: html

    <embed>
        <div>Badge colors:</div>
        <br>
        <div><span style=color:grey;font-weight:600> white </span> - no changes where applied to the stations dataset  </div>
        <div><span style=color:#f7b733;font-weight:600> gold </span>  - a vote or more added </div>
        <div><span style=color:#49bbaa;font-weight:600> green </span>  - a click or more added </div>
        <br><br>
    </embed>

Dump downloads
----------------
 | Downloaded stream cuts are stored by station name and converted  
 | to files.

 | Files are stored in the internal browser database and will be 
 | deleted from database if the download button was pressed. 

 | Files can be found in the default download folder of the browser.

Download data streams without title information
------------------------------------------------
 | Some stations don't send title informations at all, or send only
 | the station name. 

 | Vanga can not cut streams from those stations by default.
 | You can enable manual stream cut under 'Settings'.
 
.. note::
    | This will affect all downloads. 
    | Means if you switch off download/recording, Vanga will convert the
    | collected stream chunks to a file and download the file to your 
    | download folder. 

Filter buttons
---------------
 | A click on a filter button (continent, country, Favorite) 
 | collects the relevant station datasets from the database.

 | The top button bar is divided into continents. 
 | Continents accomodate country button bars.

 | Extra buttons for 'Favorites' and 'World'.
 | 'World' accomodates a continent button bar. 
 | Filter all stations belonging to a continent.
 
 | A click on a station named link creates a user interaction
 | bar from the station dataset.

Search bar
-----------
 | The search bar is useful to filter station names and 
 | genres (tags).
 
 | Search will start if the input has at least three characters, 
 | or language symbols.
 
 | The search scans all the filtered datasets for a match.
 | There is no inbuild translation, means if a tag or station 
 | name is written in chinese language you need at least three 
 | chinese symbols as input to start the search.
 
Blacklists
-----------
 | Download/recording cuts a part out of the station's datastream, 
 | as well as title information. 
 
 | Title names are stored in editable blacklists to prevent  
 | multiple downloads of an already known title.
 
Blacklist dump/restore
-----------------------
 | Vanga can read its backup, dump files in JSON file format.
 | 
 | Restore from dump file will restore all blacklists and user
 | settings.
 | Blacklists are always merged with existing ones, stored in the 
 | browser database. 
 
 | No titles will be deleted. This can be done
 | manually by using the blacklist button of the station.
 
 | You can edit a backup file and copy blacklisted titles into 
 | another station in the file.
 
Playlist support (server)
--------------------------
 | Currently three playlist types are beknownst to Vanga.

m3u
~~~~
 | A central playlist server provides adresses of streaming hosts. 
 | The app must select one of the hosts.

pls
~~~~
 | A central playlist server provides adresses of streaming hosts. 
 | Tha app must select one of the hosts.
 | The file format is other than m3u. Syntax is like choosing a file.

m3U8 (HLS)
~~~~~~~~~~
 | Apple radio and TV list of available stream types, resolution and 
 | quality of streams. Or simply a list of currently available 
 | stream chunks the client app must read.

.. note::
   | m3U8 stream are currently not supported by Vanga, but the URLs can
   | be copied and pasted in a VLC player as 'Network Stream'.

