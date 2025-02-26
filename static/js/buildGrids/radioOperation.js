// radioOperation.js
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
import { sleep } from "../uiHelper.js";
import { metaData } from "../central.js";
import { runMetaAndRecord } from "../network/runner.js";
import { submitStationClicked } from "../network/publicDbCom.js";

export { switchRecorderState, removeAllRecorder, recBtnColorOn };

function switchRecorderState(stationuuid) {
  return new Promise((resolve, _) => {
    const stationObj = metaData.get().infoDb[stationuuid];
    const recBtn = document.getElementById("divBoxRecord_" + stationuuid);

    if (!stationObj.isRecording) {
      metaData.set().infoDb[stationuuid].isRecording = true; // rec listen to run further
      metaData.set().infoDb[stationuuid].isListening = true;

      submitStationClicked(stationuuid, stationObj.id);
      // stream meta (text) and stream byte data (uint8array s)
      runMetaAndRecord(stationuuid);
      recBtnColorOn(recBtn, true);
      document.getElementById("divVotesBadge_" + stationuuid).style.display =
        "none";
    } else {
      metaData.set().infoDb[stationuuid].isActive = false; // runner.js fetch prevent double
      metaData.set().infoDb[stationuuid].isRecording = false; // rec listen to stop
      metaData.set().infoDb[stationuuid].isListening = false;
      recBtnColorOn(recBtn, false);
      document.getElementById("divVotesBadge_" + stationuuid).style.display =
        "block";
    }
    resolve();
  });
}

function recBtnColorOn(recBtn, isActive) {
  if (isActive) {
    recBtn.style.color = "#222222"; // "#212631"
    recBtn.style.backgroundColor = "rgba(247, 183, 51, 0.8)"; // #f7b733  #fc4a1a  #49bbaa
  } else {
    recBtn.style.color = "lightyellow";
    recBtn.style.backgroundColor = "#313043";
  }
}

/**
 * refac shoud be module in menu folder
 * @param {*} o
 */
async function removeAllRecorder(o = {}) {
  const clicker = o.clicker;
  const clickerElem = document.getElementById(clicker);
  clickerElem.style.color = "rgba(170, 51, 106,1.0)";
  const clickerTxt = clickerElem.innerText;

  let count = 0;
  const promiseArray = Object.values(metaData.get().infoDb).map(
    (stationObj) => {
      return new Promise((resolve, _) => {
        const wait = async () => {
          if (stationObj.isRecording) {
            count++;
            await switchRecorderState(stationObj.stationuuid).catch((e) => {
              const msg =
                "catch->stop recorder" + clicker + stationObj.id + e.message;
              resolve(msg);
            });
          }
          resolve();
        };
        wait();
      });
    }
  );
  // 'undefined' is listed multiple times if the stopping was a success, else error
  const results = await Promise.all(promiseArray);

  const badResults = results.filter((result) => result instanceof Error);
  clickerElem.innerText = count + " done";
  clickerElem.style.color = "#49bbaa";
  if (badResults.length > 0) {
    clickerElem.innerText = badResults[0];
    clickerElem.style.backgroundColor = "rgba(170, 51, 106,1.0)";
  } else {
    await sleep(500);
    recMsg(["stop all recorder"]);
  }
  clickerElem.innerText = clickerTxt;
  clickerElem.style.color = "lightyellow";
}
