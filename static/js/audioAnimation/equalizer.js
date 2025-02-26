// equalizer.js
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
import { getAppSettings, setAppSettings } from "../database/idbAppSettings.js";
import { audioContext, audioSource } from "./audio.js";
import {
  equalizerPresets,
  equalizerRanges,
  filterTypesList,
} from "../constants.js";

export { initEqualizer };
let gainNode = null;

// https://www.htmlelements.com/forums/topic/carousel-as-input-data/
// https://www.youtube.com/watch?v=XtFlpgaLbZ4 Carousel (Basic) - HTML, CSS & JS
// https://webdesign.tutsplus.com/how-to-build-a-simple-carousel-with-vanilla-javascript--cms-41734t

async function initEqualizer() {
  const customPreset = 15;

  await drawEq({ parentId: "divAudioWrapper" });
  await eqBandsSet(equalizerRanges[0].ranges, customPreset);
  eqPresetOptions();
  eqRangeOptions();
  eqRangeSetListener();
}

function drawEq(o = {}) {
  return new Promise((resolve, _) => {
    const parent = document.getElementById(o.parentId);
    const divEqRange = document.createElement("div");
    const eqRange = document.createElement("select");
    const divEqPresets = document.createElement("div");
    const eqPresets = document.createElement("select");

    divEqRange.setAttribute("id", "divEqRange");
    divEqRange.style.display = "inline-block";
    divEqRange.style.marginLeft = "10px";

    eqRange.setAttribute("id", "eqRange");
    eqRange.setAttribute("type", "select");
    eqRange.style.backgroundColor = "#212631";
    eqRange.style.borderColor = "#212631";
    eqRange.style.color = "#49bbaa";
    eqRange.style.width = "5.1em";
    eqRange.style.fontSize = "96%";

    divEqPresets.setAttribute("id", "divEqPresets");
    divEqPresets.style.display = "inline-block";
    divEqPresets.style.marginLeft = "10px";

    eqPresets.setAttribute("id", "eqPresets");
    eqPresets.setAttribute("type", "select");
    eqPresets.style.backgroundColor = "#212631";
    eqPresets.style.borderColor = "#212631";
    eqPresets.style.color = "#49bbaa";
    eqPresets.style.width = "5.3em";
    eqPresets.style.fontSize = "96%";

    // EQ Selectors container
    const divEqSelectWrap = document.createElement("div");
    divEqSelectWrap.id = "divEqSelectWrap";
    divEqSelectWrap.style.display = "inline-block";
    metaData.set()["eqRangeMember"] = { parent: divEqSelectWrap };
    // createEqRangeDivs({ memberIdx: 0 });
    // createEqPreselectDivs({ memberIdx: 0 });

    parent.appendChild(divEqSelectWrap);
    divEqSelectWrap.appendChild(divEqRange);
    divEqSelectWrap.appendChild(divEqPresets);
    divEqRange.appendChild(eqRange);
    divEqPresets.appendChild(eqPresets);

    const waitSettings = async () => {
      // settings not avail on first app start, DB may not exist
      let range = await getAppSettings({ id: "eqRange" }).catch(() => {
        // placebo, getAppSettings returns false on catch (init app start) - refac
        // getAppSettings must be consolidated with all caller
        return { id: "eqRange", selectedIndex: "1" }; // no impact on init app so far
      });
      let preset = await getAppSettings({ id: "eqPresets" }).catch(() => {
        return { id: "eqPresets", selectedIndex: "12" };
      });

      eqRange.selectedIndex = range.selectedIndex;
      eqPresets.selectedIndex = preset.selectedIndex;

      // try set the default in DB store; keep first selector, text is elem.selectedIndex.value
      await setAppSettings({ id: "eqRange", selectedIndex: range }).catch(
        () => {
          console.log("eqRange->DB not avail yet");
        }
      );
      await setAppSettings({ id: "eqPresets", selectedIndex: preset }).catch(
        () => {
          console.log("eqRange->DB not avail yet");
        }
      );

      loadEqSettings(); // settings not avail on first app start
    };
    waitSettings();
    resolve();
  });
}

/**
 * Create the equalizer (filter collection) and DOM audio.
 * @param {Array} frequencies band range start nums
 * @param {Array} presetIdx gain values for every band range
 */
function eqBandsSet(frequencies, presetIdx) {
  return new Promise((resovlve, _) => {
    let filterNodes = { filters: [] };
    gainNode = null; // GC hits NOT - mem leak if called frequently, open incident Mozilla
    gainNode = audioContext.createGain();
    audioSource.connect(gainNode);

    const promiseArray = filterTypesList.map((_, idx) => {
      return new Promise((resolve, _) => {
        let filter = audioContext.createBiquadFilter();
        filter.type = filterTypesList[idx].type;
        filter.frequency.value = frequencies[idx]; // frequency band start
        filter.gain.value = equalizerPresets[presetIdx].gains[idx];
        // https://stackoverflow.com/questions/33540440/
        // bandpass-filter-which-frequency-and-q-value-to-represent-frequency-range
        // filter and/or Q !?
        filter.Q.value = 1; // default
        filterNodes.filters.push(filter);
        gainNode.connect(filter);
        gainNode = filter;
        resolve();
      });
    });
    Promise.all(promiseArray);

    gainNode.connect(audioContext.destination);
    resovlve();
  });
}

function eqRangeSetListener() {
  document.getElementById("eqRange").addEventListener("click", loadEqSettings); // select winamp, common
}

function eqPresetOptions() {
  const eqPresets = document.getElementById("eqPresets");
  eqPresets.onchange = loadEqSettings; // evt listener

  for (let idx = 0; idx < equalizerPresets.length; idx++) {
    if (equalizerPresets[idx].is_separator) {
      const option = document.createElement("option");
      option.text = "──────────";
      eqPresets.options.add(option);
      option.disabled = true;
    } else {
      const option = document.createElement("option");
      option.text = equalizerPresets[idx].id;
      option.value = option.text;
      eqPresets.options.add(option);
    }
  }
}
/**
 * Load preset into equalizer.
 */
function loadEqSettings() {
  const rangeInput = document.getElementById("eqRange");
  const frequencyProvider = rangeInput.options[rangeInput.selectedIndex].value;
  const frequencyIdx = rangeInput.selectedIndex;
  const presetInput = document.getElementById("eqPresets");
  const presetIdx = presetInput.selectedIndex;

  setAppSettings({
    id: "eqRange",
    selectedIndex: rangeInput.selectedIndex.toString(),
  });
  setAppSettings({
    id: "eqPresets",
    selectedIndex: presetInput.selectedIndex.toString(),
  });

  gainRunFrequency({
    frequencyProvider: frequencyProvider, // range section dropdown (winamp, ...)
    frequencyIdx: frequencyIdx, // range Provider index, list with frequency bands
    presetIdx: presetIdx, // preset select dropdown (jazz, pop )
  });
}

/**
 * Draw the frequency range names into the select element.
 */
function eqRangeOptions() {
  const eqRange = document.getElementById("eqRange");
  for (let idx = 0; idx < equalizerRanges.length; idx++) {
    const option = document.createElement("option");
    option.text = equalizerRanges[idx].id;
    option.value = option.text;
    eqRange.options.add(option);
  }
}

function gainRunFrequency(opt = {}) {
  gainNode.disconnect(0); // -- KEEP in 'gainRunFrequency' -- needs disconnect before re-creation
  eqBandsSet(equalizerRanges[opt.frequencyIdx].ranges, opt.presetIdx);
}
