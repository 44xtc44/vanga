//  stationContainer.js
"use strict";
/**
 *  This file is part of Vanga.
 *  Vange is published to be a distributed database for public radio and
 *  TV station URLs. The cached DB copy can be used also if
 *  the public database fails. Additional features shall improve the
 *  value of the application. Example is the vote, click statistic feature.
 *  Copyright (C) 2025 René Horn
 *
 *    Vanga is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation, either version 3 of the License, or
 *    any later version.
 *
 *    Vanga is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License
 *    along with Vanga. If not, see <http://www.gnu.org/licenses/>.
 */

import { recMsg } from "../network/messages.js";
import { detectStream } from "../network/streamDetect.js";
import { sleep } from "../uiHelper.js";
import { showPls } from "./uiPls.js";
import { showM3u8 } from "./uiM3u8.js";
import { metaData } from "../central.js";
import { searchBarCountry } from "./uiSearch.js";
import { submitStationVote } from "../network/publicDbCom.js";
import { updateSingleStationJson } from "../network/publicDbCom.js";
import {
  recordBoxListener,
  listenBoxListener,
  settingsBoxListener,
} from "./createRadioListener.js";
import {
  getIdbValue,
  setIdbValue,
  delIdbValue,
  getIndex,
} from "../database/idbSetGetValues.js";
import { recBtnColorOn } from "./radioOperation.js";

export { stationClickerLinks };

/**
 * A container div for the clicker div and an anchor div.
 * A grid scaffolding to assign buttons and icons to it later, hidden.
 * Click on container populates the below grid and del the chlicker.
 * Saves a lot of time to create the huge list at all and
 * for search to re-build element list.
 * @returns
 */
function stationClickerLinks(o = {}) {
  return new Promise((resolve, _) => {
    const clickerStations = o.objList; // country filtered
    const objStore = o.store; // 2-letter country code or favorite store name
    const radioParentDiv = o.parent;
    // stations in 'favorites' store -- refac, obsolete
    const favIdList = o.favIdList; // now use station obj prop 'isFavorite'

    // Destroy old object from other country.
    metaData.set()["shownStationsIds"] = []; // all divClicker Ids displayed
    // Station grids that where build already. The clicker link was therefore removed.
    metaData.set()["buildStationIds"] = []; // [uuid, uuid2]; can request vote count

    const wait = async () => {
      // Enables delete from a local store. [by blacklist page delete x btn]
      // stationGroup Can be country code or name of local store Favorites/Custom.
      // Set stationGroup in the country button evt listener module.
      const stationGroup = metaData.get()["stationGroup"];

      await clickerStations.sort((a, b) => a.name.localeCompare(b.name)); // str compare

      // SEARCH_BAR 'radioNamesDiv_searchBar'
      await searchBarCountry({
        parentId: radioParentDiv.id,
        childId: radioParentDiv + "_child",
      });

      for (const [index, station] of clickerStations.entries()) {
        // --- This guy can kill record and play if used with 'World'. ---
        // Work on the recorder to web worker migration.
        // Work on the 'World' web worker migration. Worker str output to shadow DOM.
        if (index % 3000 === 0) await sleep(100);
        // had an await here for playlist tag update, now in central.js
        const stationName = station.name;
        const stationuuid = station.stationuuid;

        // Search fun can display block/none station container as a subset.
        metaData.set()["shownStationsIds"].push(stationuuid);
        // A station can belong to a country, continent, Custom filter group.
        metaData.set().infoDb[stationuuid].stationGroup = stationGroup;

        // wrapper container for clicker and grid anchor
        const container = document.createElement("div");
        container.setAttribute("id", stationuuid + "_container");
        // clicker
        const divClicker = document.createElement("div");
        divClicker.setAttribute("id", stationuuid + "_divClicker");
        divClicker.classList.add("evtListenerCountry");
        divClicker.innerHTML = stationName; // text to click

        radioParentDiv.appendChild(container);
        container.appendChild(divClicker);

        const gridObj = {
          station: station, // object with url, countrycode, homepage
          favIdList: favIdList, // all stored favorite station objects
          objectStore: objStore, // if from strore, its name, else 2-letter country code
          divClicker: divClicker,
        };

        // 'Event' on station named div to build a single station UI.
        divClicker.addEventListener("click", () => {
          const waitGridContainer = async () => {
            await gridContainer(stationuuid, container, gridObj);
          };
          waitGridContainer();
        });

        // 'Show' assambled grid if some activity. Rec or play.
        const isRecording = metaData.get().infoDb[stationuuid].isRecording;
        // May be relevant if we fetch stream also play. Play from buffer.
        const isListening = metaData.get().infoDb[stationuuid].isListening;
        const isPlaying = metaData.get().infoDb[stationuuid].isPlaying;
        if (isRecording || isListening || isPlaying) {
          await gridContainer(stationuuid, container, gridObj);
        }
      }
      resolve();
    };
    wait();
  });
}

function gridContainer(stationuuid, container, gridObj) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      // anchor in container
      const gridAnchor = document.createElement("div");
      gridAnchor.classList.add("grid-single-radio");
      gridAnchor.setAttribute("id", stationuuid + "_gridAnchor");
      container.appendChild(gridAnchor);

      const gridMember = await createGridScaffolding(stationuuid);
      // add here to include fun createGridScaffolding
      gridObj["gridElements"] = gridMember;
      // readable, next time better return obj with key names
      const gridNameBox = gridMember[0];
      const gridListenBox = gridMember[1];
      const gridTitleBox = gridMember[2];
      const gridSettingsBox = gridMember[3];

      gridAnchor.appendChild(gridNameBox);
      gridAnchor.appendChild(gridListenBox);
      gridAnchor.appendChild(gridTitleBox);
      gridAnchor.appendChild(gridSettingsBox);

      await populateOneGrid(gridObj);
      gridObj.divClicker.remove(); // get rid of evt listener
      resolve();
    };
    wait();
  });
}

/**
 *
 */
function createBoxTitle(gridTitleBox) {
  return new Promise((resolve, _) => {
    gridTitleBox.classList.add("cutOverflow");
    gridTitleBox.textContent = "---";
    gridTitleBox.style.color = "rgba(247, 183, 51, 0.8)";
    gridTitleBox.style.backgroundColor = "#212631";
    gridTitleBox.style.border = "0px";
    resolve();
  });
}

function createBoxListen(station, gridListenBox) {
  return new Promise((resolve, _) => {
    gridListenBox.classList.add("handCursor");
    gridListenBox.classList.add("divGridButton");
    const playImg = document.createElement("img");
    playImg.id = "playImg_" + station.stationuuid;
    playImg.src = "./images/speaker-icon-off.svg";
    playImg.style.width = "26px";
    gridListenBox.appendChild(playImg);

    // if we come back from another country button
    const isPlaying = metaData.get().infoDb[station.stationuuid].isPlaying;
    if (isPlaying !== undefined && isPlaying) {
      gridListenBox.style.color = "#222222";
      gridListenBox.style.backgroundColor = "#49bbaa";
      playImg.src = "./images/speaker-icon-on.svg";
    }

    resolve();
  });
}

function createBoxSettings(gridSettingsBox) {
  return new Promise((resolve, _) => {
    gridSettingsBox.classList.add("handCursor");
    gridSettingsBox.classList.add("divGridButton");
    const setImg = document.createElement("img");
    setImg.src = "./images/blacklist-icon.svg";
    setImg.style.height = "26px";
    gridSettingsBox.appendChild(setImg);
    resolve();
  });
}

/**
 * Create grid element divs. Without content and appenChild.
 * Store grid div refs in a list, inside an object.
 * @param {string} stationuuid
 * @returns {Promise} div elements of station grid
 */
function createGridScaffolding(stationuuid) {
  return new Promise((resolve, _) => {
    // divs that form the grid
    const gridNameBox = document.createElement("div");
    gridNameBox.setAttribute("id", stationuuid + "_nameBox");
    gridNameBox.classList.add("grid-single-radio-item");

    const gridListenBox = document.createElement("div");
    gridListenBox.setAttribute("id", stationuuid + "_listenBox");
    gridListenBox.classList.add("grid-single-radio-item");

    const gridTitleBox = document.createElement("div");
    gridTitleBox.setAttribute("id", stationuuid + "_titleBox");
    gridTitleBox.classList.add("grid-single-radio-item");

    const gridSettingsBox = document.createElement("div");
    gridSettingsBox.setAttribute("id", stationuuid + "_settingsBox");
    gridSettingsBox.classList.add("grid-single-radio-item");

    // prepare Search feature, display tags, gridMember on/off
    const gridMember = [
      gridNameBox,
      gridListenBox,
      gridTitleBox,
      gridSettingsBox,
    ];
    resolve(gridMember);
  });
}

/**
 * Fill grid elements with content.
 * Attach grid to a paretnt div.
 * @param {*} o
 * @returns
 */
async function populateOneGrid(o = {}) {
  return new Promise((resolve, _) => {
    const station = o.station;
    const favIdList = o.favIdList; // refac del
    const gridNameBox = o.gridElements[0];
    const gridListenBox = o.gridElements[1];
    const gridTitleBox = o.gridElements[2];
    const gridSettingsBox = o.gridElements[3];

    const waitGridReady = async () => {
      const boxRecorder = await createBoxName(station, gridNameBox, favIdList);
      await createBoxListen(station, gridListenBox);
      await createBoxTitle(gridTitleBox);
      await createBoxSettings(gridSettingsBox);
      recordBoxListener(station, boxRecorder);
      listenBoxListener(station, gridListenBox);
      gridSettingsBox.addEventListener(
        "click",
        function (e) {
          const stationGroup =
            metaData.get().infoDb[station.stationuuid].stationGroup;

          settingsBoxListener(e, station, stationGroup);
        },
        false
      );

      // for search fun
      metaData.set()["buildStationIds"].push(station.stationuuid);
      updateSingleStationJson(station.stationuuid);
      resolve();
    };
    waitGridReady();
  });
}

function recordButton(stationuuid, station, stationName) {
  return new Promise((resolve, _) => {
    const boxRecorder = document.createElement("div");
    boxRecorder.setAttribute("id", "divBoxRecord_" + stationuuid);
    boxRecorder.classList.add("divBoxRecord");
    boxRecorder.innerText = stationName;

    // if we come back from another country button
    const isRecording = metaData.get().infoDb[stationuuid].isRecording;
    if (isRecording !== undefined && isRecording) {
      recBtnColorOn(boxRecorder, true);
    }

    resolve(boxRecorder);
  });
}

function interactBar(stationuuid) {
  return new Promise((resolve, _) => {
    const divInteract = document.createElement("div");
    divInteract.setAttribute("id", "divInteract_" + stationuuid);
    divInteract.classList.add("interactBar");
    divInteract.style.display = "flex";
    divInteract.style.position = "relative";
    divInteract.style.textAlign = "left";

    resolve(divInteract);
  });
}

function votesClicker(stationuuid, stationName) {
  return new Promise((resolve, _) => {
    const divVotesClicker = document.createElement("div");
    divVotesClicker.setAttribute("id", "divVotesClicker_" + stationuuid);
    divVotesClicker.classList.add("interactBar");
    divVotesClicker.classList.add("handCursor");
    divVotesClicker.style.minWidth = "30px";
    const imgVotesClicker = document.createElement("img");
    imgVotesClicker.id = "imgVotesClicker_" + stationuuid;

    const isPublic = metaData.get().infoDb[stationuuid].isPublic;
    if (isPublic) {
      imgVotesClicker.src = "./images/votes-icon.svg";
    } else {
      imgVotesClicker.src = "./images/transparent-icon.svg";
    }
    imgVotesClicker.style.width = "30px";
    imgVotesClicker.style.backgroundColor = "";
    divVotesClicker.appendChild(imgVotesClicker);

    divVotesClicker.addEventListener("click", () => {
      if (!isPublic) return;
      imgVotesClicker.src = "./images/votes-done-icon.svg";
      const sleepRestore = async () => {
        await sleep(250);
        imgVotesClicker.src = "./images/votes-icon.svg";
        await submitStationVote(stationuuid, stationName);
      };
      sleepRestore();
    });

    resolve(divVotesClicker);
  });
}

function votesBadge(stationuuid) {
  return new Promise((resolve, _) => {
    try {
      // if elem appears in another store, recreate it
      document.getElementById("divVotesBadge_" + stationuuid).remove();
    } catch (e) {}
    const divVotesBadge = document.createElement("div");
    divVotesBadge.setAttribute("id", "divVotesBadge_" + stationuuid);
    divVotesBadge.classList.add("divVotesBadge");
    divVotesBadge.classList.add("divVotesBadgeDefaultColor");

    const isRecording = metaData.get().infoDb[stationuuid].isRecording;
    // Custom URL had no isRecording prop. Check in central.js. refac
    if (isRecording !== undefined && isRecording) {
      divVotesBadge.style.display = "none";
    }

    resolve(divVotesBadge);
  });
}

function showNoTag(stationuuid, station) {
  return new Promise((resolve, _) => {
    const divTagWarn = document.createElement("div");
    divTagWarn.setAttribute("id", "divTagWarn" + stationuuid);
    divTagWarn.classList.add("interactBar");
    divTagWarn.style.minWidth = "30px";
    const imgTagWarn = document.createElement("img");
    imgTagWarn.id = "imgTagWarn_" + stationuuid;
    imgTagWarn.src = "./images/warn-no-tag.svg";
    imgTagWarn.style.width = "30px";
    divTagWarn.style.backgroundColor = "";
    if (station.tags === "" && !station.isM3u8)
      divTagWarn.appendChild(imgTagWarn);

    resolve(divTagWarn);
  });
}

function showPlsIcon(stationuuid, station, divTagWarn) {
  return new Promise((resolve, _) => {
    const divPls = document.createElement("div");
    divPls.setAttribute("id", "divPls_" + stationuuid);
    divPls.classList.add("interactBar");
    divPls.classList.add("handCursor");
    divPls.style.minWidth = "30px";
    divPls.style.display = "none";
    const imgPls = document.createElement("img");
    imgPls.id = "imgPls_" + stationuuid;
    imgPls.src = "./images/transparent-icon.svg";

    if (station.isPLS) {
      divTagWarn.style.display = "none";
      divPls.style.display = "block";

      imgPls.src = "./images/pls-icon.svg";
      imgPls.style.width = "30px";
      imgPls.style.marginTop = "-4px";
      divPls.appendChild(imgPls);
      // event listener
      divPls.addEventListener("click", () => {
        const wait = async () => {
          imgPls.src = "./images/pls-icon-done.svg";
          await sleep(250);
          imgPls.src = "./images/pls-icon.svg";

          // get pls file text from server
          const plsTxt = await detectStream(stationuuid);
          showPls(plsTxt.text, stationuuid);
        };
        wait();
      });
    }
    resolve(divPls);
  });
}

function showM3uIcon(stationuuid, station, divTagWarn) {
  return new Promise((resolve, _) => {
    const divM3u = document.createElement("div");
    divM3u.setAttribute("id", "divM3u_" + stationuuid);
    divM3u.classList.add("interactBar");
    divM3u.classList.add("handCursor");
    divM3u.style.minWidth = "30px";
    divM3u.style.display = "none";
    const imgM3u = document.createElement("img");
    imgM3u.id = "imgM3u_" + stationuuid;
    imgM3u.src = "./images/transparent-icon.svg";

    if (station.isM3U) {
      divTagWarn.style.display = "none";
      divM3u.style.display = "block";

      imgM3u.src = "./images/m3u-icon.svg";
      imgM3u.style.width = "30px";
      imgM3u.style.marginTop = "-4px";
      divM3u.appendChild(imgM3u);
      // event listener
      divM3u.addEventListener("click", () => {
        const callPlaylist = async () => {
          imgM3u.src = "./images/m3u-icon-done.svg";
          await sleep(250);
          imgM3u.src = "./images/m3u-icon.svg";

          // get m3u file text array from server
          const m3uTxt = await detectStream(stationuuid);
          showPls(m3uTxt.text, stationuuid);
        };
        callPlaylist();
      });
    }
    resolve(divM3u);
  });
}

function showM3u8Icon(stationuuid, station, divTagWarn) {
  return new Promise((resolve, _) => {
    const divM3u8 = document.createElement("div");
    divM3u8.setAttribute("id", "divM3u8_" + stationuuid);
    divM3u8.classList.add("interactBar");
    divM3u8.classList.add("handCursor");
    divM3u8.style.minWidth = "30px";
    divM3u8.style.display = "none";
    const imgM3u8 = document.createElement("img");
    imgM3u8.id = "imgM3u8_" + stationuuid;
    imgM3u8.src = "./images/transparent-icon.svg";

    if (metaData.get().infoDb[stationuuid].isM3u8) {
      divTagWarn.style.display = "none";
      divM3u8.style.display = "block";

      imgM3u8.src = "./images/m3u8-icon.svg";
      imgM3u8.style.width = "30px";
      imgM3u8.style.marginTop = "-4px";
      divM3u8.appendChild(imgM3u8);
      // m3u8 event listener
      divM3u8.addEventListener("click", () => {
        const callPlaylist = async () => {
          imgM3u8.src = "./images/m3u8-done-icon.svg";
          await sleep(250);
          imgM3u8.src = "./images/m3u8-icon.svg";

          // get m3u8 file text from server
          const m3u8UrlTxt = await detectStream(stationuuid);
          showM3u8({
            m3u8UrlTxt: m3u8UrlTxt.text,
            radioName: station.name,
            url: station.url,
          });
        };
        callPlaylist();
      });
    }
    resolve(divM3u8);
  });
}

function showCopy(stationuuid, station) {
  return new Promise((resolve, _) => {
    const divCopy = document.createElement("div");
    divCopy.setAttribute("id", "divCopy_" + stationuuid);
    divCopy.classList.add("interactBar");
    divCopy.classList.add("handCursor");
    const imgCopy = document.createElement("img");
    imgCopy.id = "imgCopy_" + stationuuid;
    imgCopy.src = "./images/copy-icon.svg";
    imgCopy.style.height = "30px";
    imgCopy.style.marginTop = "-4px";
    divCopy.appendChild(imgCopy);

    divCopy.addEventListener("click", () => {
      const copyUrl = station.url;
      navigator.clipboard.writeText(copyUrl);
      imgCopy.src = "./images/copy-done-icon.svg";
      const sleepRestore = async () => {
        await sleep(1000);
        imgCopy.src = "./images/copy-icon.svg";
      };
      sleepRestore();
    });

    resolve(divCopy);
  });
}

function showHome(stationuuid, station) {
  return new Promise((resolve, _) => {
    const divHome = document.createElement("div");
    divHome.setAttribute("id", "divHome_" + stationuuid);
    divHome.classList.add("interactBar");
    divHome.classList.add("handCursor");
    const imgHome = document.createElement("img");
    imgHome.id = "imgHome_" + stationuuid;
    imgHome.src = "./images/home-icon.svg";
    imgHome.style.height = "30px";
    imgHome.style.marginTop = "-4px";
    divHome.appendChild(imgHome);
    divHome.addEventListener("click", () => {
      const home = station.homepage;
      window.open(home, "_blank");
    });
    resolve(divHome);
  });
}

function showFavicon(stationuuid, station) {
  return new Promise((resolve, _) => {
    const divFavicon = document.createElement("div");
    divFavicon.setAttribute("id", "divFavicon_" + stationuuid);
    divFavicon.classList.add("interactBar");
    divFavicon.style.height = "25px";
    divFavicon.style.overflow = "visible";
    const imgFavicon = document.createElement("img");
    imgFavicon.id = "imgFavicon_" + stationuuid;
    imgFavicon.src = "./images/transparent-icon.svg";
    imgFavicon.style.height = "25px";
    imgFavicon.style.width = "25px";

    const faviconSrc = station.favicon;
    if (faviconSrc.length > 0) {
      imgFavicon.src = faviconSrc;
    }
    divFavicon.appendChild(imgFavicon);

    resolve(divFavicon);
  });
}

/**
 * @param {string} stationuuid
 * @returns
 */
function showFavorite(stationuuid) {
  return new Promise((resolve, _) => {
    const divFavorite = document.createElement("div");
    divFavorite.setAttribute("id", "divFavorite_" + stationuuid);
    divFavorite.classList.add("interactBar");
    divFavorite.classList.add("handCursor");

    const spanFav = document.createElement("span");
    spanFav.setAttribute("id", "favorite_" + stationuuid);
    spanFav.style.float = "right";
    spanFav.style.fontSize = "70%";
    const img = document.createElement("img");
    img.setAttribute("id", "imgFavorite_" + stationuuid);
    img.setAttribute("width", "26px");
    img.setAttribute("heigth", "26px");
    img.style.marginTop = "-2px";
    img.src = "./images/favorite-icon-star-off.svg";

    if (metaData.get().infoDb[stationuuid].isFavorite) {
      img.src = "./images/favorite-icon-star-on.svg";
    }
    // span can easily vertical align
    spanFav.addEventListener("click", () => {
      const img = document.getElementById("imgFavorite_" + stationuuid);
      if (metaData.get().infoDb[stationuuid].isFavorite) {
        // del from fav list
        const wait = async () => {
          await delFavorite(stationuuid);
          metaData.set().infoDb[stationuuid].isFavorite = false;
          img.src = "./images/favorite-icon-star-off.svg";
          // Del container if it is under button Favorites, otherwise not.
          if (metaData.get().infoDb[stationuuid].stationGroup === "Favorites") {
            document.getElementById(stationuuid + "_container").remove();
          }
        };
        wait();
      } else {
        // add to fav list
        const wait = async () => {
          await addFavorite(stationuuid);
          metaData.set().infoDb[stationuuid].isFavorite = true;
          img.src = "./images/favorite-icon-star-on.svg";
        };
        wait();
      }
    });
    spanFav.appendChild(img);
    divFavorite.appendChild(spanFav);

    resolve(divFavorite);
  });
}

function addFavorite(stationuuid) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const dbName = "radio_index_db";
      const storeName = "Favorites";
      const stationObj = metaData.get().infoDb[stationuuid];
      const db = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: dbName,
      });
      await setIdbValue({
        dbName: dbName,
        dbVersion: db.dbVersion,
        objectStoreName: storeName,
        data: stationObj,
      }).catch((e) => {
        console.error("addFavorite->", stationuuid, e);
        resolve(false);
      });
      resolve(true);
    };
    wait();
  });
}

function delFavorite(stationuuid) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const dbName = "radio_index_db";
      const storeName = "Favorites";
      const stationObj = metaData.get().infoDb[stationuuid];
      const db = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: dbName,
      });
      await delIdbValue({
        dbName: dbName,
        dbVersion: db.dbVersion,
        objectStoreName: storeName,
        data: stationObj,
      }).catch((e) => {
        recMsg(["fail :: del Favorites ", stationObj.name, e]);
        resolve(false);
      });
      recMsg(["removed from Favorites ", stationObj.name]);
      resolve();
    };
    wait();
  });
}

function createBoxName(station, gridNameBox, favIdList) {
  return new Promise((resolve, _) => {
    const waitCreateBox = async () => {
      const stationuuid = station.stationuuid;
      const stationName = station.name;

      const boxRecorder = await recordButton(stationuuid, station, stationName);
      // votes badge (on boxRecorder)
      const divVotesBadge = await votesBadge(stationuuid);
      // interaction bar for button and icons
      const divInteract = await interactBar(stationuuid);
      // votes clicker (on interaction bar)
      const divVotesClicker = await votesClicker(stationuuid, stationName);
      // NO_TAG (on interaction bar)
      const divTagWarn = await showNoTag(stationuuid, station);
      // PLS badge (on interaction bar)
      const divPls = await showPlsIcon(stationuuid, station, divTagWarn);
      // M3u badge (on interaction bar)
      const divM3u = await showM3uIcon(stationuuid, station, divTagWarn);
      // M3u8 badge (on interaction bar)
      const divM3u8 = await showM3u8Icon(stationuuid, station, divTagWarn);
      // copy URL badge (on interaction bar)
      const divCopy = await showCopy(stationuuid, station);
      // home badge (on interaction bar)
      const divHome = await showHome(stationuuid, station);
      // Favicon badge (on interaction bar)
      const divFavicon = await showFavicon(stationuuid, station);
      // Favorite star (on interaction bar)
      const divFavorite = await showFavorite(stationuuid);

      // display order of icons
      gridNameBox.appendChild(boxRecorder);
      boxRecorder.appendChild(divVotesBadge);
      gridNameBox.appendChild(divInteract);
      divInteract.appendChild(divVotesClicker);
      divInteract.appendChild(divTagWarn);
      divInteract.appendChild(divPls);
      divInteract.appendChild(divM3u);
      divInteract.appendChild(divM3u8);
      divInteract.appendChild(divCopy);
      divInteract.appendChild(divHome);
      divInteract.appendChild(divFavicon);
      divInteract.appendChild(divFavorite);
      resolve(boxRecorder); // dl clicker div (votes badge)
    };
    waitCreateBox();
  });
}
