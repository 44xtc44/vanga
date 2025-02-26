// countryAreaGrid.js
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

import { areaCountries } from "../constants.js";
import { sleep } from "../uiHelper.js";
import { recMsg } from "../network/messages.js";
import { metaData } from "../central.js";
import { getIndex } from "../database/idbSetGetValues.js";
import { stationClickerLinks } from "./stationContainer.js";
import {
  accessBlock,
  accessAllow,
  threadOverloadContainer,
} from "../network/messages.js";

export { countryBtns, localDbBtns, worldAreasBtns };

/**
 * Three different listeners for continent sub areas (on top level button grid).
 * Branches a button can belong to, in the top level grid:
 * (A) Favorites, localDbBtns() - opens local indexed DB Favorites and Custom buttons
 * (B) World, countryBtns() - opens a grid of buttons sorted as 3-letter country buttons
 * (C) Continent, worldAreasBtns() - opens a grid of area buttons (Asia, Africa, ...)
 * Custom btn stations are appended to the in mem 'metadata' infoDb, public database dict
 */

/**
 * Local stores .
 * Can add/remove a test store more easy. No need for 3-letter code.
 * Can style the few buttons.
 * @param {*} favoritesStores
 * @param {*} continentBtn
 * @param {*} continentBtn
 */
function localDbBtns(favoritesStores, continentBtn, continent) {
  return new Promise((resolve, _) => {
    continentBtn.addEventListener("click", () => {
      const wait = async () => {
        const containerName = "countryContainer";
        const anchorName = "countryAnchor";
        const anchor = await createContainer(containerName, anchorName);
        anchor.classList.add("grid-group-areas");
        recMsg(["area " + continent]);
        await removeElement("stationsAnchor"); // cleanup old stations clicker list
        await markBtnActive(continentBtn);

        for (const storeName of favoritesStores) {
          const storeBtn = document.createElement("div");
          storeBtn.setAttribute("id", storeName + "_storeBtn");
          storeBtn.classList.add("grid-group-item-areas");
          storeBtn.classList.add("handCursor");
          storeBtn.textContent = storeName;
          anchor.appendChild(storeBtn);

          await setEvtlocalDbBtns(storeBtn, storeName);
        }
      };
      wait();
    });
    resolve();
  });
}

function setEvtlocalDbBtns(storeBtn, storeName) {
  return new Promise((resolve, _) => {
    storeBtn.addEventListener("click", () => {
      const wait = async () => {
        const containerName = "stationContainer";
        const anchorName = "stationsAnchor";
        const anchor = await createContainer(containerName, anchorName);
        await markActiveButton(storeBtn);
        // filter group; country(2-char), continent(name), Custom('Custom'),Favorites('Favorites')
        await setActiveStationGroup(storeName);
        // Pull the Custom or Favorites station objects as array.
        const stationsArray = await getIndex({
          dbName: "radio_index_db",
          store: storeName,
        });
        // station container with names clicker, click builds the UI container
        await stationClickerLinks({
          objList: stationsArray,
          store: storeName,
          parent: anchor,
        });
        recMsg([stationsArray.length + " URLs " + storeName]);
      };
      wait();
    });
    resolve(); // not wait for evt async
  });
}

// ----------------------------------------------------------------------------------------------
/**
 */
function countryBtns(countryArray, continentBtn, continent) {
  return new Promise((resolve, _) => {
    continentBtn.addEventListener("click", () => {
      const wait = async () => {
        const containerName = "countryContainer";
        const anchorName = "countryAnchor";
        const anchor = await createContainer(containerName, anchorName);
        anchor.classList.add("grid-group-country");
        recMsg(["area " + continent]);
        await removeElement("stationsAnchor"); // cleanup old stations clicker
        await markBtnActive(continentBtn);

        for (const twoCharCode of countryArray) {
          const btn = document.createElement("div");
          btn.setAttribute("id", twoCharCode + "_storeBtn");
          btn.classList.add("grid-group-country-item");
          btn.classList.add("handCursor");
          // 3-letter code
          let char3code =
            metaData.get()["countryCodes"][twoCharCode.toUpperCase()];
          btn.textContent = char3code;
          anchor.appendChild(btn);

          await setEvtCountryBtns(btn, twoCharCode);
        }
      };
      wait();
    });
    resolve();
  });
}

function setEvtCountryBtns(btn, twoCharCode) {
  return new Promise((resolve, _) => {
    btn.addEventListener("click", () => {
      const wait = async () => {
        await accessBlock();
        await sleep(100);
        const containerName = "stationContainer";
        const anchorName = "stationsAnchor";
        const anchor = await createContainer(containerName, anchorName);
        const stationsArray = await countryStations(twoCharCode);
        await switchBtnCountries(btn);

        await setActiveStationGroup(twoCharCode);

        await stationClickerLinks({
          objList: stationsArray,
          store: twoCharCode,
          parent: anchor,
        });
        await accessAllow();
      };
      wait();
    });
    resolve(); // not wait for inner async
  });
}

function countryStations(twoCharCode) {
  return new Promise((resovlve, _) => {
    const wait = async () => {
      const cc = twoCharCode.toUpperCase(); // constants.js has lower case
      let db = metaData.get().infoDb; //  !!! debugger !!! whole DB

      const countryStations = Object.values(db).reduce((accu, station) => {
        // bug? object compare not string - refac check also other funs
        if (!accu.includes(station) && station.countrycode.includes(cc)) {
          accu.push(station);
        }
        return accu;
      }, []);
      db = null;
      const countryName = metaData.get()["countryNames"][cc];
      recMsg([countryStations.length + " URLs " + countryName]);
      resovlve(countryStations);
    };
    wait();
  });
}
// ----------------------------------------------------------------------------------------------
/**
 */
function worldAreasBtns(areaArray, worldBtn, continent) {
  return new Promise((resolve, _) => {
    worldBtn.addEventListener("click", () => {
      const wait = async () => {
        // Return if world btn press durning recording
        // as long as recorder is not a separate process - refac, upgrade
        const dlArray = await getIndex({
          dbName: "app_db",
          store: "downloader",
        });

        if (dlArray.length > 0) {
          await threadOverloadContainer();
          resolve();
          return;
        }

        const containerName = "countryContainer";
        const anchorName = "countryAnchor";
        const anchor = await createContainer(containerName, anchorName);
        anchor.classList.add("grid-group-areas");
        recMsg(["area " + continent]);
        await removeElement("stationsAnchor"); // cleanup old stations clicker
        await markBtnActive(worldBtn);

        for (const areaName of areaArray) {
          const btn = document.createElement("div");
          btn.setAttribute("id", areaName + "_storeBtn");
          btn.classList.add("grid-group-item-areas"); // member get listener
          btn.classList.add("handCursor");
          btn.textContent = areaName;
          anchor.appendChild(btn);

          await setEvtWorldAreasBtns(btn, areaName);
        }
      };
      wait();
    });
    resolve();
  });
}

function setEvtWorldAreasBtns(btn, areaName) {
  return new Promise((resolve, _) => {
    btn.addEventListener("click", () => {
      const wait = async () => {
        await accessBlock();
        await sleep(100);
        const containerName = "stationContainer";
        const anchorName = "stationsAnchor";
        const anchor = await createContainer(containerName, anchorName);
        // areaCountries array (constants.js)
        const stationsArray = await areaStations(areaName, areaCountries); 
        await markActiveButton(btn);

        await setActiveStationGroup(areaName);

        await stationClickerLinks({
          objList: stationsArray,
          store: areaName,
          parent: anchor,
        });
        await accessAllow();
      };
      wait();
    });
    resolve(); // not wait for inner async
  });
}

// ----------------------------------------------------------------------------------------------

/**
 * Extract all stations belonging to an array of countries (area).
 * @param {*} areaName 
 * @param {*} areaCountries 
 * @returns 
 */
function areaStations(areaName, areaCountries) {
  return new Promise((resovlve, _) => {
    const wait = async () => {
      const countryTwoChars = areaCountries[areaName].map((cc) =>
        cc.toUpperCase()
      );
      let db = metaData.get().infoDb; // whole DB !!! debugger !!!

      const areaStations = Object.values(db).reduce((accu, station) => {
        const cc = station.countrycode;

        if (
          !accu.includes(station) &&
          countryTwoChars.includes(cc.toUpperCase())
        ) {
          accu.push(station);
        }
        return accu;
      }, []);
      db = null;
      recMsg([areaStations.length + " URLs " + areaName]);
      resovlve(areaStations);
    };
    wait();
  });
}

/**
 * Container with an anchor to attach all stations.
 * Anchor can be removed, so no need for a remove loop.
 * @param {*} containerName 
 * @param {*} anchorName 
 * @returns 
 */
function createContainer(containerName, anchorName) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      await removeElement(anchorName);

      const container = document.getElementById(containerName);
      const anchor = document.createElement("div");
      anchor.id = anchorName;
      container.appendChild(anchor);
      resolve(anchor);
    };
    wait();
  });
}

/**
 * Can synchronous remove a DOM element, anchor.
 * @param {string} HTMLElement id
 * @returns {Promise} undefined
 * @example
 * await removeElement(anchorName);
 */
function removeElement(elementId) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      try {
        document.getElementById(elementId).remove();
      } catch (e) {}
      await sleep(100); // DOM is not reliable
      resolve();
    };
    wait();
  });
}

/**
 * Set a filter group marker.
 * country(2-char), continent(name), Custom('Custom'),Favorites('Favorites')
 * stationGroup' it is used to detect and
 * create a delete button to remove 'Custom' URLs from object store.
 * @param {string} objStore
 */
function setActiveStationGroup(objStore) {
  return new Promise((resolve, _) => {
    metaData.set()["stationGroup"] = objStore;
    resolve();
  });
}

/**
 * Sub area buttons have different css styles.
 * grid-group-item-areas Favorites and World
 * grid-group-country-item Countries with 3-letter code
 * grid-group-continent-item Continent buttons (top)
 */

/**
 * Show Continents switched button with permanent changed color.
 * @param {HTMLElement} pushedBtn
 * @returns {Promise} undefined
 */
function markBtnActive(pushedBtn) {
  return new Promise((resolve, _) => {
    const idleBtns = document.getElementsByClassName(
      "grid-group-continent-item"
    );
    const activeBtns = document.getElementsByClassName(
      "grid-group-continent-item-active"
    );
    const activeBtn = activeBtns[0];
    if (activeBtn !== undefined) {
      activeBtn.classList.remove("grid-group-continent-item-active");
      activeBtn.classList.add("grid-group-continent-item");
    }
    pushedBtn.classList.remove("grid-group-continent-item");
    pushedBtn.classList.add("grid-group-continent-item-active");

    resolve();
  });
}

/**
 * Show Country switched button with permanent changed color.
 * @param {HTMLElement} pushedBtn
 * @returns {Promise} undefined
 */
function switchBtnCountries(pushedBtn) {
  return new Promise((resolve, _) => {
    const idleBtns = document.getElementsByClassName("grid-group-country-item");
    const activeBtns = document.getElementsByClassName(
      "grid-group-country-item-active"
    );
    const activeBtn = activeBtns[0];
    if (activeBtn !== undefined) {
      activeBtn.classList.remove("grid-group-country-item-active");
      activeBtn.classList.add("grid-group-country-item");
    }
    pushedBtn.classList.remove("grid-group-country-item");
    pushedBtn.classList.add("grid-group-country-item-active");

    resolve();
  });
}

/**
 * Show Favorites and World switched button with permanent changed color.
 * @param {HTMLElement} pushedBtn
 * @returns {Promise} undefined
 */
function markActiveButton(pushedBtn) {
  return new Promise((resolve, _) => {
    const activeBtns = document.getElementsByClassName(
      "grid-group-item-areas-active"
    );
    const activeBtn = activeBtns[0];
    if (activeBtn !== undefined) {
      activeBtn.classList.remove("grid-group-item-areas-active");
      activeBtn.classList.add("grid-group-item-areas");
    }
    pushedBtn.classList.remove("grid-group-item-areas");
    pushedBtn.classList.add("grid-group-item-areas-active");

    resolve();
  });
}
