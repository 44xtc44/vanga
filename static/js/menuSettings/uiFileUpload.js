// uiFileUpload.js
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
import { getIdbValue, setIdbValue } from "../database/idbSetGetValues.js";
import {
  stationDbCreate,
  dbRegisterStreamer,
} from "../network/streamDataGet.js";
import {
  createFeatureDivOutline,
  createFeatureDivSection,
} from "../buildGrids/uiSubmenu.js";

export { showFileUploadUi };

function showFileUploadUi() {
  return new Promise((resolve, _) => {
    const waitCreate = async () => {
      const parentId = "fixedPositionAnchor";
      const fileUploadOuter = await createFileUploadUiOuter({
        parentId: parentId,
        childId: "fileUploadOuter",
      });

      // remove X that hide the div
      fileUploadOuter.removeChild(fileUploadOuter.firstElementChild);
      document.getElementById("fixedPositionAnchor").style.height = "100%";
      // X must remove div
      const spanClose = document.createElement("span");
      spanClose.id = "fileUploadClose";
      spanClose.classList.add("handCursor");
      spanClose.innerText = "✖";
      spanClose.style.textAlign = "right";
      spanClose.style.paddingRight = "14px";
      spanClose.style.display = "inline-block";
      spanClose.style.width = "100%";
      spanClose.style.backgroundColor = "#fc4a1a";
      spanClose.addEventListener("click", () => {
        fileUploadOuter.remove();
      });
      fileUploadOuter.appendChild(spanClose);
      // caller enable
      spanClose.style.display = "block";

      const head = await createFeatureDivSection({
        parentId: "fileUploadOuter",
        childId: "fileUploadHead",
      });
      fileUploadHead(head);

      const hint = await createFeatureDivSection({
        parentId: "fileUploadOuter",
        childId: "fileUploadHint",
      });
      fileUploadHint(hint);

      const infoBlock = await createFeatureDivSection({
        parentId: "fileUploadOuter",
        childId: "fileUploadInfoBlock",
      });
      infoBlock.style.overflow = "auto";
      fileUploadInfoBlock(infoBlock);

      resolve();
    };
    waitCreate();
  });
}
function createFileUploadUiOuter(o = {}) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      try {
        document.getElementById(o.childId).remove();
      } catch (e) {}
      const divOutline = await createFeatureDivOutline({
        parentId: o.parentId,
        divOutline: o.childId,
      });
      divOutline.classList.add("column500");
      divOutline.style.width = "500px";
      divOutline.style.display = "block";
      resolve(divOutline);
    };
    wait();
  });
}

function fileUploadHead(divHead) {
  divHead.innerText = "Choose multiple files to upload to the database.";
}
function fileUploadHint(divHint) {
  divHint.innerHTML = "Files will be available for a playlist.";
}
/**
 * The magic happens here.
 * @param {*} divInfoBlock
 * @returns
 */
function fileUploadInfoBlock(divInfoBlock) {
  return new Promise((resolve, _) => {
    // file selecetor
    const fileUpload = document.createElement("input");
    const divFileUpload = document.createElement("div");
    fileUpload.setAttribute("type", "file");
    fileUpload.setAttribute("name", "imgs[]");
    fileUpload.setAttribute("multiple", "");
    fileUpload.addEventListener("change", () => {
      uploadFilesDb(fileUpload, divFileUpload); // fileUpload.files stored in the input element
    });
    divInfoBlock.appendChild(divFileUpload),
      divFileUpload.appendChild(fileUpload);
    resolve();
  });
}

function uploadFilesDb(fileUpload, divFileUpload) {
  return new Promise((resolve, _) => {
    const files = [...fileUpload.files];
    const statusBar = document.createElement("div");
    statusBar.style.backgroundColor = "#6261cb";
    statusBar.style.boxShadow = "rgb(81, 48, 69) 0px 0px 10px inset";
    statusBar.style.height = "20px";
    statusBar.style.width = "0%";
    divFileUpload.appendChild(statusBar);

    const rowCount = files.length;

    const wait = async () => {
      const stationuuid = "affe1234-abcd-0000-0000-000000000001"
      await stationDbCreate(stationuuid);
      await dbRegisterStreamer(stationuuid, "upload_dev");
      await sleep(1000);

      const appVersion = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: "app_db",
      });
      await setIdbValue({
        dbName: "app_db",
        dbVersion: appVersion.dbVersion,
        objectStoreName: "uuid_name_dl",
        data: {
          id: stationuuid,
          name: "upload_dev",
        },
      }).catch((e) => {
        console.error("fileUpload->ul", e);
      });

      const ulVersion = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: "app_db",
      });

      for (const [index, file] of files.entries()) {
        await setIdbValue({
          dbName: stationuuid,
          dbVersion: ulVersion.dbVersion,
          objectStoreName: "content_blobs",
          data: {
            id: file.name,
            blob: file,
            size: file.size,
            type: file.type,
          },
        }).catch((e) => {
          console.error("fileUpload->blobs", e);
        });
        await setIdbValue({
          dbName: stationuuid,
          dbVersion: ulVersion.dbVersion,
          objectStoreName: "blacklist_names",
          data: {
            id: file.name,
          },
        }).catch((e) => {
          console.error("fileUpload->bl", e);
        });
        statusBar.style.width = ((index + 1) / rowCount) * 100 + "%";
      }
      await sleep(1000);
      statusBar.remove();
      resolve();
    };
    wait();
  });
}
