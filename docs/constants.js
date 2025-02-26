// constants.js
"use strict";

const fraunhoferApi = "https://api.energy-charts.info";

const colPalette = [
  [255, 255, 224],
  [255, 0, 0],
  [0, 255, 0],
  [255, 255, 0],
  [244, 109, 67],
  [73, 187, 170],
  [50, 136, 189],
  [247, 183, 51],
  [102, 178, 155],
  [255, 204, 229],
  [236, 241, 193],
];

const leapYear = [
  1904, 1908, 1912, 1916, 1920, 1924, 1928, 1932, 1936, 1940, 1944, 1948, 1952,
  1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996, 2004, 2008,
  2012, 2016, 2020, 2024, 2028, 2032, 2036, 2040, 2044, 2048, 2052, 2056, 2060,
  2064, 2068, 2072, 2076, 2080, 2084, 2088, 2092, 2096, 2104, 2108, 2112, 2116,
  2120, 2124, 2128, 2132, 2136, 2140, 2144, 2148, 2152, 2156, 2160, 2164, 2168,
  2172, 2176, 2180, 2184, 2188, 2192, 2196,
];

const infoCardItems = [
  "divIdentify__",
  "divMonthDayDigit__",
  "divTime__",
  "divNoCO2__",
  "divLowCO2__",
  "divIsCO2__",
  "divLoad__",
  "divResidual_load__",
  "divCross_border_electricity_trading__",
];

const dev_countryCodes = {
  all: "Europe",
  al: "Albania",
  am: "Armenia",
};

const countryCodes = {
  de: "Germany",
  ch: "Switzerland",
  eu: "EU",
  all: "Europe",
  al: "Albania",
  am: "Armenia",
  at: "Austria",
  az: "Azerbaijan",
  ba: "BosniaH.",
  be: "Belgium",
  bg: "Bulgaria",
  by: "Belarus",
  cy: "Cyprus",
  cz: "Czech",
  dk: "Denmark",
  ee: "Estonia",
  es: "Spain",
  fi: "Finland",
  fr: "France",
  ge: "Georgia",
  gr: "Greece",
  hr: "Croatia",
  hu: "Hungary",
  ie: "Ireland",
  it: "Italy",
  lt: "Lithuania",
  lu: "Luxembourg",
  lv: "Latvia",
  md: "Moldova",
  me: "Montenegro",
  mk: "N.Macedonia",
  mt: "Malta",
  nie: "N.Ireland",
  nl: "Netherlands",
  no: "Norway",
  pl: "Poland",
  pt: "Portugal",
  ro: "Romania",
  rs: "Serbia",
  ru: "Russia",
  se: "Sweden",
  sl: "Slovenia",
  sk: "Slovakia",
  tr: "Turkey",
  ua: "Ukraine",
  uk: "UK",
  xk: "Kosovo",
};

// https://api.energy-charts.info/public_power?country=de&start=2024-06-01&end=2024-06-015'
const dateForm = {
  yearStart: "-01-01",
  yearEnd: "-12-31",
  quartOneStart: "-01-01",
  quartOneEnd: "-03-31",
  // to be continued
};

// Fraunhofer endpoints "https://api.energy-charts.info/"
const frauEP = {
  // Returns the public net electricity production
  // for a given country for each production type.
  PublicPower: "/public_power",
  // Returns the total net electricity production
  // (including industrial self supply) for a given country
  // for each production type. --> currently only Germany <--
  TotalPower: "/total_power",
  // Returns the installed power for a specified country in GW
  // except for battery storage capacity, which is given in GWh.
  // time_step: Time step can be either "yearly" or "monthly" (only for Germany)
  InstalledPower: "/installed_power",
};

module.exports = {
  countryCodes,
};
