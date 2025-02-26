// uiSubmenu.js
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
export { createFeatureDivOutline, createFeatureDivSection };

/**
 * outer div with border
 */
function createFeatureDivOutline(o = {}) {
  return new Promise((resolve, _) => {
    const parent = document.getElementById(o.parentId);
    const divOutline = document.createElement("div");
    divOutline.setAttribute("id", o.divOutline);
    divOutline.style.border = "1px solid rgba(255,255,224, 0.2)";
    divOutline.style.marginTop = "10px";
    divOutline.style.padding = "4px";
    divOutline.style.width = "100%";
    divOutline.style.display = "blo";

    const spanClose = document.createElement("span");
    spanClose.classList.add("handCursor");
    spanClose.innerText = "✖";
    spanClose.style.float = "right";
    spanClose.style.display = "inline-block";
    spanClose.addEventListener("click", () => {
      divOutline.style.display = "none";
    });

    const spanHide = document.createElement("span");
    spanHide.classList.add("handCursor");
    spanHide.innerText = "✖";
    spanHide.style.float = "right";
    spanHide.style.display = "inline-block";
    spanClose.addEventListener("click", () => {
      divOutline.style.display = "none";
    });

    parent.appendChild(divOutline);
    divOutline.appendChild(spanClose);

    resolve(divOutline);
  });
}

/**
 * Inner div with other bg color than outer div.
 * Creates colored segments if called multiple times.
 */
function createFeatureDivSection(o = {}) {
  return new Promise((resolve, _) => {
    const parent = document.getElementById(o.parentId);
    const divInline = document.createElement("div");
    divInline.setAttribute("id", o.childId);
    divInline.style.margin = "16px";
    divInline.style.padding = "10px";
    divInline.style.borderRadius = "4px";
    divInline.style.backgroundColor = "#1c1e1f";
    parent.appendChild(divInline);
    resolve(divInline);
  });
}
