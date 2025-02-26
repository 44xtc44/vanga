// uiReport.js
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

import { sleep } from "../uiHelper.js";
import { recMsg } from "../network/messages.js";
import { metaData } from "../central.js";

export { createReportConsole, populateReportConsole, setUploadEvtListener };

let arrowAanimationFrameCount = 0;
let arrowTop = 0;

/**
 * Used by recMsg() in messages.js
 */
function createReportConsole() {
  return new Promise((resolve, _) => {
    const divRowReport = document.getElementById("divRowReport");
    // line wrapper container
    const wrapper = document.createElement("div");
    wrapper.setAttribute("id", "wrapperReport");
    wrapper.style.position = "relative"; // keep divArrow in the wrapper boundaries
    wrapper.classList.add("wrapper");
    divRowReport.appendChild(wrapper);
    // red arrow
    const divArrow = document.createElement("div");
    divArrow.id = "divArrow";
    divArrow.style.position = "absolute"; // move within wrapper; top 0 to bottom 0
    divArrow.style.left = "-10px";
    divArrow.style.display = "none";

    const imgArrow = document.createElement("img");
    imgArrow.id = "imgArrow";
    imgArrow.src = "./images/red-arrow-icon.svg";
    imgArrow.style.width = "20px";
    divArrow.appendChild(imgArrow);
    wrapper.appendChild(divArrow);

    // report console lines
    const wait = async () => {
      for (let i = 9; i >= 0; i--) {
        const div = document.createElement("div");
        div.setAttribute("id", "reportConsole_" + i);
        div.style.position = "relative"; // can set symbol absolute
        div.classList.add("divReport");
        div.classList.add("noScroll");

        wrapper.appendChild(div);
      }
      resolve();
    };
    wait();
  });
}

function populateReportConsole() {
  return new Promise((resolve, _) => {
    let deer = "<img src='./images/deer-icon.svg' width=30px " +
    "style='position:absolute; top: -4px; margin-left: 10px;'>";

    recMsg([":Baba Vanga's dark prophecies"]);
    recMsg([":'Vanga' will reload the app in the future."]);
    recMsg([":Aviation Org. will use 3-letter codes."]);
    recMsg([":Menu will allow to dump downloads."]);
    recMsg([":Blacklists will be restored."]);
    recMsg([":A station will fail."]);
    recMsg([":"]);
    recMsg([
      ":Public database <a href='https://www.radio-browser.info' target='_blank'>radio-browser.info</a>",
    ]);
    recMsg([":Voting server " + metaData.get().radioBrowserInfoUrl]);
    recMsg([":Cheers " + deer]);

    runArrowAnimation();
    resolve();
  });
}

function runArrowAnimation() {
  arrowAanimationFrameCount = requestAnimationFrame(animateArrow);
}

/**
 * Move the red arrow downwards animation.
 */
function animateArrow() {
  // console.log("arrowAnimation->", arrowTop);
  const divArrow = document.getElementById("divArrow");
  divArrow.style.display = "block";
  const rconZero = document.getElementById("reportConsole_0");
  const divArrowTop = divArrow.getBoundingClientRect().top;
  const rconZeroTop = rconZero.getBoundingClientRect().top;

  divArrow.style.top = arrowTop.toString() + "px";

  if (divArrowTop > rconZeroTop) {
    // timeout, not simply fun call, else fail in the interpreter black box
    setTimeout(() => {
      cancelAnimationFrame(arrowAanimationFrameCount);
    }, 0);
  }
  arrowTop++;
  arrowAanimationFrameCount = requestAnimationFrame(animateArrow);
}

/**
 * Report incident Android mulit-download skips files.
 * @returns
 */
function setUploadEvtListener() {
  return new Promise((resolve, _) => {
    metaData.set()["upload_dev"] = 1;
    const imgArrow = document.getElementById("imgArrow");
    const menuUploadDev = document.getElementById("liUpload");
    imgArrow.addEventListener("click", () => {
      let count = metaData.get()["upload_dev"];
      if (count === 7) {
        menuUploadDev.style.display = "inline-block";
        recMsg([":: upload menu available"]);
      }
      count += 1;
      metaData.set()["upload_dev"] = count;
    });
    resolve();
  });
}
