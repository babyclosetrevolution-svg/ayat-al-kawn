import type { EquatorialCoord } from "../types";

/**
 * Constellation catalog — iconic northern + southern figures with the
 * bright stars that draw their main lines. Coordinates are J2000.
 * Compact by design: stars are indexed locally, then connected via
 * pairs of indices, mirroring the IAU "stick figure" tradition.
 */

export interface ConstellationStar extends EquatorialCoord {
  /** Apparent magnitude (smaller = brighter). */
  magnitude: number;
  name?: string;
}

export interface Constellation {
  id: string;
  name: string;
  stars: ConstellationStar[];
  /** Lines: pairs of star indices. */
  lines: [number, number][];
}

const C = (raH: number, decD: number, mag: number, name?: string): ConstellationStar => ({
  raHours: raH,
  decDegrees: decD,
  magnitude: mag,
  name,
});

export const CONSTELLATIONS: Constellation[] = [
  {
    id: "orion",
    name: "Orion",
    stars: [
      C(5.9195, 7.4071, 0.42, "Betelgeuse"),    // 0
      C(5.2423, -8.2017, 0.13, "Rigel"),        // 1
      C(5.4188, 6.3497, 1.64, "Bellatrix"),     // 2
      C(5.7959, -9.6697, 2.05, "Saiph"),        // 3
      C(5.5334, -0.2991, 1.69, "Alnilam"),      // 4
      C(5.6035, -1.2019, 1.74, "Alnitak"),      // 5
      C(5.5333, -0.2991, 2.23, "Mintaka"),      // 6 (close to Alnilam)
      C(5.6793, -5.0566, 4.0, "Hatsya"),        // 7
    ],
    lines: [
      [0, 2], [0, 5], [1, 3], [1, 6],
      [4, 5], [4, 6], [5, 3], [6, 2],
    ],
  },
  {
    id: "ursa-major",
    name: "Ursa Major",
    stars: [
      C(11.0621, 61.7510, 1.79, "Dubhe"),      // 0
      C(11.0307, 56.3824, 2.34, "Merak"),      // 1
      C(11.8972, 53.6948, 2.41, "Phecda"),     // 2
      C(12.2571, 57.0326, 3.32, "Megrez"),     // 3
      C(12.9004, 55.9598, 1.76, "Alioth"),     // 4
      C(13.3987, 54.9254, 2.23, "Mizar"),      // 5
      C(13.7923, 49.3133, 1.85, "Alkaid"),     // 6
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    id: "ursa-minor",
    name: "Ursa Minor",
    stars: [
      C(2.5302, 89.2641, 1.97, "Polaris"),     // 0
      C(15.7344, 77.7944, 4.95, "Yildun"),     // 1
      C(16.2911, 75.7553, 4.32, "Epsilon UMi"),// 2
      C(17.5369, 86.5864, 4.36, "Zeta UMi"),   // 3 (approx)
      C(15.3454, 71.8339, 4.21, "Eta UMi"),    // 4
      C(14.8451, 74.1554, 2.07, "Kochab"),     // 5
      C(15.3458, 71.8339, 3.05, "Pherkad"),    // 6
    ],
    lines: [[0, 3], [3, 2], [2, 4], [4, 5], [5, 6], [6, 2]],
  },
  {
    id: "cassiopeia",
    name: "Cassiopeia",
    stars: [
      C(0.6751, 56.5374, 2.24, "Schedar"),
      C(0.1531, 59.1498, 2.27, "Caph"),
      C(0.9451, 60.7167, 2.47, "Gamma Cas"),
      C(1.4304, 60.2353, 2.68, "Ruchbah"),
      C(1.9064, 63.6701, 3.38, "Segin"),
    ],
    lines: [[1, 0], [0, 2], [2, 3], [3, 4]],
  },
  {
    id: "leo",
    name: "Leo",
    stars: [
      C(10.1395, 11.9672, 1.36, "Regulus"),
      C(10.3329, 19.8418, 2.97, "Algieba"),
      C(11.2351, 15.4297, 2.56, "Zosma"),
      C(11.8177, 14.5722, 3.34, "Chertan"),
      C(11.8177, 14.5722, 2.14, "Denebola"), // close approx
      C(9.7641, 23.7740, 3.43, "Rasalas"),
    ],
    lines: [[0, 1], [1, 5], [1, 2], [2, 3], [3, 4]],
  },
  {
    id: "cygnus",
    name: "Cygnus",
    stars: [
      C(20.6905, 45.2803, 1.25, "Deneb"),
      C(19.5120, 27.9597, 2.23, "Albireo"),
      C(20.7702, 33.9703, 2.46, "Sadr"),
      C(19.7496, 45.1303, 2.86, "Delta Cyg"),
      C(20.3704, 40.2566, 2.48, "Gienah"),
    ],
    lines: [[0, 2], [2, 1], [3, 2], [2, 4]],
  },
  {
    id: "lyra",
    name: "Lyra",
    stars: [
      C(18.6156, 38.7837, 0.03, "Vega"),
      C(18.8359, 33.3625, 3.24, "Sheliak"),
      C(18.9821, 32.6896, 3.25, "Sulafat"),
      C(18.7460, 39.6128, 4.34, "Zeta Lyr"),
    ],
    lines: [[0, 3], [3, 1], [1, 2], [2, 0]],
  },
  {
    id: "scorpius",
    name: "Scorpius",
    stars: [
      C(16.4901, -26.4320, 1.06, "Antares"),
      C(16.0056, -22.6217, 2.62, "Acrab"),
      C(16.0901, -19.8054, 2.89, "Jabbah"),
      C(16.8362, -34.2932, 1.86, "Sargas"),
      C(17.5602, -37.1038, 1.62, "Shaula"),
      C(17.5601, -37.1041, 2.39, "Lesath"),
    ],
    lines: [[2, 1], [1, 0], [0, 3], [3, 4], [4, 5]],
  },
  {
    id: "canis-major",
    name: "Canis Major",
    stars: [
      C(6.7525, -16.7161, -1.46, "Sirius"),
      C(7.1399, -26.3932, 1.50, "Adhara"),
      C(7.4014, -29.3030, 1.84, "Wezen"),
      C(6.3777, -17.9559, 1.98, "Mirzam"),
      C(7.0286, -27.9347, 3.02, "Furud"),
    ],
    lines: [[3, 0], [0, 1], [1, 2], [2, 4]],
  },
  {
    id: "taurus",
    name: "Taurus",
    stars: [
      C(4.5987, 16.5093, 0.86, "Aldebaran"),
      C(5.4382, 28.6082, 1.65, "Elnath"),
      C(4.4767, 15.8704, 3.65, "Theta Tau"),
      C(3.7914, 24.1051, 2.85, "Alcyone"),
    ],
    lines: [[3, 2], [2, 0], [0, 1]],
  },
  {
    id: "crux",
    name: "Crux",
    stars: [
      C(12.4433, -63.0991, 0.77, "Acrux"),
      C(12.7953, -59.6887, 1.30, "Mimosa"),
      C(12.5194, -57.1133, 1.59, "Gacrux"),
      C(12.2522, -58.7489, 2.79, "Delta Cru"),
    ],
    lines: [[0, 2], [1, 3]],
  },
  {
    id: "centaurus",
    name: "Centaurus",
    stars: [
      C(14.6599, -60.8354, 0.01, "Rigil Kentaurus"),
      C(14.0637, -60.3729, 0.61, "Hadar"),
      C(13.6648, -53.4665, 2.06, "Menkent"),
      C(11.5957, -63.0181, 2.30, "Delta Cen"),
    ],
    lines: [[0, 1], [1, 2], [1, 3]],
  },
];
