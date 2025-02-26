// uiSettings.js
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
import {
  setIdbValue,
  getIdbValue,
  getIndex,
} from "../database/idbSetGetValues.js";
import {
  createFeatureDivOutline,
  createFeatureDivSection,
} from "../buildGrids/uiSubmenu.js";

export { buildSettings };

function buildSettings() {
  createSettings({ parentDiv: "settings" }); // def in HTML
}

/**
 * Settings submenu.
 * @param {*} o
 * @returns
 */
function createSettings(o = {}) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const divOutlineChild = await createFeatureDivOutline({
        parentId: o.parentDiv,
        divOutline: "divSettingsOutline",
      });
      divOutlineChild.style.display = "block";

      // remove X that hide the div
      divOutlineChild.removeChild(divOutlineChild.firstElementChild);
      // create new one
      const spanClose = document.createElement("span");
      spanClose.classList.add("handCursor");
      spanClose.innerText = "✖";
      spanClose.style.textAlign = "right";
      spanClose.style.paddingRight = "14px";
      spanClose.style.display = "inline-block";
      spanClose.style.width = "100%";
      spanClose.style.backgroundColor = "#fc4a1a";
      spanClose.addEventListener("click", () => {
        document.getElementById("settings").style.display = "none";
      });
      divOutlineChild.appendChild(spanClose);
      // send clicks
      await createFeatureDivSection({
        parentId: "divSettingsOutline",
        childId: "divEnablePublicDbCom",
      });
      enablePublicDbCom({ parentId: "divEnablePublicDbCom" });
      // store incomplet files
      await createFeatureDivSection({
        parentId: "divSettingsOutline",
        childId: "divEnableIncomplete",
      });
      enableIncomplete({ parentId: "divEnableIncomplete" });
      // disable animations
      await createFeatureDivSection({
        parentId: "divSettingsOutline",
        childId: "enableAnimations",
      });
      enableAnimations({ parentId: "enableAnimations" });

      await restorePublicDbCom(); // img of switch element
      await restoreEnableAnimations();
      resolve();
    };
    wait();
  });
}

async function enableAnimations(o = {}) {
  return new Promise((resolve, _) => {
    const parentDiv = document.getElementById(o.parentId);
    const featureDiv = document.createElement("div");

    const spanDetails = document.createElement("span");
    spanDetails.style.display = "block";
    const detailsHtml =
      "<br>Fun reducer.<br>" + "--- Please reload the app.  ---";
    spanDetails.innerHTML =
      "<details><summary>animations</summary>" + detailsHtml + "</details>";

    const spanTxt = document.createElement("span");
    const imgSwitch = document.createElement("img");
    imgSwitch.id = "imgEnableAnimations";

    spanTxt.innerText = "Enable animations";
    spanTxt.style.verticalAlign = "14px";
    spanTxt.style.marginLeft = "10px";

    imgSwitch.src = "images/switch-on.svg";
    imgSwitch.style.width = "40px";

    imgSwitch.addEventListener("click", () => {
      const wait = async () => {
        const sendObj = await getIdbValue({
          dbName: "app_db",
          dbVersion: 1,
          objectStoreName: "appSettings",
          id: "enableAnimations",
        }).catch((e) => {
          return e;
        });
        if (
          sendObj === undefined ||
          sendObj === "FAIL_NO_DATA_IN_STORE" ||
          sendObj.isActive === true
        ) {
          imgSwitch.src = "images/switch-off.svg";
          // refac set val then set once
          setIdbValue({
            dbName: "app_db",
            dbVersion: 1,
            objectStoreName: "appSettings",
            data: { id: "enableAnimations", isActive: false },
          }).catch((e) => {
            console.log("enableAnimations->no DB yet", e);
          });
        } else {
          imgSwitch.src = "images/switch-on.svg";
          setIdbValue({
            dbName: "app_db",
            dbVersion: 1,
            objectStoreName: "appSettings",
            data: { id: "enableAnimations", isActive: true },
          }).catch((e) => {
            console.log("enableAnimations->no DB yet", e);
          });
        }
      };
      wait();
    });
    // img status after reload
    getIndex({ dbName: "app_db", store: "appSettings" }).then((appSet) => {
      Object.values(appSet).map((dict) => {
        if (dict.id === "enableAnimations") {
          if (dict.isActive) imgSwitch.src = "images/switch-on.svg";
        }
      });
    });

    parentDiv.appendChild(featureDiv);
    featureDiv.appendChild(spanDetails);
    featureDiv.appendChild(imgSwitch);
    featureDiv.appendChild(spanTxt);
    resolve();
  });
}

/**
 * Set correct image for switch.
 * @param {*} o
 * @returns
 */
function restoreEnableAnimations(o = {}) {
  return new Promise((resolve, _) => {
    const waitSettings = async () => {
      const sendObj = await getIdbValue({
        dbName: "app_db",
        dbVersion: 1,
        objectStoreName: "appSettings",
        id: "enableAnimations",
      }).catch((e) => {
        return e;
      });
      if (
        sendObj === undefined ||
        sendObj === "FAIL_NO_DATA_IN_STORE" ||
        sendObj.isActive === true
      ) {
        document.getElementById("imgEnableAnimations").src =
          "images/switch-on.svg";
      } else {
        document.getElementById("imgEnableAnimations").src =
          "images/switch-off.svg";
      }

      resolve();
    };
    waitSettings();
  });
}

/**
 * Set correct image for switch.
 * @param {*} o
 * @returns
 */
function restorePublicDbCom(o = {}) {
  return new Promise((resolve, _) => {
    const waitSettings = async () => {
      const sendObj = await getIdbValue({
        dbName: "app_db",
        dbVersion: 1,
        objectStoreName: "appSettings",
        id: "sendStationId",
      }).catch((e) => {
        return e;
      });
      if (
        sendObj === undefined ||
        sendObj === "FAIL_NO_DATA_IN_STORE" ||
        sendObj.isActive === true
      ) {
        document.getElementById("imgSendStationId").src =
          "images/switch-on.svg";
      } else {
        document.getElementById("imgSendStationId").src =
          "images/switch-off.svg";
      }

      resolve();
    };
    waitSettings();
  });
}

async function enablePublicDbCom(o = {}) {
  return new Promise((resolve, _) => {
    const parentDiv = document.getElementById(o.parentId);
    const featureDiv = document.createElement("div");

    const spanDetails = document.createElement("span");
    spanDetails.style.display = "block";
    const detailsHtml =
      "<br>Vanga sends the clicked station ID to the public database.<br>" +
      "Useful to create station charts. Vanga pulls charts every few minutes.";
    spanDetails.innerHTML =
      "<details><summary>send click</summary>" + detailsHtml + "</details>";

    const spanTxt = document.createElement("span");
    const imgSwitch = document.createElement("img");
    imgSwitch.id = "imgSendStationId";

    spanTxt.innerText = "Send clicked station ID to radio-browser.info";
    spanTxt.style.verticalAlign = "14px";
    spanTxt.style.marginLeft = "10px";

    imgSwitch.src = "images/switch-on.svg";
    imgSwitch.style.width = "40px";

    imgSwitch.addEventListener("click", () => {
      const wait = async () => {
        const sendObj = await getIdbValue({
          dbName: "app_db",
          dbVersion: 1,
          objectStoreName: "appSettings",
          id: "sendStationId",
        }).catch((e) => {
          return e;
        });
        if (
          sendObj === undefined ||
          sendObj === "FAIL_NO_DATA_IN_STORE" ||
          sendObj.isActive === true
        ) {
          imgSwitch.src = "images/switch-off.svg";
          setIdbValue({
            dbName: "app_db",
            dbVersion: 1,
            objectStoreName: "appSettings",
            data: { id: "sendStationId", isActive: false },
          }).catch((e) => {
            console.log("sendStationId->no DB yet", e);
          });
        } else {
          imgSwitch.src = "images/switch-on.svg";
          setIdbValue({
            dbName: "app_db",
            dbVersion: 1,
            objectStoreName: "appSettings",
            data: { id: "sendStationId", isActive: true },
          }).catch((e) => {
            console.log("sendStationId->no DB yet", e);
          });
        }
      };
      wait();
    });
    // img status after reload
    getIndex({ dbName: "app_db", store: "appSettings" }).then((appSet) => {
      Object.values(appSet).map((dict) => {
        if (dict.id === "sendStationId") {
          if (dict.isActive) imgSwitch.src = "images/switch-on.svg";
        }
      });
    });

    parentDiv.appendChild(featureDiv);
    featureDiv.appendChild(spanDetails);
    featureDiv.appendChild(imgSwitch);
    featureDiv.appendChild(spanTxt);
    resolve();
  });
}

async function enableIncomplete(o = {}) {
  return new Promise((resolve, _) => {
    const parentDiv = document.getElementById(o.parentId);
    const featureDiv = document.createElement("div");

    const spanFileDetails = document.createElement("span");
    spanFileDetails.style.display = "block";
    const detailsHtml =
      "<br>Some radios show always the same text or none at all.<br>" +
      "--- Please reload the app.  ---";
    spanFileDetails.innerHTML =
      "<details><summary>store incomplete</summary>" +
      detailsHtml +
      "</details>";

    const spanFincompleteTxt = document.createElement("span");
    const imgFileIncomplete = document.createElement("img");
    imgFileIncomplete.setAttribute("id", "imgFileIncomplete");
    spanFincompleteTxt.dataset.shown = "false";
    spanFincompleteTxt.innerText =
      "Save incomplete, nameless files. Stop dumps file.";
    spanFincompleteTxt.style.verticalAlign = "14px";
    spanFincompleteTxt.style.marginLeft = "10px";

    imgFileIncomplete.src = "images/switch-off.svg";
    imgFileIncomplete.style.width = "40px";

    imgFileIncomplete.addEventListener("click", () => {
      if (spanFincompleteTxt.dataset.shown === "true") {
        spanFincompleteTxt.dataset.shown = false;
        imgFileIncomplete.src = "images/switch-off.svg";
        setIdbValue({
          dbName: "app_db",
          dbVersion: 1,
          objectStoreName: "appSettings",
          data: { id: "fileIncomplete", isActive: false },
        }).catch((e) => {
          console.log("fileIncomplete->no DB yet", e);
        });
      } else {
        spanFincompleteTxt.dataset.shown = true;
        imgFileIncomplete.src = "images/switch-on.svg";
        setIdbValue({
          dbName: "app_db",
          dbVersion: 1,
          objectStoreName: "appSettings",
          data: { id: "fileIncomplete", isActive: true },
        }).catch((e) => {
          console.log("fileIncomplete->no DB yet", e);
        });
      }
    });
    // img status after reload
    const appSet = getIndex({ dbName: "app_db", store: "appSettings" }).then(
      (appSet) => {
        Object.values(appSet).map((dict) => {
          if (dict.id === "fileIncomplete") {
            if (dict.isActive) imgFileIncomplete.src = "images/switch-on.svg";
          }
        });
      }
    );

    parentDiv.appendChild(featureDiv);
    featureDiv.appendChild(spanFileDetails);
    featureDiv.appendChild(imgFileIncomplete);
    featureDiv.appendChild(spanFincompleteTxt);
    resolve();
  });
}
