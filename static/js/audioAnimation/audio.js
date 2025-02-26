// audio.js
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

import { recMsg } from "../network/messages.js";
import { metaData } from "../central.js";
import { providerUrlGet } from "../network/streamDetect.js";
import { getAppSettings, setAppSettings } from "../database/idbAppSettings.js";

export {
  createAudio,
  audioContext,
  analyser,
  audioSource,
  analyserInit,
  createMainAudioLine,
  connectAnalyserInit,
};
let analyser = null;
let audioSource = null;
let analyserInit = null;
let audioContext = null;

/**
 *
 */
function createAudio() {
  return new Promise((resolve, _) => {
    const wait = async () => {
      const audio = await createAudioElements();
      const divAudioWrapper = await createAudioWrapper(audio);
      const audioVolume = await createVolumeSlider(audio, divAudioWrapper);

      // sets also metaData.set()["audioVolume"]
      await restoreAudioVolume({
        audioId: "audioWithControls", // audio obj name
        audioVolume: audioVolume, // adjust slider obj
      });

      const volBtns = await createVolumeBtns(divAudioWrapper);
      await createVolBtnListener(volBtns, audio, audioVolume);

      resolve();
    };
    wait();
  });
}

function createAudioElements() {
  return new Promise((resolve, _) => {
    // Audio, no change here (Video play), else 'audio.onerror' fails!!!
    // video.onerror will return a network error
    const audio = document.createElement("audio");
    audio.setAttribute("id", "audioWithControls");
    audio.setAttribute("crossorigin", "anonymous");
    audio.setAttribute("preload", "metadata");
    audio.setAttribute("autoplay", "");
    audio.setAttribute("controls", "");
    audio.volume = "0.7";

    audioContext = new AudioContext();
    audioContext.onerror = (e) => {
      console.error("audioContext->", e); //nothing so far, may be needed if load stream
    };

    // Plug for the connector chain. Ends in audioContext.destination (speaker).
    audioSource = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser(); // feeds main animation (fft)
    analyserInit = audioContext.createAnalyser(); // init screen, diff fftSizes for anim.
    resolve(audio);

    audio.onerror = (e) => {
      if (e.target.error.message === "Failed to open media") {
        const waitProvider = async () => {
          const providerUrl = await providerUrlGet(e.target.src);
          if (!providerUrl.includes("http")) {
            recMsg(["audio element fail :: try again"]);
            return;
          }
          recMsg(["audio element ::", e.target.error.message]);
          // old BUG again https://bugzilla.mozilla.org/show_bug.cgi?id=1354633
          // This error message will be blank when privacy.resistFingerprinting = true
          // spring-react https://github.com/pmndrs/react-spring/issues/664
          recMsg([
            "<a href=" +
              providerUrl +
              " target=_blank>-> open provider tab</a> or icon copy URL-> new tab",
          ]);
        };
        waitProvider();
      }
    };
  });
}

/**
 * Volume buttons for mobile user.
 * @param {*} volBtns
 * @param {*} audio
 * @param {*} audioVolume
 * @returns
 */
function createVolBtnListener(volBtns, audio, audioVolume) {
  return new Promise((resolve, _) => {
    const delay = 150;
    const volMinus = volBtns.volMinus;
    const volPlus = volBtns.volPlus;
    const volDisplay = volBtns.volDisplay;
    let count = metaData.get()["audioVolume"];

    if (count === null || count === undefined) {
      count = audioVolume.value;
    }
    volDisplay.innerHTML = count;

    volPlus.onmousedown = (e) => {
      e.preventDefault();
      count = parseInt(metaData.get()["audioVolume"]);
      if (count > 100) {
        count = 100;
      } else {
        count > 100 ? 100 : (count += 5);
      }
      volDisplay.innerHTML = count;
      metaData.set()["audioVolume"] = count;
    };
    volPlus.onmouseup = () => {
      count = metaData.get()["audioVolume"];
      audioVolume.value = count;
      setAudioVolume(audio, audioVolume);
    };

    volMinus.onmousedown = (e) => {
      e.preventDefault();
      count = parseInt(metaData.get()["audioVolume"]);
      if (count < 0) {
        count = 0;
      } else {
        count < 0 ? 0 : (count -= 5);
      }
      volDisplay.innerHTML = count;
      metaData.set()["audioVolume"] = count;
    };
    volMinus.onmouseup = () => {
      count = metaData.get()["audioVolume"];
      audioVolume.value = count;
      setAudioVolume(audio, audioVolume);
    };

    resolve();
  });
}

/**
 * Slider element for PC user.
 * @param {*} audio
 * @returns
 */
function createVolumeBtns(divAudioWrapper) {
  return new Promise((resolve, _) => {
    // set all div inside wrap to inline-block, for side by side
    const audioBtnWrap = document.createElement("div");
    audioBtnWrap.id = "audioBtnWrap";
    audioBtnWrap.style.display = "inline-block";
    const volMinus = document.createElement("div");
    volMinus.classList.add("imgTransform");
    volMinus.classList.add("volBtnStyle");
    volMinus.id = "volMinus";
    const volPlus = document.createElement("div");
    volPlus.classList.add("imgTransform");
    volPlus.classList.add("volBtnStyle");
    volPlus.id = "volPlus";
    const volDisplay = document.createElement("div");
    volDisplay.classList.add("volDisplayStyle");
    volDisplay.id = "volDisplay";
    volDisplay.innerHTML = "---";

    const spanVolMinus = document.createElement("span");
    spanVolMinus.style.verticalAlign = "-12px";
    const spanVolDisplay = document.createElement("span");
    spanVolDisplay.style.verticalAlign = "-8px";
    const spanVolPlus = document.createElement("span");
    spanVolPlus.style.verticalAlign = "-12px";

    // button icons
    const btnHeight = "32px";
    const imgPlus = document.createElement("img");
    imgPlus.id = "imgPlus";
    imgPlus.src = "./images/volume-plus-icon.svg";
    imgPlus.style.height = btnHeight;
    imgPlus.style.verticalAlign = "bottom";
    volPlus.appendChild(imgPlus);

    const imgMinus = document.createElement("img");
    imgMinus.id = "imgPlus";
    imgMinus.src = "./images/volume-minus-icon.svg";
    imgMinus.style.height = btnHeight;
    imgMinus.style.verticalAlign = "bottom";
    volMinus.appendChild(imgMinus);

    spanVolMinus.appendChild(imgMinus); // span vertical align is better
    spanVolPlus.appendChild(imgPlus);
    volMinus.appendChild(spanVolMinus);
    volDisplay.appendChild(spanVolDisplay);
    volPlus.appendChild(spanVolPlus);

    divAudioWrapper.appendChild(audioBtnWrap);
    audioBtnWrap.appendChild(volMinus);
    audioBtnWrap.appendChild(volDisplay);
    audioBtnWrap.appendChild(volPlus);

    resolve({ volMinus: volMinus, volPlus: volPlus, volDisplay: volDisplay });
  });
}

/**
 * Wrapper container for all audio switchable elements.
 * Put the audio element in here. Who cares.
 */
function createAudioWrapper(audio) {
  return new Promise((resolve, _) => {
    const spanAudio = document.createElement("span");
    spanAudio.setAttribute("id", "spanAudioControl");
    spanAudio.appendChild(audio); // anchor audio

    const divAudioWrapper = document.createElement("div");
    divAudioWrapper.classList.add("divAudioWrapper");
    divAudioWrapper.id = "divAudioWrapper";
    divAudioWrapper.style.borderRadius = "5px";
    divAudioWrapper.style.border = "1px solid rgba(255, 255, 224, 0.2)";

    const divRowAudio = document.getElementById("divRowAudio");
    divRowAudio.appendChild(divAudioWrapper);
    divAudioWrapper.appendChild(spanAudio);
    spanAudio.style.display = "none";

    resolve(divAudioWrapper);
  });
}

function createVolumeSlider(audio, divAudioWrapper) {
  return new Promise((resolve, _) => {
    const divAudioVolumeSlider = document.createElement("div");
    divAudioVolumeSlider.classList.add("divAudioVolumeSlider"); // slide-container
    divAudioVolumeSlider.style.display = "inline-block";
    divAudioVolumeSlider.style.marginTop = "10px";
    divAudioVolumeSlider.style.display = "inline-block";

    // https://freefrontend.com/css-range-sliders/
    const audioVolume = document.createElement("input"); // slider
    audioVolume.setAttribute("id", "audioVolume");

    audioVolume.setAttribute("type", "range");
    audioVolume.setAttribute("value", "75");
    audioVolume.classList.add("slider");
    audioVolume.addEventListener("input", () => {
      setAudioVolume(audio, audioVolume);
    });

    divAudioWrapper.appendChild(divAudioVolumeSlider);
    divAudioVolumeSlider.appendChild(audioVolume);
    resolve(audioVolume);
  });
}

function restoreAudioVolume(o = {}) {
  return new Promise((resolve, _) => {
    const waitSettings = async () => {
      const audioId = o.audioId;
      const audioVolume = o.audioVolume;
      const audioElem = document.getElementById(audioId);
      let elemDict = await getAppSettings({ id: audioId });
      if (!elemDict) {
        const defaultVolume = "75";
        await setAppSettings({ id: audioId, volume: defaultVolume });
        audioVolume.value = defaultVolume;
        metaData.set()["audioVolume"] = defaultVolume;
      } else {
        audioVolume.value = elemDict.volume;
        setAudioVolume(audioElem, audioVolume);
        metaData.set()["audioVolume"] = audioVolume.value;
      }
      resolve();
    };
    waitSettings();
  });
}

/**
 * Eiter volume slider or button press updates also
 * metaData.set()["audioVolume"] to have both element in sync.
 * @param {*} audio
 * @param {*} audioVolume
 */
function setAudioVolume(audio, audioVolume) {
  const volDisplay = document.getElementById("volDisplay");
  audio.volume = audioVolume.value / 100;
  if (volDisplay !== null && volDisplay !== undefined) {
    volDisplay.innerHTML = audioVolume.value;
  }
  metaData.set()["audioVolume"] = audioVolume.value;
  setAppSettings({ id: audio.id, volume: audioVolume.value });
}

/**
 * Must have an analyzer for each animation.
 * Not only due to different fft size requirements.
 * Else one canvas will show distortions, if there are two canva s.
 */
function createMainAudioLine() {
  return new Promise((resolve, _) => {
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination); // speaker
    resolve();
  });
}

function connectAnalyserInit() {
  return new Promise((resolve, _) => {
    // extra line for init screen
    audioSource.connect(analyserInit); // silent, then may .connect(audioContext.destination);
    resolve();
  });
}
