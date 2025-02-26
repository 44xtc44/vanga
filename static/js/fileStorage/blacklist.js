// blacklist.js
// https://stackoverflow.com/questions/4374822/remove-all-special-characters-with-regexp
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
import {
  getIdbValue,
  setIdbValue,
  getIndex,
} from "../database/idbSetGetValues.js";

export { writeBlacklist, loadBlacklist, loadOneBlacklist };

/**
 * At app start and blacklist restore and quick reload.
 * Load all avaliable blacklist object stores into mem.
 * @returns
 */
function loadBlacklist() {
  return new Promise((resolve, _) => {
    metaData.set()["blacklists"] = {};

    const wait = async () => {
      const stationArray = await getIndex({
        dbName: "app_db",
        store: "uuid_name_dl",
      }).catch((e) => {
        console.error("loadBlacklist->app_db", e);
      });
      for (const db of stationArray) {
        await loadOneBlacklist(db.id);
      }
      resolve();
    };
    wait();
  });
}

/**
 * Load blacklist objectStore into mem.
 * @param {string} stationuuid stationuuid
 * @returns {Promise} resolved
 */
function loadOneBlacklist(stationuuid) {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const blacklkistArray = await getIndex({
        dbName: stationuuid,
        store: "blacklist_names",
      }).catch((e) => {
        console.error("loadBlacklist->db", e);
      });
      metaData.set()["blacklists"][stationuuid] = {};
      metaData.set()["blacklists"][stationuuid] = blacklkistArray;
      resolve();
    };
    wait();
  });
}

/**
 * Write to blacklist in mem and call write to object store.
 * @param {*} stationuuid
 * @param {*} title
 * @returns
 */
function writeBlacklist(stationuuid, title) {
  return new Promise((resolve, _) => {
    let titleArray = metaData.get().blacklists[stationuuid];
    if (titleArray === undefined) {
      titleArray = [];
      metaData.set().blacklists[stationuuid] = [];
    }
    const waitUpdate = async () => {
      let isBlacklisted = false;
      // search title in mem loaded list
      await titleArray.map((titleObj) => {
        if (titleObj.id === title) isBlacklisted = true;
      });

      // append title in mem list and object store
      if (!isBlacklisted) {
        metaData.set().blacklists[stationuuid].push({ id: title });
        await updBlacklistStore({ stationuuid: stationuuid, title: title });
      }

      resolve(isBlacklisted);
    };
    waitUpdate();
  });
}

/**
 * Write to object store.
 * @param {*} o
 * @returns
 */
function updBlacklistStore(o = {}) {
  return new Promise((resolve, _) => {
    const title = o.title;
    const stationuuid = o.stationuuid;
    const titleFiltered = title.replace(
      /[`~!@#$%^&*_|+=?;:'",.<>\{\}\[\]\\\/]/gi,
      ""
    );
    const waitUpdate = async () => {
      const db = await getIdbValue({
        dbName: "versions_db",
        dbVersion: 1,
        objectStoreName: "dbVersions",
        id: stationuuid,
      });
      await setIdbValue({
        dbName: stationuuid,
        dbVersion: db.dbVersion,
        objectStoreName: "blacklist_names",
        data: { id: titleFiltered },
      }).catch((e) => {
        console.error("updBlacklistStore->", e);
        resolve(false); // ret boolean not used so far
      });
      resolve(true);
    };
    waitUpdate();
  });
}
