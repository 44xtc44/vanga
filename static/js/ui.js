// ui.js
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
import { continentAreaBtn } from "./buildGrids/continentAreaGrid.js";
import { loadBlacklist } from "./fileStorage/blacklist.js";
import { createTabLinkBarSettings } from "./buildGrids/uiTabLinks.js";
import { createLoaderMessage } from "./network/messages.js";
import { buildUrlsAdd } from "./menuSettings/uiSettingsUrlsAdd.js";
import { buildSettingsBlackAdd } from "./menuSettings/uiSettingsBlackAdd.js";
import { buildSettingsBlackDump } from "./menuSettings/uiSettingsBlackDump.js";
import { buildLogHistory } from "./menuSettings/logHistory.js";
import { createActivityPlayer } from "./network/streamActivity.js";
import { intervalGetOpenGridData } from "./network/publicDbCom.js";
import { buildSettings } from "./menuSettings/uiSettings.js";

export { createUi };

/**
 * All UI segments from here.
 * @param {*} .
 */
async function createUi() {
  createLoaderMessage(); // rotation loader can be called if wait time

  createTabLinkBarSettings();
  continentAreaBtn();

  loadBlacklist(); // preload from blacklist stores

  buildSettings();
  buildUrlsAdd();
  buildSettingsBlackAdd();
  buildSettingsBlackDump();
  buildLogHistory();

  createActivityPlayer(); // grid radio playing, rec under log monitor
  setInterval(intervalGetOpenGridData, 180000); // stats from public API
}
