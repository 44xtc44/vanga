// streamDataGet.js
"use strict";
/**
 * Apache License Version 2.0
 * Text can be found in the root directory of the Vanga repository.
 */

// https://stackoverflow.com/questions/7255719/
// downloading-binary-data-using-xmlhttprequest-without-overridemimetype^
// read stream as blob
// https://reference.codeproject.com/dom/xmlhttprequest/sending_and_receiving_binary_data
// https://stackoverflow.com/questions/58088831/arraybuffer-has-no-data-when-using-the-incoming-data
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/captureStream
// https://clicktorelease.com/blog/loading-sounds-faster-using-html5-web-audio-api/
// https://gist.github.com/niko/2a1d7b2d109ebe7f7ca2f860c3505ef0   metadata within the stream from an icecast server
// file write no URL https://stackoverflow.com/questions/6076047/create-a-download-link-from-a-blob-url

import { recMsg } from "./messages.js";
import { metaData } from "../central.js";
import {
  getIdbValue,
  setIdbValue,
  setPropIdb,
  getPropIdb,
  delPropIdb,
} from "../database/idbSetGetValues.js";
import { writeBlacklist } from "../fileStorage/blacklist.js";
import { createIndexedDb, logAllDbVersions } from "../database/idbInitDb.js";
import { writeFileLocal, storeBlobAsObj } from "../fileStorage/fileStorage.js";
import { createActivityBar } from "./streamActivity.js";

export { consumeStream, stationDbCreate, dbRegisterStreamer };

/**
 * Get stream to store.
 * @param {*} options
 *
 * @returns
 */
async function consumeStream(o = {}) {
  let stationuuid = o.stationuuid;
  const stationObj = metaData.get().infoDb[stationuuid];
  const stationName = stationObj.name;
  let bitRate = stationObj.bitRate;
  if (bitRate === null) bitRate = "";
  let targetLen = stationObj.chunkSize;
  if (targetLen === undefined || targetLen === null) targetLen = 16000;

  const streamReader = o.streamReader;
  const contentType = o.contentType;
  const abortController = o.abortController;

  let chunkArray = [];
  let count = 0;
  const noTitleMsg = "no_title";
  let titleToWrite = noTitleMsg;

  if (stationuuid === undefined) {
    stationuuid = "vanga-custom-" + stationName;
  }

  const prep = await prepDownload(stationuuid, stationName);
  const dumpIncomplete = prep.dumpIncomplete;
  const activityDiv = prep.activityDiv;

  while (true) {
    let nextChunk = await streamReader.read(targetLen); // chumk can be less than targeLen!
    if (nextChunk.done) {
      recMsg(["stream abort ::, connect rejected", stationName]);
      break; // radio killed our connection
    }

    let chunk = nextChunk.value;
    chunkArray.push(chunk);

    // refac if worker communication, check 'downloads' store or pub DB store, if ready
    const titleInDisplay = metaData.get().infoDb[stationuuid].textMsg;
    if (titleToWrite !== titleInDisplay && titleInDisplay !== "") {
      if (titleToWrite !== noTitleMsg && count > 1) {
        const isBlacklisted = await writeBlacklist(stationuuid, titleToWrite);
        if (isBlacklisted) {
          // refac if worker communication, check 'downloads' store or pub DB store, if ready
          recMsg(["skip-blacklisted  ", stationName, titleToWrite]);
        }
        if (!isBlacklisted) {
          await storeBlobAsObj({
            chunkArray: chunkArray,
            contentType: contentType,
            title: titleToWrite,
            bitRate: bitRate,
            radioName: stationName,
            stationuuid: stationuuid,
          });
        }

        chunkArray = [];
      } else {
        // skip predefined dummy and incomplete first file,
        recMsg(["skip ", stationName, titleToWrite]);
      }
      titleToWrite = titleInDisplay;
      count += 1;
    }
    chunk = null;
    nextChunk = null;

    // refac if worker communication, check 'downloads' store or pub DB store, if ready
    if (!metaData.get().infoDb[stationuuid].isRecording) {
      activityDiv.remove();
      abortController.abort();
      deleteAsDownloder(stationuuid);
      // refac if worker communication, check 'downloads' store or pub DB store, if ready
      recMsg(["exit stream ", stationName]);
      if (dumpIncomplete.isActive === true) {
        // forced in 'appsettings' 'fileIncomplete' menu
        // refac if worker communication, dl is impossible from worker (DOM elem)
        // better write to blob store
        await writeFileLocal({
          chunkArray: chunkArray,
          contentType: contentType,
          title: "_incomplete_" + Date.now(),
          bitRate: bitRate,
          radioName: stationName,
        });
        chunkArray = [];
        break;
      }
    }
  }
}

function prepDownload(stationuuid, stationName) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const created = await stationDbCreate(stationuuid);
      if (!created) {
        // refac if worker communication, mainthread writes
        recMsg(["stream abort ::, DB creation fail", stationName]);
        return;
      } else {
        // Permanent store uuid, name for backup of blackists.
        await dbRegisterStreamer(stationuuid, stationName);
        // Thread communication and UI messages via object store.
        await registerAsDownloder(stationuuid);
        //    Msg write now possible.
      }
      // refac if worker communication, mainthread writes
      recMsg(["stream ", stationName]);
      const dumpIncomplete = await getDumpIncompleteFiles(); // is setting active
      // refac if worker communication, mainthread loop check 'downloads' store, put in RUNNER
      const activityDiv = createActivityBar(stationuuid, stationName); // rec name under monitor
      resolve({ dumpIncomplete: dumpIncomplete, activityDiv: activityDiv });
    };
    wait();
  });
}

/**
 * Create a station DB for file blobs and blacklists if not exist.
 * @param {string} stationuuid
 * @returns {Promise} ok
 */
function stationDbCreate(stationuuid) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      // Get an object or transaction error from version DB. (all DB ver logged)
      const created = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: stationuuid,
      }).catch((e) => {
        return e;
      });

      if (created === "FAIL_NO_DATA_IN_STORE") {
        // The two stores.
        const objStores = [
          {
            storeName: "blacklist_names",
            primaryKey: "id",
            indexNames: ["blacklist_namesIdx", "id"],
          },
          {
            storeName: "content_blobs",
            primaryKey: "id",
            indexNames: ["content_blobsIdx", "id"],
          },
        ];
        await createIndexedDb({
          dbName: stationuuid,
          dbVersion: 1,
          batchCreate: true,
          objStores: objStores,
        }).catch((e) => {
          console.error("stationDbCreate->", e);
          resolve(false);
        });
        // Write version of all DBs to 'versions_db' / 'dbVersions'.
        await logAllDbVersions();
        resolve(true); // db + stores created
      }
      resolve(true); // 'created' is an object, nothing to do
    };
    wait();
  });
}

/**
 * Register the station name with uuid to have all stream reader in an array.
 * Needed for backup, restore of blacklists.
 * @param {string} stationuuid
 * @param {string} station name
 * @returns {Promise} ok
 */
function dbRegisterStreamer(stationuuid, station) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const db = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: "app_db",
      }).catch((e) => {
        console.error("dbRegisterStreamer->get", e);
      });
      await setIdbValue({
        dbName: "app_db",
        dbVersion: db.dbVersion,
        objectStoreName: "uuid_name_dl",
        data: { id: stationuuid, name: station },
      }).catch((e) => {
        console.error("dbRegisterStreamer->set", e);
        resolve(false);
      });
      resolve(true);
    };
    wait();
  });
}

/**
 * ---> worker setup and call in RUNNER
 * Current downloader stations.
 * (A) Communication with other threads and
 * to write messages and current title to the UI.
 *
 * (B) blockAccess to 'World' huge data filter,
 * as long as threre is no separate process for download.
 * @param {string} stationuuid
 * @param {string} station name
 * @returns {Promise} ok
 */
function registerAsDownloder(stationuuid) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      await setPropIdb({
        idbDb: "app_db",
        idbStore: "downloader",
        idbData: metaData.get().infoDb[stationuuid], // whole object
      }).catch((e) => {
        console.error("registerAsDownloder->set", e);
        resolve(false);
      });
      resolve(true);
    };
    wait();
  });
}

/**
 * Current downloader stations.
 * Needed to blockAccess to 'World' huge data filter,
 * as long as threre is no separate process for network.
 * @param {string} stationuuid
 * @returns {Promise} ok
 */
function deleteAsDownloder(stationuuid) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      await delPropIdb({
        idbDb: "app_db",
        idbStore: "downloader",
        idbData: { id: stationuuid }, // omit if clearAll
        clearAll: false, // can also omit this prop
      }).catch((e) => {
        console.error("deleteAsDownloder->set", e);
        resolve(false);
      });
      resolve(true);
    };
    wait();
  });
}

/**
 * Ask if we should dump incomplete files.
 * @returns
 */
function getDumpIncompleteFiles() {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const dumpIncomplete = await getPropIdb({
        idbDb: "app_db",
        idbStore: "appSettings",
        idbId: "fileIncomplete",
      }).catch((e) => {
        return e; // transaction error, key not in store
      });
      resolve(dumpIncomplete);
    };
    wait();
  });
}
