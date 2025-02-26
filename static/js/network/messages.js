// messages.js
"use strict";
/**
 *  This file is part of Vanga.
 *  Vange is published to be a stand alone client for public radio and
 *  TV station URL databases. The cached DB copy can be used also if
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
export {
  recMsg,
  Queue,
  createLoaderMessage,
  waitMsgContainer,
  accessBlock,
  accessAllow,
  unlimitedStorageContainer,
  threadOverloadContainer,
};

/**
 * streamMetaGet.js has an outcommented fun
 * to rebuild the original chunk size.
 * This is the prerequisite to cleanup the meta
 * data stream from text (dict start at byte ...) at all.
 */
class Queue {
  constructor() {
    this.queue = [];
    this.len = 0; // always start zero, in Bytes
  }

  enqueue(element) {
    this.queue.push(element);
    return this.queue;
  }

  dequeue() {
    return this.queue.shift();
  }

  pop() {
    this.calcLength({ minus: this.queue[this.queue.length - 1] });
    return this.queue.pop();
  }
  peekHead() {
    return this.queue[0];
  }

  peekTail() {
    return this.queue[this.queue.length - 1];
  }

  lenHead() {
    // if this crashes, we have pb in while stream read, chunk size
    return this.queue[0].length;
  }

  lenTail() {
    return this.queue[this.queue.length - 1].length;
  }

  reverse() {
    return this.queue.reverse();
  }

  delete() {
    this.queue.length = 0;
    return this.queue;
  }

  calcLength(options = {}) {
    this.len = 0;
    for (const element of this.queue) {
      try {
        this.len += element.length;
      } catch (e) {
        return 0;
      }
    }
    if (options.minusLen !== undefined) this.len -= options.minus;
    if (options.plusLen !== undefined) this.len += options.plus;
    return this.len;
  }
}

function recMsg(msgList) {
  // created in uiReport.js loop
  const reportConsole_0 = document.getElementById("reportConsole_0");
  const reportConsole_1 = document.getElementById("reportConsole_1");
  const reportConsole_2 = document.getElementById("reportConsole_2");
  const reportConsole_3 = document.getElementById("reportConsole_3");
  const reportConsole_4 = document.getElementById("reportConsole_4");
  const reportConsole_5 = document.getElementById("reportConsole_5");
  const reportConsole_6 = document.getElementById("reportConsole_6");
  const reportConsole_7 = document.getElementById("reportConsole_7");
  const reportConsole_8 = document.getElementById("reportConsole_8");
  const reportConsole_9 = document.getElementById("reportConsole_9");

  const msgBox = [
    reportConsole_0, // placeholder
    reportConsole_1,
    reportConsole_2,
    reportConsole_3,
    reportConsole_4,
    reportConsole_5,
    reportConsole_6,
    reportConsole_7,
    reportConsole_8,
    reportConsole_9,
  ];
  try {
    msgBox[9].innerHTML = msgBox[8].innerHTML;
    msgBox[8].innerHTML = msgBox[7].innerHTML;
    msgBox[7].innerHTML = msgBox[6].innerHTML;
    msgBox[6].innerHTML = msgBox[5].innerHTML;
    msgBox[5].innerHTML = msgBox[4].innerHTML;
    msgBox[4].innerHTML = msgBox[3].innerHTML;
    msgBox[3].innerHTML = msgBox[2].innerHTML;
    msgBox[2].innerHTML = msgBox[1].innerHTML;
    msgBox[1].innerHTML = msgBox[0].innerHTML;
  } catch (e) {
    console.error("recMsg->", msgList, e);
  }

  const txt = msgList.join(",");
  let spanClass = "spanLogMessage"; // style.css
  if (txt.includes("::")) spanClass = "spanLogWarning";
  if (txt.includes("skip ,")) spanClass = "spanLogSkip";
  if (txt.includes("write ,")) spanClass = "spanLogWrite";
  if (txt.includes("write DB,")) spanClass = "spanLogWrite";
  if (txt.includes("skip-blacklisted  ,")) spanClass = "spanLogBlacklisted";
  if (txt.includes("Baba Vanga")) spanClass = "spanReportConsoleVanga";

  const htmlMsg = "<span class=" + spanClass + ">" + txt + "</span>";
  reportConsole_0.innerHTML = htmlMsg;

  if (metaData.get()["logHistory"] === undefined) {
    metaData.set()["logHistory"] = [];
  }
  // log history available under menu settings
  metaData.set()["logHistory"].push(htmlMsg);
}

function createLoaderMessage() {
  const divRowLoaderMsg = document.getElementById("divRowLoaderMsg");
  const divLMsg = document.createElement("divLoaderMsg");
  const spanTxt = document.createElement("span");
  spanTxt.setAttribute("id", "loaderMsg");
  divRowLoaderMsg.appendChild(divLMsg);
  divLMsg.appendChild(spanTxt);

  divLMsg.style.position = "absolute";
  divLMsg.style.marginTop = "-35px";

  spanTxt.style.display = "none";
  spanTxt.style.fontSize = "100%";
  spanTxt.style.color = "tomato";
  spanTxt.style.backgroundColor = "#303030";
  spanTxt.style.textAlign = "center";
  spanTxt.style.marginLeft = "18px";
}

/**
 * https://www.google.com/search?q=svg+exit&udm=2&tbs=rimg:CYdEYeItTdemYaawyiSAoEy0sgIAwAIA2AIA4AIA&hl=de&sa=X&ved=2ahUKEwjkyPy2x7uLAxUwcfEDHdelEdcQuIIBegQIABA8
 * @returns {Promise} container with msg and evt to remove blockAccess
 */
function threadOverloadContainer() {
  return new Promise((resolve, _) => {
    const blockAccess = document.getElementById("blockAccess");
    blockAccess.style.display = "block";
    const txtContainer = document.createElement("div");
    txtContainer.id = "vangaMainThreadOverload";
    txtContainer.style.position = "absolute"; // to move around
    txtContainer.innerHTML =
      "CPU overload prevention." +
      "<br><br> --- RECORD is active ---" +
      "<br><br>Access is blocked during recording - sorry &#129420;." +
      "<br>World related filter have to process a huge amount of data." +
      "<br>Full CPU usage will damage the recorder threads." +
      "<br><br>Please click to proceed. --> ";
    txtContainer.style.top = "20em";
    txtContainer.style.left = "1em";
    txtContainer.style.padding = "5px";
    txtContainer.style.fontFamily = "raleway";
    txtContainer.style.fontSize = "100%";
    txtContainer.style.fontWeight = "500";
    txtContainer.style.color = "#47b3a4";
    txtContainer.style.border = "solid 1px #ff3d00";
    blockAccess.appendChild(txtContainer);

    txtContainer.addEventListener("click", () => {
      txtContainer.remove();
      blockAccess.style.display = "none";
    });
    resolve(txtContainer);
  });
}

/**
 *
 * @returns {Promise} container with msg
 * @example
 * const unlimStorage = await unlimitedStorageContainer();
 * await blockAccess.appendChild(unlimStorage);
 * await sleep(3000);
 * unlimStorage.remove();
 */
function unlimitedStorageContainer() {
  return new Promise((resolve, _) => {
    const txtContainer = document.createElement("div");
    txtContainer.id = "vangauUlimitedStorage";
    txtContainer.style.position = "absolute"; // to move around
    txtContainer.innerHTML =
      "No permanent storage -Object stores may be deleted by browser.";
    txtContainer.style.top = "4em";
    txtContainer.style.left = "1em";
    txtContainer.style.fontFamily = "raleway";
    txtContainer.style.fontSize = "110%";
    txtContainer.style.fontWeight = "500";
    txtContainer.style.color = "#47b3a4";
    resolve(txtContainer);
  });
}

/**
 *
 * @returns {Promise} container with loading.. msg
 * @example
 * const txtContainer = await waitMsgContainer();
 */
function waitMsgContainer() {
  return new Promise((resolve, _) => {
    const txtContainer = document.createElement("div");
    txtContainer.id = "vangaWaitMsg";
    txtContainer.style.position = "absolute"; // to move around
    txtContainer.innerHTML = "loading...";
    txtContainer.style.top = "4em";
    txtContainer.style.left = "1em";
    txtContainer.style.fontFamily = "raleway";
    txtContainer.style.fontSize = "300%";
    txtContainer.style.fontWeight = "600";
    txtContainer.style.color = "#47b3a4";
    resolve(txtContainer);
  });
}

function accessBlock() {
  return new Promise((resolve, _) => {
    const wait = async () => {
      blockAccess = document.getElementById("blockAccess");
      blockAccess.style.display = "block";
      blockAccess.style.opacity = "0.9";
      const txtContainer = await waitMsgContainer();
      blockAccess.appendChild(txtContainer);
      resolve();
    };
    wait();
  });
}

function accessAllow() {
  return new Promise((resolve, _) => {
    document.getElementById("blockAccess").style.display = "none";
    resolve();
  });
}
