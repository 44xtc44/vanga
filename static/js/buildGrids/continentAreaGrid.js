// continentAreaGrid.js
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

// {Asia: asia_countries, Africa: africa_countries,}
import { continentCountries } from "../constants.js";
import { countryBtns, localDbBtns, worldAreasBtns } from "./countryAreaGrid.js";
import { recMsg } from "../network/messages.js";
import { metaData } from "../central.js";
import {
  createFeatureDivOutline,
  createFeatureDivSection,
} from "../buildGrids/uiSubmenu.js";
export { continentAreaBtn };

/**
 * Continent buttons get three different listeners.
 * countryBtns - public DB stations
 * localDbBtns - local indexed DB Favorites and Custom
 * worldAreasBtns - 'World' btn full public DB, other btn .flat of continent countries
 * @returns {Promise} undefined
 */
function continentAreaBtn() {
  return new Promise((resolve, _) => {
    const continentContainer = document.getElementById("continentContainer");
    const continentAnchor = document.createElement("div");
    continentAnchor.id = "continentAnchor";
    continentAnchor.classList.add("grid-group-continent");
    continentContainer.appendChild(continentAnchor);

    for (const [continent, countryArray] of Object.entries(
      continentCountries
    )) {
      const continentBtn = document.createElement("div");
      continentBtn.setAttribute("id", continent + "_button");
      continentBtn.classList.add("grid-group-continent-item"); // gets a listener
      continentBtn.classList.add("handCursor");
      continentBtn.dataset.selected = "false"; // future use
      continentBtn.textContent = continent;
      continentAnchor.appendChild(continentBtn);

      // Favorites are from local store, World can not be filtered by country code.
      if (continent === "Favorites" || continent === "World") {
        if (continent === "Favorites")
          localDbBtns(countryArray, continentBtn, continent);
        if (continent === "World")
          worldAreasBtns(countryArray, continentBtn, continent);
      } else {
        countryBtns(countryArray, continentBtn, continent);
      }
    }
    resolve();
  });
}
