// streamActivity.js
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

import { recMsg } from "./messages.js";
import { metaData } from "../central.js";
import { switchRecorderState } from "../buildGrids/radioOperation.js";
export { createActivityPlayer, createActivityBar };

/**
 * Div used in listenBoxListener.js.
 */
function createActivityPlayer() {
  const parent = document.getElementById("divRowActivity");
  metaData.set()["createActivityPlayer"] = "";

  const gridItem = document.createElement("div");
  gridItem.id = "divActivityPlayer";
  gridItem.classList.add("grid-activity-group-item");
  gridItem.classList.add("cutOverflow");
  gridItem.innerHTML = "---";
  gridItem.style.color = "rgb(73, 187, 170)";
  parent.appendChild(gridItem);

  gridItem.addEventListener("click", () => {
    if (gridItem.innerHTML === "---") return;

    const audio = document.getElementById("audioWithControls");
    let stationName = gridItem.innerHTML;
    if (gridItem.innerHTML === "[ Pause ]") {
      stationName = metaData.get()["createActivityPlayer"];
      audio.muted = !audio.muted;
      recMsg(["play ", stationName]);
      gridItem.innerHTML = stationName;
      return;
    }
    metaData.set()["createActivityPlayer"] = stationName;
    recMsg(["pause ", stationName]);
    gridItem.innerHTML = "[ Pause ]";
    audio.muted = true;
  });
}

/**
 * Used in streamDataGet.js.
 * @param {*}
 * @returns
 */
function createActivityBar(stationuuid, stationName) {
  if (metaData.get()["activityBar"] === undefined)
    metaData.set()["activityBar"] = {};
  metaData.set()["activityBar"][stationName] = true;
  const parent = document.getElementById("divRowActivity");
  const gridItem = document.createElement("div");
  gridItem.setAttribute("id", "gridItemActivity_" + stationName);
  gridItem.classList.add("grid-activity-group-item");
  gridItem.classList.add("cutOverflow"); // cut overflow
  gridItem.innerHTML = stationName;
  gridItem.style.color = "rgb(247, 183, 51)";
  parent.appendChild(gridItem);

  gridItem.addEventListener("click", () => {
    switchRecorderState(stationuuid);
  });
  return gridItem;
}
