// publicDbCom.js
"use strict";
/**
 * Apache License Version 2.0
 * Text can be found in the root directory of the Vanga repository.
 */

import { recMsg } from "./messages.js";
import { metaData } from "../central.js";
import { isUrlAlive } from "./streamDetect.js";
import { shuffleArray, sleep, getRandomIntInclusive } from "../uiHelper.js";
import { getIdbValue, setIdbValue } from "../database/idbSetGetValues.js";
import {
  fetchOpt,
  radioBrowserInfoDict, // same format as in response.json()
  nameSrvRadioBrowserInfo,
} from "../constants.js";

export {
  setSessionServer,
  getNameServer,
  submitStationVote,
  submitStationClicked,
  intervalGetOpenGridData,
  updateSingleStationJson,
};

/**
 * This is NOT related to normal station connects.
 * Transfer votes, clicks and new station datasets to the public database.
 * Clicker reads DB srv from mem.
 * Resolve a working public database server here.
 * Write URL or "NETWORK_ERROR" into closure.
 */

/**
 * Choose a random public DB server for this session,
 * so that not all user overwhelm a single server.
 * @returns
 */
function setSessionServer() {
  return new Promise((resolve, _) => {
    const wait = async () => {
      let db = "foo";
      // Try newest backup, all server were unavailable, but name server.
      const backupJson = await getDbSrvFromStore();

      if (backupJson === undefined) {
        // Use hardcoded from constants.js, all runs normal until now.
        const shuffledArray = await getServerArray(radioBrowserInfoDict);
        db = await setDbSrvToMem(shuffledArray);
      } else {
        const shuffledArray = await getServerArray(backupJson);
        db = await setDbSrvToMem(shuffledArray);
      }

      if (db === "NETWORK_ERROR") {
        // Use name server to set all new.
        await getNameServer();
      }

      resolve();
    };
    wait();
  });
}

function getNameServer() {
  // used in this module and update DB
  return new Promise((resolve, _) => {
    const wait = async () => {
      const isAlive = await isUrlAlive(nameSrvRadioBrowserInfo);
      if (isAlive) {
        const response = await fetch(nameSrvRadioBrowserInfo, fetchOpt);
        const jsonObj = await response.json();
        const shuffledArray = await getServerArray(jsonObj);
        await setDbSrvToMem(shuffledArray);
        await setDbSrvToStore(jsonObj, shuffledArray);
      }
      resolve();
    };
    wait();
  });
}

function getServerArray(jsonObj) {
  return new Promise((resovlve, _) => {
    const wait = async () => {
      const srvArray = [];
      // Push full URLs into array; JSON has name: and ip: properties.
      jsonObj.forEach((dict) => {
        if (!srvArray.includes(dict.name)) srvArray.push(dict.name);
      });
      resovlve(await shuffleArray(srvArray)); // refac - testable
    };
    wait();
  });
}

function getDbSrvFromStore() {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const version = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: "radio_index_db",
      });
      // new radio 'objects' db, load at app start
      const jsonDict = await getIdbValue({
        dbName: "radio_index_db",
        dbVersion: version.dbVersion,
        objectStoreName: "db_downloads",
        id: "radio_browser_info_db_NS_JSON",
      }).catch(() => {
        const dct = {};
        dct["jsonObj"] = undefined;
        return dct;
      });
      resolve(jsonDict.jsonObj);
    };
    wait();
  });
}

function setDbSrvToStore(jsonObj, shuffledArray) {
  return new Promise((resolve, _) => {
    const wait = async () => {
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
          id: "radio_browser_info_db_server",
          dbServer: shuffledArray,
          updateTime: Date.now(),
        },
      });
      await setIdbValue({
        dbName: "radio_index_db",
        dbVersion: version.dbVersion,
        objectStoreName: "db_downloads",
        data: {
          id: "radio_browser_info_db_NS_JSON",
          jsonObj: jsonObj,
          updateTime: Date.now(),
        },
      });
      resolve();
    };
    wait();
  });
}

/**
 * Reveal a working DB server from array.
 * @param {*} shuffledArray
 * @returns
 */
function setDbSrvToMem(shuffledArray) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      let dbSrvHostname = false;
      const checkContenType = false;

      for (const hostname of shuffledArray) {
        const url = "https://".concat(hostname);
        const isAvail = await isUrlAlive(url, checkContenType);
        if (isAvail) {
          dbSrvHostname = hostname;
          break;
        }
      }

      if (dbSrvHostname !== false)
        metaData.set()["radioBrowserInfoUrl"] = dbSrvHostname; // de1.api.radio-browser.info
      if (dbSrvHostname === false)
        metaData.set()["radioBrowserInfoUrl"] = "NETWORK_ERROR";

      resolve(dbSrvHostname); // test random
    };
    wait();
  });
}

/**
 * Called by submitStationClicked().
 * Increase the click count of a station by one.
 * Wait time for IP is 24h for each clicked station.
 * @param {string} stationuuid
 * @param {string} radioName
 */
async function postStationClick(stationuuid, radioName) {
  // POST, get JSON .../json/url/stationuuid
  // {"ok": "true","message": "retrieved station url",
  //   "stationuuid": "9617a958-0601-11e8-ae97-52543be04c81",
  //   "name": "Station name","url": "http://this.is.an.url"}
  return new Promise((resolve, _) => {
    const wait = async () => {
      if (stationuuid === undefined || stationuuid.includes("vanga-custom-")) {
        resolve();
        return;
      }

      const dbSrvUrl = metaData.get()["radioBrowserInfoUrl"];
      const updateUrl = "https://" + dbSrvUrl + "/json/url/" + stationuuid;
      fetchOpt.method = "POST";
      const response = await fetch(updateUrl, fetchOpt);
      const jsonSuccess = await response.json();

      if (jsonSuccess === undefined || jsonSuccess.ok === false) {
        recMsg([
          "fail click count ::",
          "radio-browser.info",
          radioName,
          stationuuid,
        ]);
        resolve(false);
      } else {
        recMsg([
          "Click OK (24h, first) for",
          jsonSuccess.name,
          jsonSuccess.stationuuid,
        ]);
        resolve(jsonSuccess.ok);
      }
    };
    wait();
  });
}

/**
 * Add one click for the station in the public database.
 * in rec in radioOperation.js, play in createRadioListener.js
 * @param {string} stationName
 * @returns
 */
function submitStationClicked(stationuuid, stationName) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      // Ask user setting if should send the station uuid.
      const sendStationId = await askSendStationId();
      if (sendStationId) {
        // write one click for the radio in the public db
        await postStationClick(stationuuid, stationName);
      }

      resolve();
    };
    wait();
  });
}

/**
 * Increase the vote count of a station by one.
 * Wait time for IP is 24h. Same station vote is NOT 10min as in info. refac
 * @param {string} stationuuid
 * @param {string} stationName
 */
async function postStationVote(stationuuid, stationName) {
  // POST, get JSON .../json/vote/stationuuid
  // {"ok": true,"message": "voted for station successfully"}
  return new Promise((resolve, _) => {
    const wait = async () => {
      const dbSrvUrl = metaData.get()["radioBrowserInfoUrl"];
      const updateUrl = "https://" + dbSrvUrl + "/json/vote/" + stationuuid;
      fetchOpt.method = "POST";
      const response = await fetch(updateUrl, fetchOpt);
      const jsonSuccess = await response.json();

      if (jsonSuccess === undefined || jsonSuccess.ok === false) {
        recMsg(["fail :: wait 30 min. for same station vote.", stationName]);
        resolve(false);
      } else {
        recMsg(["Vote count OK for ", stationName]);
        resolve(jsonSuccess.ok);
      }
    };
    wait();
  });
}

function submitStationVote(stationuuid, stationName) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      // should write/read time stamp in/from store
      if (stationuuid !== undefined && stationuuid !== "") {
        // write one click for the radio in the public db
        await postStationVote(stationuuid, stationName);
      }
      resolve();
    };
    wait();
  });
}

async function intervalGetOpenGridData() {
  const sleepTime = 5000;
  const openGrids = metaData.get().buildStationIds; // array of stationuuid 's
  if (openGrids === undefined || openGrids.length === 0) return;

  for (const station of openGrids) {
    await updateSingleStationJson(station);
    await sleep(sleepTime);
  }
}

/**
 * Needs a ticket to fix POST list of uuid comma separated.
 * at radio-browser.info, git repo
 *
 * Request vote and click data from public DB.
 * @param {string} station stationuuid
 * @returns
 */
function updateSingleStationJson(stationuuid) {
  // http://de1.api.radio-browser.info/json/stations/byuuid/82e7a00e-54ec-45ea-8ae7-8a2b459084c2
  return new Promise((resolve, _) => {
    const wait = async () => {
      // refac - also if 'isRecording'
      if (stationuuid === undefined || stationuuid.includes("vanga-custom-")) {
        resolve();
        return; // from async
      }
      // The votes badge is not shown but the title name.
      const isRecording = metaData.get().infoDb[stationuuid].isRecording;
      if (isRecording) {
        resolve();
        return;
      }

      const sendStationId = await askSendStationId();
      if (!sendStationId) return; // jumps out of async to outer resolve
      // Save ('too many requests'), if we don't run in a loop and a large grid list pops up.
      const sleepTime = getRandomIntInclusive(2, 6) * 100;
      const dbSrvUrl = metaData.get()["radioBrowserInfoUrl"];

      const updateUrl =
        "https://" + dbSrvUrl + "/json/stations/byuuid/" + stationuuid;

      await sleep(sleepTime);

      // Drop net errors.
      const response = await fetch(updateUrl, fetchOpt).catch(() => {
        return false;
      });
      if (response === false) return;

      // Drop JSON read errors.
      let json = undefined;
      try {
        json = await response.json();
      } catch (e) {
        return;
      }

      if (json === undefined || json[0] === undefined) {
        return;
      }
      // Try drop on malformed values. refac test on int
      let divVotesBadge = null;
      let jsonError = false;
      let votes = "";
      let clickcount = "";
      let clicktrend = "";
      try {
        // some 'test' store entries lack such an element
        divVotesBadge = document.getElementById("divVotesBadge_" + stationuuid);
        votes = json[0].votes;
        clickcount = json[0].clickcount;
        clicktrend = json[0].clicktrend;
      } catch (e) {
        jsonError = true;
        console.log("updateSingleStationJson->", stationuuid, e);
      }

      // Write to the badge
      if (divVotesBadge !== null && jsonError === false) {
        await updateVotesBadgeChange(
          stationuuid,
          divVotesBadge,
          votes,
          clickcount,
          clicktrend
        );
      }

      resolve();
    };
    wait();
  });
}

/**
 * Get local DB counts and compare it with public DB counts.
 * Update a badge so user can see if its vote, click was counted.
 * @param {*} stationuuid
 * @param {*} divVotesBadge
 * @param {*} votes
 * @param {*} clickcount
 * @param {*} clicktrend
 * @returns
 */
function updateVotesBadgeChange(
  stationuuid,
  divVotesBadge,
  votes,
  clickcount,
  clicktrend
) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      // Write counts from public DB to badge.
      divVotesBadge.innerText = "votes ".concat(
        votes,
        " clicks ",
        clickcount,
        " trend ",
        clicktrend
      );
      // Ask indexed DB (new), if fail ask mem DB (loaded from file or last update, old)
      const voteObj = await getLocalVoteCounts(stationuuid).catch((e) => {
        console.error("getLocalVoteCounts->await", e);
      });
      const vangaVotes = voteObj.votes;
      const vangaClicks = voteObj.clickcount;
      const vangaTrend = voteObj.clicktrend;

      let gotChanged = false;
      if (
        vangaVotes !== undefined &&
        vangaVotes !== "" &&
        vangaClicks !== undefined &&
        vangaClicks !== "" &&
        vangaTrend !== undefined &&
        vangaTrend !== ""
      ) {
        // Update indexed DB, update mem DB.
        await setLocalVoteCounts(
          stationuuid,
          votes,
          clickcount,
          clicktrend
        ).catch((e) => {
          console.error("setLocalVoteCounts->await", e);
        });

        // Change color of badge regarded to the changed item.

        if (vangaClicks !== clickcount) {
          divVotesBadge.style.color = "#49bbaa";
          divVotesBadge.style.border = "1px solid #49bbaa";
          gotChanged = true;
        }
        if (vangaTrend !== clicktrend) {
          //
        }
        // override all
        if (vangaVotes !== votes) {
          divVotesBadge.style.color = "#f7b733";
          divVotesBadge.style.border = "1px solid #f7b733";
          gotChanged = true;
        }
        if (!gotChanged) {
          divVotesBadge.style.border = "1px solid rgb(255,255,224, 0.6)";
        }
        setTimeout(() => {
          divVotesBadge.style.color = "lightyellow";
          divVotesBadge.style.backgroundColor = "transparent";
          divVotesBadge.style.border = "0px solid lightyellow";
        }, 30000);
      }
      resolve();
    };
    wait();
  });
}

function getLocalVoteCounts(stationuuid) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const db = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: "radio_index_db",
      }).catch((e) => {
        console.error("getLocalVoteCounts->get", e);
      });
      const storedVote = await getIdbValue({
        dbName: "radio_index_db",
        dbVersion: db.dbVersion,
        objectStoreName: "radio_browser_votes",
        id: stationuuid,
        // bulkInsert: true, // runs over the array of obj
      }).catch((e) => {
        return e; // error for if()
      });

      if (storedVote === "FAIL_NO_DATA_IN_STORE") {
        resolve({
          votes: metaData.get().infoDb[stationuuid].votes,
          clickcount: metaData.get().infoDb[stationuuid].clickcount,
          clicktrend: metaData.get().infoDb[stationuuid].clicktrend,
        });
      } else {
        resolve({
          votes: storedVote.votes,
          clickcount: storedVote.clickcount,
          clicktrend: storedVote.clicktrend,
        });
      }
    };
    wait();
  });
}

function setLocalVoteCounts(stationuuid, votes, clickcount, clicktrend) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      metaData.set().infoDb[stationuuid].votes = votes;
      metaData.set().infoDb[stationuuid].clickcount = clickcount;
      metaData.set().infoDb[stationuuid].clicktrend = clicktrend;

      const db = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: "radio_index_db",
      }).catch((e) => {
        console.error("setLocalVoteCounts->get", e);
      });

      await setIdbValue({
        dbName: "radio_index_db",
        dbVersion: db.dbVersion,
        objectStoreName: "radio_browser_votes",
        data: {
          id: stationuuid,
          name: metaData.get().infoDb[stationuuid].name,
          votes: votes,
          clickcount: clickcount,
          clicktrend: clicktrend,
        },
        // bulkInsert: true, // runs over the array of obj
      }).catch((e) => {
        console.error("setLocalVoteCounts->set", e);
        resolve(false);
      });

      resolve();
    };
    wait();
  });
}

/**
 * Ask user setting menu if we should send the station uuid.
 * @returns
 */
function askSendStationId() {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const sendObj = await getIdbValue({
        dbName: "app_db",
        dbVersion: 1,
        objectStoreName: "appSettings",
        id: "sendStationId",
      }).catch((e) => {
        return e;
      });
      // The key, val is not written yet if user keeps the button untouched. refac write at init
      if (sendObj === "FAIL_NO_DATA_IN_STORE" || sendObj.isActive === true) {
        resolve(true);
      } else resolve(false);
    };
    wait();
  });
}
