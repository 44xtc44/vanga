// index.js
"use strict";
// https://www.gnu.org/licenses/#GPL software; rtf markdownn text
// https://www.gnu.org/licenses/fdl-1.3 documentation;
/**
 *  This file is part of Vanga.
 *  Vange is published to be a Standalone Client for public radio and
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

/**
 * @author 44xtc44 (René Horn)
 * @version 1.0.0
 * @since 0.0.0
 * @license GPLv3 License (2024-2025), René Horn
 */
import { sleep } from "./uiHelper.js";
import { createUi } from "./ui.js";
import {
  createReportConsole,
  populateReportConsole,
} from "./logMonitor/uiReport.js";
// radio-info-browser
import { setSessionServer } from "./network/publicDbCom.js";
// db
import { delPropIdb } from "./database/idbSetGetValues.js";
import {
  createAppDb,
  createVersionDb,
  createRadioIdxDb, // Place to add public DBs and Favorites station objects
  // tests object store for dev; problem and playlist stations, needs fix refac.
  createDefaultRadios,
} from "./database/idbCreateDefaults.js";
import { logAllDbVersions } from "./database/idbInitDb.js";
// audio, animation
import { initEqualizer } from "./audioAnimation/equalizer.js";
import {
  prepAnimationMain,
  getAnimationStatus,
} from "./audioAnimation/animation.js";

import {
  createAudio,
  createMainAudioLine,
  connectAnalyserInit,
} from "./audioAnimation/audio.js";
import { runIntroAnimation } from "./audioAnimation/intro.js";
import { runDbLoader } from "./central.js";
import {
  waitMsgContainer,
  unlimitedStorageContainer,
} from "./network/messages.js";

import {
  createMenuBarAnim,
  reloaderLogo,
} from "./audioAnimation/menuBarAnimation.js";
import { createAppMenu } from "./menuSettings/uiHamburger.js";

const blockAccess = document.getElementById("blockAccess"); // canvas display block

window.addEventListener("load", () => {
  const wait = async () => {
    const isUnlimited = await askUnlimitedStorage();
    if (!isUnlimited) {
      // Add a message to 'blockAccess'.
      const unlimStorage = await unlimitedStorageContainer();
      await blockAccess.appendChild(unlimStorage);
      await sleep(3000);
      unlimStorage.remove();
      console.log("Object stores may be deleted by browser.");
    }
    await setupDbs();
    setupUi(); // audio, intro, DOM input elem values
    await pouplatepDbs();
    await setSessionServer(); // public DB API server for clicks and votes
    await createReportConsole(); // log monitor with red arrow
    blockAccess.style.display = "none"; // Remove input prevention canvas.
    await populateReportConsole(); // display sessionServer URL
    createAppMenu(); // wait report console to set evt app menu
    clearDownloaderStore(); // object in store blocks 'World' btn (CPU overload)
    // uploader
  };
  wait();
});

function setupUi() {
  return new Promise((resolve, _) => {
    const wait = async () => {
      // audio and animations
      await createAudio();
      const runAnimation = await getAnimationStatus();
      await sleep(200); // something wrong with status refac
      if (!runAnimation) {
        const loadMsg = await waitMsgContainer();
        await blockAccess.appendChild(loadMsg);

        await reloaderLogo(); // click reloads
        await createMainAudioLine();
        initEqualizer(); // switch EQ into the line, enables speaker
        createUi();
      } else {
        await connectAnalyserInit(); // lightning balls driver with sound
        await runIntroAnimation({ parentId: "blockAccess" });
        await createMainAudioLine(); // intro runs silent, else shocking user noise
        initEqualizer(); // enables speaker also

        await reloaderLogo();
        await createMenuBarAnim();
        await prepAnimationMain(); // Call any longrunning animation in this module.
        createUi();
      }

      resolve();
    };
    wait();
  });
}

function setupDbs() {
  return new Promise((resolve, _) => {
    const wait = async () => {
      // Most modules must read/writes local store during init.
      // DB creation in Main Thread, so no need for sophisticated
      // error treatments.
      await createVersionDb();
      await createAppDb();
      await createRadioIdxDb();
      await logAllDbVersions();
      resolve();
    };
    wait();
  });
}

function pouplatepDbs() {
  return new Promise((resolve, _) => {
    const wait = async () => {
      // Web worker, keep main thread CPU free for further heavy animations.
      // Will stuck a moment if the customised DB is loaded in Main Thread.
      // 'May' split DB load if the animation is bigger, or try ArrayBuffers transfer.
      // But Main Thread must convert fetch uint8Array to dictionary object. Benefit?
      // https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
      await runDbLoader(); // central.js loads objects into mem, yep 65mb for now
      resolve();
    };
    wait();
  });
}

/**
 * 'unlimitedStorage' can be set also in manifest.json 'permissions'.
 * If not allowed, broser may delete the indexed DB stores.
 * @returns {Promise} boolean true if allowed
 */
function askUnlimitedStorage() {
  return new Promise((resolve, _) => {
    // Persistent storage.
    if (navigator.storage && navigator.storage.persisted) {
      // unlimetedStorage feature detect, returns boolean
      // persisted() - marked as persisted, a popup waits in FF
      // persist() - permissions request
      navigator.storage.persisted().then((persisted) => {
        // console.log({ persisted });
        navigator.storage.persist().then((allowed) => {
          // console.log({ allowed });
          resolve(allowed);
        });
      });
    } else {
      resolve(false);
    }
  });
}

/**
 * Refuses to run in web worker - refac
 * @returns
 */
function clearDownloaderStore() {
  return new Promise((resolve, _) => {
    delPropIdb({
      idbDb: "app_db",
      idbStore: "downloader",
      clearAll: true,
    }).catch((e) => {
      console.error("clearDownloaderStore->del", e);
      resolve(false);
    });
    resolve(true);
  });
}
