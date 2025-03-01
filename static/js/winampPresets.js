// winampPresets.js
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

export { winampPresets, gainMultiply };

/**
 * https://github.com/schollz/Winamp-Original-Presets
 * 
 * Target is to recreate the original.
 * The running equalizer winamp select is using the 
 * original bandwidth start frequenzies, but the presets 
 * are different.
 * Let's make an orgAmp bandwidth selector that calls 
 * a corresponding preset selector.
 * The preset dict values must be recalculated for 
 * the JS equalizer with a range from -12db to 12db.
 * Winamp uses 1 to 64.
 */

const jsGainBand = 24; // fit 64 in -12db to 12db
const winampGainBand = 64;

gainMultiply = jsGainBand / winampGainBand // factor 0.375;

const winampPresets = {
  type: "Winamp EQ library file v1.1",
  presets: [
    {
      name: "Classical",
      hz70: 33,
      hz180: 33,
      hz320: 33,
      hz600: 33,
      hz1000: 33,
      hz3000: 33,
      hz6000: 20,
      hz12000: 20,
      hz14000: 20,
      hz16000: 16,
      preamp: 33,
    },
    ,
    {
      name: "Club",
      hz70: 33,
      hz180: 33,
      hz320: 38,
      hz600: 42,
      hz1000: 42,
      hz3000: 42,
      hz6000: 38,
      hz12000: 33,
      hz14000: 33,
      hz16000: 33,
      preamp: 33,
    },
    {
      name: "Dance",
      hz70: 48,
      hz180: 44,
      hz320: 36,
      hz600: 32,
      hz1000: 32,
      hz3000: 22,
      hz6000: 20,
      hz12000: 20,
      hz14000: 32,
      hz16000: 32,
      preamp: 33,
    },
    {
      name: "Flat",
      hz70: 33,
      hz180: 33,
      hz320: 33,
      hz600: 33,
      hz1000: 33,
      hz3000: 33,
      hz6000: 33,
      hz12000: 33,
      hz14000: 33,
      hz16000: 33,
      preamp: 33,
    },
    {
      name: "Laptop speakers/headphones",
      hz70: 40,
      hz180: 50,
      hz320: 41,
      hz600: 26,
      hz1000: 28,
      hz3000: 35,
      hz6000: 40,
      hz12000: 48,
      hz14000: 53,
      hz16000: 56,
      preamp: 33,
    },
    {
      name: "Large hall",
      hz70: 49,
      hz180: 49,
      hz320: 42,
      hz600: 42,
      hz1000: 33,
      hz3000: 24,
      hz6000: 24,
      hz12000: 24,
      hz14000: 33,
      hz16000: 33,
      preamp: 33,
    },
    {
      name: "Party",
      hz70: 44,
      hz180: 44,
      hz320: 33,
      hz600: 33,
      hz1000: 33,
      hz3000: 33,
      hz6000: 33,
      hz12000: 33,
      hz14000: 44,
      hz16000: 44,
      preamp: 33,
    },
    {
      name: "Pop",
      hz70: 29,
      hz180: 40,
      hz320: 44,
      hz600: 45,
      hz1000: 41,
      hz3000: 30,
      hz6000: 28,
      hz12000: 28,
      hz14000: 29,
      hz16000: 29,
      preamp: 33,
    },
    {
      name: "Reggae",
      hz70: 33,
      hz180: 33,
      hz320: 31,
      hz600: 22,
      hz1000: 33,
      hz3000: 43,
      hz6000: 43,
      hz12000: 33,
      hz14000: 33,
      hz16000: 33,
      preamp: 33,
    },
    {
      name: "Rock",
      hz70: 45,
      hz180: 40,
      hz320: 23,
      hz600: 19,
      hz1000: 26,
      hz3000: 39,
      hz6000: 47,
      hz12000: 50,
      hz14000: 50,
      hz16000: 50,
      preamp: 33,
    },
    {
      name: "Soft",
      hz70: 40,
      hz180: 35,
      hz320: 30,
      hz600: 28,
      hz1000: 30,
      hz3000: 39,
      hz6000: 46,
      hz12000: 48,
      hz14000: 50,
      hz16000: 52,
      preamp: 33,
    },
    {
      name: "Ska",
      hz70: 28,
      hz180: 24,
      hz320: 25,
      hz600: 31,
      hz1000: 39,
      hz3000: 42,
      hz6000: 47,
      hz12000: 48,
      hz14000: 50,
      hz16000: 48,
      preamp: 33,
    },
    {
      name: "Full Bass",
      hz70: 48,
      hz180: 48,
      hz320: 48,
      hz600: 42,
      hz1000: 35,
      hz3000: 25,
      hz6000: 18,
      hz12000: 15,
      hz14000: 14,
      hz16000: 14,
      preamp: 33,
    },
    {
      name: "Soft Rock",
      hz70: 39,
      hz180: 39,
      hz320: 36,
      hz600: 31,
      hz1000: 25,
      hz3000: 23,
      hz6000: 26,
      hz12000: 31,
      hz14000: 37,
      hz16000: 47,
      preamp: 33,
    },
    {
      name: "Full Treble",
      hz70: 16,
      hz180: 16,
      hz320: 16,
      hz600: 25,
      hz1000: 37,
      hz3000: 50,
      hz6000: 58,
      hz12000: 58,
      hz14000: 58,
      hz16000: 60,
      preamp: 33,
    },
    {
      name: "Full Bass & Treble",
      hz70: 44,
      hz180: 42,
      hz320: 33,
      hz600: 20,
      hz1000: 24,
      hz3000: 35,
      hz6000: 46,
      hz12000: 50,
      hz14000: 52,
      hz16000: 52,
      preamp: 33,
    },
    {
      name: "Live",
      hz70: 24,
      hz180: 33,
      hz320: 39,
      hz600: 41,
      hz1000: 42,
      hz3000: 42,
      hz6000: 39,
      hz12000: 37,
      hz14000: 37,
      hz16000: 36,
      preamp: 33,
    },
    {
      name: "Techno",
      hz70: 45,
      hz180: 42,
      hz320: 33,
      hz600: 23,
      hz1000: 24,
      hz3000: 33,
      hz6000: 45,
      hz12000: 48,
      hz14000: 48,
      hz16000: 47,
      preamp: 33,
    },
  ],
};
