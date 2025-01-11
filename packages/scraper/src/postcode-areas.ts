// Defining the structure for postcode data

import type { PostcodeArea } from "./@interfaces";

export const POSTCODE_AREAS: PostcodeArea[] = [
  { postcode: "5000", suburbs: ["Adelaide City"] },
  // Skipping "5001" due to server issue
  { postcode: "5006", suburbs: ["North Adelaide"] },
  {
    postcode: "5007",
    suburbs: ["Bowden", "Brompton", "Hindmarsh", "Welland", "West Hindmarsh"],
  },
  {
    postcode: "5008",
    suburbs: [
      "Croydon",
      "Devon Park",
      "Renown Park",
      "Ridleyton",
      "West Croydon",
    ],
  },
  { postcode: "5009", suburbs: ["Allenby Gardens", "Beverley", "Kilkenny"] },
  {
    postcode: "5011",
    suburbs: [
      "Woodville",
      "Woodville Park",
      "Woodville South",
      "Woodville West",
    ],
  },
  { postcode: "5012", suburbs: ["Athol Park", "Woodville North"] },
  { postcode: "5013", suburbs: ["Pennington", "Rosewater", "Rosewater East"] },
  {
    postcode: "5014",
    suburbs: ["Albert Park", "Cheltenham", "Hendon", "Royal Park"],
  },
  // { postcode: "5019", suburbs: ["Semaphore Park"] },
  // { postcode: "5020", suburbs: ["West Lakes Shore"] },
  // { postcode: "5021", suburbs: ["West Lakes"] },
  // {
  //   postcode: "5022",
  //   suburbs: ["Grange", "Henley Beach", "Henley Beach South", "Tennyson"],
  // },
  // { postcode: "5023", suburbs: ["Findon", "Seaton"] },
  // { postcode: "5024", suburbs: ["Fulham", "Fulham Gardens", "West Beach"] },
  // { postcode: "5025", suburbs: ["Flinders Park", "Kidman Park"] },
  // {
  //   postcode: "5031",
  //   suburbs: ["Mile End", "Mile End South", "Thebarton", "Torrensville"],
  // },
  // { postcode: "5032", suburbs: ["Brooklyn Park", "Lockleys", "Underdale"] },
  // {
  //   postcode: "5033",
  //   suburbs: ["Cowandilla", "Hilton", "Marleston", "Richmond", "West Richmond"],
  // },
  // {
  //   postcode: "5034",
  //   suburbs: [
  //     "Clarence Park",
  //     "Goodwood",
  //     "Kings Park",
  //     "Millswood",
  //     "Wayville",
  //   ],
  // },
  // {
  //   postcode: "5035",
  //   suburbs: [
  //     "Ashford",
  //     "Black Forest",
  //     "Everard Park",
  //     "Forestville",
  //     "Keswick",
  //   ],
  // },
  // {
  //   postcode: "5037",
  //   suburbs: ["Glandore", "Kurralta Park", "Netley", "North Plympton"],
  // },
  // { postcode: "5038", suburbs: ["Camden Park", "Plympton"] },
  // { postcode: "5040", suburbs: ["Novar Gardens"] },
  // { postcode: "5045", suburbs: ["Glenelg North"] },
  // {
  //   postcode: "5061",
  //   suburbs: ["Hyde Park", "Malvern", "Unley", "Unley Park"],
  // },
  // {
  //   postcode: "5063",
  //   suburbs: ["Eastwood", "Frewville", "Fullarton", "Highgate", "Parkside"],
  // },
  // {
  //   postcode: "5064",
  //   suburbs: [
  //     "Glen Osmond",
  //     "Glenunga",
  //     "Mount Osmond",
  //     "Myrtle Bank",
  //     "St Georges",
  //   ],
  // },
  // {
  //   postcode: "5065",
  //   suburbs: [
  //     "Dulwich",
  //     "Glenside",
  //     "Linden Park",
  //     "Toorak Gardens",
  //     "Tusmore",
  //   ],
  // },
  // {
  //   postcode: "5066",
  //   suburbs: [
  //     "Beaumont",
  //     "Burnside",
  //     "Erindale",
  //     "Hazelwood Park",
  //     "Stonyfell",
  //     "Waterfall Gully",
  //     "Wattle Park",
  //   ],
  // },
  // {
  //   postcode: "5067",
  //   suburbs: [
  //     "Beulah Park",
  //     "Kent Town",
  //     "Norwood",
  //     "Norwood South",
  //     "Rose Park",
  //   ],
  // },
  // {
  //   postcode: "5068",
  //   suburbs: [
  //     "Heathpool",
  //     "Kensington",
  //     "Kensington Gardens",
  //     "Kensington Park",
  //     "Leabrook",
  //     "Marryatville",
  //     "St Morris",
  //     "Trinity Gardens",
  //   ],
  // },
  // {
  //   postcode: "5069",
  //   suburbs: [
  //     "College Park",
  //     "Evandale",
  //     "Hackney",
  //     "Maylands",
  //     "St Peters",
  //     "Stepney",
  //   ],
  // },
  // {
  //   postcode: "5070",
  //   suburbs: [
  //     "Felixstow",
  //     "Firle",
  //     "Glynde",
  //     "Joslin",
  //     "Marden",
  //     "Payneham",
  //     "Payneham South",
  //     "Royston Park",
  //   ],
  // },
  // {
  //   postcode: "5072",
  //   suburbs: [
  //     "Auldana",
  //     "Magill",
  //     "Magill North",
  //     "Rosslyn Park",
  //     "Skye",
  //     "Teringie",
  //     "Woodforde",
  //   ],
  // },
  // { postcode: "5073", suburbs: ["Rostrevor"] },
  // {
  //   postcode: "5081",
  //   suburbs: [
  //     "Collinswood",
  //     "Gilberton",
  //     "Medindie",
  //     "Medindie Gardens",
  //     "Vale Park",
  //     "Walkerville",
  //   ],
  // },
  // {
  //   postcode: "5082",
  //   suburbs: ["Fitzroy", "Ovingham", "Prospect", "Prospect East", "Thorngate"],
  // },
  // { postcode: "5083", suburbs: ["Broadview", "Nailsworth", "Sefton Park"] },
  // { postcode: "5131", suburbs: ["Upper Hermitage"] },
  // { postcode: "5132", suburbs: ["Paracombe"] },
  // { postcode: "5141", suburbs: ["Summertown"] },
  // { postcode: "5142", suburbs: ["Uraidla"] },
  // { postcode: "5244", suburbs: ["Woodside"] },
  // { postcode: "5245", suburbs: ["Verdun"] },
];
