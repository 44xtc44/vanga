// update_radio_browser_info.js
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

import { metaData } from "../central.js";
import { isUrlAlive } from "../network/streamDetect.js";
import { showDbpdateUi } from "./update_ui.js";
import { setIdbValue, getIdbValue } from "../database/idbSetGetValues.js";
import { waitTimeRadioBrowserInfo, vangaUserAgent } from "../constants.js";

export { updateRadioBrowserInfoDb };

function readTimeStampDl() {
  return new Promise((resolve, _) => {
    const waitGetMilliSec = async () => {
      const version = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: "radio_index_db",
      });

      const milliSec = await getIdbValue({
        dbName: "radio_index_db",
        dbVersion: version.dbVersion,
        objectStoreName: "db_downloads",
        id: "radio_browser_info_db_time_stamp",
      }).catch(() => resolve(false));
      resolve(milliSec);
    };
    waitGetMilliSec();
  });
}

function writeTimeStampDl() {
  return new Promise((resolve, _) => {
    const waitSetTimeStamp = async () => {
      const version = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: "radio_index_db",
      });
      // new radio 'objects' db, load at app start
      await setIdbValue({
        dbName: "radio_index_db",
        dbVersion: version.dbVersion,
        objectStoreName: "db_downloads",
        data: {
          id: "radio_browser_info_db_time_stamp",
          updateTime: Date.now(),
        },
      }).catch((e) => {
        console.error("radio_browser_info_db_time_stamp write", e);
      });
      resolve();
    };
    waitSetTimeStamp();
  });
}

function writeToObjStore(newJsonDb) {
  return new Promise((resolve, _) => {
    const waitSet = async () => {
      const version = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: "radio_index_db",
      });
      // new radio 'objects' db, load at app start
      await setIdbValue({
        dbName: "radio_index_db",
        dbVersion: version.dbVersion,
        objectStoreName: "db_downloads",
        data: { id: "radio_browser_info_db", add: newJsonDb },
      }).catch((e) => {
        console.error("update_radio_browser_info write db", e);
      });
      resolve();
    };
    waitSet();
  });
}

/**
 * Pull radio objects from JSON API.
 * @param {*} updateUrl
 * @param {*} uiObj
 * @returns
 */
function downloadRemoteJson(updateUrl, uiObj) {
  return new Promise((resolve, _) => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    abortSignal.addEventListener("abort", () => {});
    const addHeaders = new Headers();
    addHeaders.append("User-Agent", vangaUserAgent);

    const statusBar = document.createElement("div");
    statusBar.style.backgroundColor = "#6261cb";
    statusBar.style.boxShadow = "rgb(81, 48, 69) 0px 0px 10px inset";
    statusBar.style.height = "20px";
    statusBar.style.width = "0%";
    uiObj.dbUpdHint.appendChild(statusBar);

    const waitFetch = async () => {
      const fetchOpt = {
        method: "GET",
        mode: "cors",
        signal: abortSignal, // may implement button to abort
        headers: addHeaders,
      };
      // fetch
      await fetch(updateUrl, fetchOpt)
        .then((response) => {
          const streamReader = response.body.getReader();
          const contentLength = response.headers.get("Content-length");
          let receivedLength = 0;
          const chunkArray = [];
          const waitJson = async () => {
            while (true) {
              const nextChunk = await streamReader.read();
              if (nextChunk.done) break;
              const chunk = nextChunk.value;
              chunkArray.push(chunk); // uint8array
              receivedLength += chunk.length;
              statusBar.style.width =
                (receivedLength / contentLength) * 100 + "%";
              uiObj.dbUpdInfoBlock.innerHTML = `Received ${receivedLength} of ${contentLength}`;
            }
            let arrayBuffer = await new Blob(chunkArray).arrayBuffer();
            let blob = new Blob([arrayBuffer], { type: "application/json" });
            const commit = JSON.parse(await blob.text());
            arrayBuffer = null;
            blob = null;
            resolve(commit);
          };
          waitJson();
        })
        .catch(() => resolve(false));
    };
    waitFetch();
  });
}

/**
 * Allow update after waitTime in ms.
 * @returns
 */
async function updateRadioBrowserInfoDb() {
  const waitTime = waitTimeRadioBrowserInfo;
  await showDbpdateUi();
  const uiObj = {
    dbUpdHead: document.getElementById("dbUpdHead"),
    dbUpdHint: document.getElementById("dbUpdHint"),
    dbUpdInfoBlock: document.getElementById("dbUpdInfoBlock"),
    dbUpdClose: document.getElementById("dbUpdClose"),
  };

  let dbSrvUrl = metaData.get()["radioBrowserInfoUrl"];
  const updateUrl = "https://" + dbSrvUrl + "/json/stations";
  if (dbSrvUrl === "NETWORK_ERROR") {
    uiObj.dbUpdHint.innerText = "Fail. NETWORK_ERROR.";
    uiObj.dbUpdClose.style.display = "inline-block";
    return;
  }

  let timeObj = await readTimeStampDl();
  if (!timeObj) timeObj = { updateTime: "0" };
  const milliSec = timeObj.updateTime;
  const passedTime = Date.now() - milliSec;
  if (passedTime < waitTime) {
    const timeDenied = waitTime - passedTime;
    const timeLeft = convertToDays(timeDenied);
    const msgTimeLeft = `You have to wait  ${timeLeft.days} days ${timeLeft.hours} h : ${timeLeft.minutes} min`;

    uiObj.dbUpdHead.innerText = msgTimeLeft;
    uiObj.dbUpdClose.style.display = "inline-block";
    return;
  }

  uiObj.dbUpdHead.innerText = "Check server is online.";
  uiObj.dbUpdHint.innerText = "";
  const isAlive = await isUrlAlive(updateUrl);
  if (!isAlive) {
    uiObj.dbUpdHint.innerText = "Fail. No response.";
    uiObj.dbUpdClose.style.display = "inline-block";
    return;
  }

  uiObj.dbUpdHead.innerText = "Receive latest public database.";
  uiObj.dbUpdHint.innerText = "Server: " + dbSrvUrl;

  const remoteJson = await downloadRemoteJson(updateUrl, uiObj);
  if (remoteJson === false) {
    uiObj.dbUpdHint.innerText = "Fail. Unknown error.";
    uiObj.dbUpdClose.style.display = "inline-block";
    return; // explicit false, else JSON for Indexed DB
  }

  await writeTimeStampDl();

  await writeToObjStore(remoteJson);
  uiObj.dbUpdHead.innerText = "";
  uiObj.dbUpdHint.innerText = "";
  uiObj.dbUpdInfoBlock.innerText = "Reload the app to activate the changes.";
  uiObj.dbUpdClose.style.display = "inline-block";
}

function convertToDays(milliSeconds) {
  let days = Math.floor(milliSeconds / (86400 * 1000));
  milliSeconds -= days * (86400 * 1000);
  let hours = Math.floor(milliSeconds / (60 * 60 * 1000));
  milliSeconds -= hours * (60 * 60 * 1000);
  let minutes = Math.floor(milliSeconds / (60 * 1000));
  return {
    days,
    hours,
    minutes,
  };
}

function msToTime(duration) {
  const milliseconds = parseInt((duration % 1000) / 100);
  let seconds = parseInt((duration / 1000) % 60);
  let minutes = parseInt((duration / (1000 * 60)) % 60);
  let hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}