// uiSearch.js
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
import { metaData } from "../central.js";

export { searchBarCountry };

/**
 * Display only matching radios.
 * @param {*} o
 * @returns
 */
function searchBarCountry(o = {}) {
  return new Promise((resolve, _) => {
    const markerUrl = 'url("./images/search-icon.svg")';
    const markerSize = "18px 18px";
    const markerPos = "4px 10px"; // left or "0px 0px"
    const inputSize = 50;
    const inputBottomMargin = "4px";
    const nonRequiredCol = "#383d3f";
    const placeHolderSeachCountry =
      "Tags: radio name, reggae, хип-хоп, lounge, เพลงลูกทุ่ง, hls";

    const parent = document.getElementById(o.parentId);
    const firstChild = parent.firstChild; // we insert before any first

    const searchBar = document.createElement("div");
    searchBar.setAttribute("id", o.childId);
    // parent div and section wrapper
    const divWrapInputs = document.createElement("div");
    divWrapInputs.style.margin = "16px";
    divWrapInputs.style.padding = "10px 16px";
    divWrapInputs.style.borderRadius = "4px";
    divWrapInputs.style.backgroundColor = "#1c1e1f";

    /* input */
    const input = document.createElement("input");
    input.type = "text";
    input.style.backgroundImage = markerUrl;
    input.style.backgroundSize = markerSize;
    input.style.backgroundPosition = markerPos;
    input.style.height = "40px";
    input.style.width = "400px";
    input.style.paddingLeft = "28px";
    input.size = inputSize.toString();
    input.placeholder = placeHolderSeachCountry;
    input.style.borderLeft = "2mm ridge #49bbaa";
    input.style.borderTop = "1px solid #369082ff";
    input.style.borderRight = "1px solid #369082ff";
    input.style.borderBottom = "1px solid #369082ff";
    // input.style.border = "solid 1px " + nonRequiredCol;
    input.addEventListener("input", (e) => {
      const wait = async () => {
        await searchTag(e);
      };
      wait();
    });
    const divInput = document.createElement("div");
    divInput.style.marginBottom = inputBottomMargin;
    const spanInputSearchHead = document.createElement("span");
    spanInputSearchHead.classList.add("spanHead");
    spanInputSearchHead.innerText = "";

    const spanInputSearchTail = document.createElement("span");
    spanInputSearchTail.classList.add("spanTail");

    searchBar.appendChild(divWrapInputs);
    divWrapInputs.appendChild(divInput);
    divInput.appendChild(spanInputSearchHead);
    divInput.appendChild(input);
    divInput.appendChild(spanInputSearchTail);
    parent.insertBefore(searchBar, firstChild);

    resolve();
  });
}

/**
 * Filter list of clicker divs by search string.
 * @param {event} e search input box event
 */
function searchTag(e) {
  return new Promise((resolve, _) => {
    const sTag = e.target.value
    if (sTag.length < 3) {
      return; // prevent search 50k for one character
    }

    const uuidArray = metaData.get().shownStationsIds;
    const wait = async () => {
      if (e.target.value.length >= 1) {
        await searchRun(sTag, uuidArray);
      }
      resolve();
    };
    wait();
  });
}

function searchRun(searchTag, uuidArray) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const switchedCount = await switchContainer(searchTag, uuidArray);
      recMsg([searchTag.concat(": ", switchedCount)]);
      resolve();
    };
    wait();
  });
}

/**
 * Show stations container where search is matching.
 * Search over station names and tags.
 * 
 * World search takes long time (chinese extreme). refac
 * Need DB as key val in object store to attach two or
 * more search assistent worker.
 * https://medium.com/@kamresh485/a-comprehensive-guide-to-cursors-in-indexeddb-navigating-and-manipulating-data-with-ease-2793a2e01ba3
 * https://medium.com/@kamresh485/a-comprehensive-guide-to-indexeddb-indexes-enhancing-data-retrieval-in-web-applications-8755957c0cbe
 * https://nolanlawson.com/2021/08/22/speeding-up-indexeddb-reads-and-writes/
 * @param {string} searchTag
 * @param {string} uuidArray stationuuid 's to get name and tag
 * @returns {number} count of shown stations
 */
function switchContainer(searchTag, uuidArray) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const suffix = "_container";

      const switchedCount = await uuidArray.reduce((accu, uuid) => {
        // worker offload, if DB is correct stored as key val in a store
        // multi char copy/paste takes long time in World search
        // distribute over two or more worker, split DB search
        const stationName = metaData.get().infoDb[uuid].name;
        let stationTag = metaData.get().infoDb[uuid].tags;

        if (stationTag === undefined) stationTag = "";
        if (
          // case sensitive .includes()
          stationTag.toLowerCase().includes(searchTag.toLowerCase()) ||
          stationName.toLowerCase().includes(searchTag.toLowerCase())
        ) {
          document.getElementById(uuid + suffix).style.display = "block";
          accu += 1;
        } else {
          document.getElementById(uuid + suffix).style.display = "none";
        }
        return accu;
      }, 0);
      resolve(switchedCount);
    };
    wait();
  });
}
