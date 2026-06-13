// lib/matches-data.js
// Données des matchs WC 2026 — côté backend
// Copie de src/data/matches.js pour le backend Node.js

export const MATCHES = [
  // GROUPE A
  { id: 1,  group: "A", teamA: "Mexique",                teamB: "Afrique du Sud",        date: "2026-06-11", time: "13:00" },
  { id: 2,  group: "A", teamA: "Corée du Sud",           teamB: "Tchéquie",              date: "2026-06-11", time: "20:00" },
  { id: 3,  group: "A", teamA: "Mexique",                teamB: "Corée du Sud",          date: "2026-06-17", time: "16:00" },
  { id: 4,  group: "A", teamA: "Tchéquie",               teamB: "Afrique du Sud",        date: "2026-06-18", time: "11:00" },
  { id: 5,  group: "A", teamA: "Tchéquie",               teamB: "Mexique",               date: "2026-06-24", time: "16:00" },
  { id: 6,  group: "A", teamA: "Afrique du Sud",         teamB: "Corée du Sud",          date: "2026-06-24", time: "16:00" },
  // GROUPE B
  { id: 7,  group: "B", teamA: "Canada",                 teamB: "Bosnie-et-Herzégovine", date: "2026-06-12", time: "15:00" },
  { id: 8,  group: "B", teamA: "Qatar",                  teamB: "Suisse",                date: "2026-06-13", time: "12:00" },
  { id: 9,  group: "B", teamA: "Canada",                 teamB: "Qatar",                 date: "2026-06-18", time: "21:00" },
  { id: 10, group: "B", teamA: "Suisse",                 teamB: "Bosnie-et-Herzégovine", date: "2026-06-18", time: "14:00" },
  { id: 11, group: "B", teamA: "Suisse",                 teamB: "Canada",                date: "2026-06-24", time: "19:00" },
  { id: 12, group: "B", teamA: "Bosnie-et-Herzégovine",  teamB: "Qatar",                 date: "2026-06-24", time: "19:00" },
  // GROUPE C
  { id: 13, group: "C", teamA: "Brésil",                 teamB: "Maroc",                 date: "2026-06-13", time: "18:00" },
  { id: 14, group: "C", teamA: "Haïti",                  teamB: "Écosse",                date: "2026-06-13", time: "21:00" },
  { id: 15, group: "C", teamA: "Brésil",                 teamB: "Haïti",                 date: "2026-06-19", time: "19:00" },
  { id: 16, group: "C", teamA: "Écosse",                 teamB: "Maroc",                 date: "2026-06-19", time: "13:00" },
  { id: 17, group: "C", teamA: "Écosse",                 teamB: "Brésil",                date: "2026-06-24", time: "21:00" },
  { id: 18, group: "C", teamA: "Maroc",                  teamB: "Haïti",                 date: "2026-06-24", time: "21:00" },
  // GROUPE D
  { id: 19, group: "D", teamA: "États-Unis",             teamB: "Paraguay",              date: "2026-06-12", time: "18:00" },
  { id: 20, group: "D", teamA: "Australie",              teamB: "Turquie",               date: "2026-06-13", time: "21:00" },
  { id: 21, group: "D", teamA: "États-Unis",             teamB: "Australie",             date: "2026-06-19", time: "19:00" },
  { id: 22, group: "D", teamA: "Turquie",                teamB: "Paraguay",              date: "2026-06-19", time: "15:00" },
  { id: 23, group: "D", teamA: "Turquie",                teamB: "États-Unis",            date: "2026-06-25", time: "19:00" },
  { id: 24, group: "D", teamA: "Paraguay",               teamB: "Australie",             date: "2026-06-25", time: "19:00" },
  // GROUPE E
  { id: 25, group: "E", teamA: "Allemagne",              teamB: "Curaçao",               date: "2026-06-14", time: "12:00" },
  { id: 26, group: "E", teamA: "Côte d'Ivoire",          teamB: "Équateur",              date: "2026-06-14", time: "19:00" },
  { id: 27, group: "E", teamA: "Allemagne",              teamB: "Côte d'Ivoire",         date: "2026-06-20", time: "11:00" },
  { id: 28, group: "E", teamA: "Équateur",               teamB: "Curaçao",               date: "2026-06-20", time: "15:00" },
  { id: 29, group: "E", teamA: "Équateur",               teamB: "Allemagne",             date: "2026-06-25", time: "13:00" },
  { id: 30, group: "E", teamA: "Curaçao",                teamB: "Côte d'Ivoire",         date: "2026-06-25", time: "13:00" },
  // GROUPE F
  { id: 31, group: "F", teamA: "Pays-Bas",               teamB: "Japon",                 date: "2026-06-14", time: "15:00" },
  { id: 32, group: "F", teamA: "Suède",                  teamB: "Tunisie",               date: "2026-06-14", time: "20:00" },
  { id: 33, group: "F", teamA: "Pays-Bas",               teamB: "Suède",                 date: "2026-06-20", time: "18:00" },
  { id: 34, group: "F", teamA: "Tunisie",                teamB: "Japon",                 date: "2026-06-20", time: "21:00" },
  { id: 35, group: "F", teamA: "Tunisie",                teamB: "Pays-Bas",              date: "2026-06-25", time: "16:00" },
  { id: 36, group: "F", teamA: "Japon",                  teamB: "Suède",                 date: "2026-06-25", time: "16:00" },
  // GROUPE G
  { id: 37, group: "G", teamA: "Belgique",               teamB: "Égypte",                date: "2026-06-15", time: "12:00" },
  { id: 38, group: "G", teamA: "Iran",                   teamB: "Nouvelle-Zélande",      date: "2026-06-15", time: "18:00" },
  { id: 39, group: "G", teamA: "Belgique",               teamB: "Iran",                  date: "2026-06-21", time: "12:00" },
  { id: 40, group: "G", teamA: "Nouvelle-Zélande",       teamB: "Égypte",                date: "2026-06-21", time: "15:00" },
  { id: 41, group: "G", teamA: "Nouvelle-Zélande",       teamB: "Belgique",              date: "2026-06-26", time: "16:00" },
  { id: 42, group: "G", teamA: "Égypte",                 teamB: "Iran",                  date: "2026-06-26", time: "16:00" },
  // GROUPE H
  { id: 43, group: "H", teamA: "Espagne",                teamB: "Cap-Vert",              date: "2026-06-15", time: "12:00" },
  { id: 44, group: "H", teamA: "Arabie Saoudite",        teamB: "Uruguay",               date: "2026-06-15", time: "18:00" },
  { id: 45, group: "H", teamA: "Espagne",                teamB: "Arabie Saoudite",       date: "2026-06-21", time: "18:00" },
  { id: 46, group: "H", teamA: "Uruguay",                teamB: "Cap-Vert",              date: "2026-06-21", time: "21:00" },
  { id: 47, group: "H", teamA: "Uruguay",                teamB: "Espagne",               date: "2026-06-26", time: "19:00" },
  { id: 48, group: "H", teamA: "Cap-Vert",               teamB: "Arabie Saoudite",       date: "2026-06-26", time: "19:00" },
  // GROUPE I
  { id: 49, group: "I", teamA: "France",                 teamB: "Sénégal",               date: "2026-06-16", time: "15:00" },
  { id: 50, group: "I", teamA: "Irak",                   teamB: "Norvège",               date: "2026-06-16", time: "18:00" },
  { id: 51, group: "I", teamA: "France",                 teamB: "Irak",                  date: "2026-06-22", time: "12:00" },
  { id: 52, group: "I", teamA: "Norvège",                teamB: "Sénégal",               date: "2026-06-22", time: "15:00" },
  { id: 53, group: "I", teamA: "Norvège",                teamB: "France",                date: "2026-06-27", time: "16:00" },
  { id: 54, group: "I", teamA: "Sénégal",                teamB: "Irak",                  date: "2026-06-27", time: "16:00" },
  // GROUPE J
  { id: 55, group: "J", teamA: "Argentine",              teamB: "Algérie",               date: "2026-06-16", time: "20:00" },
  { id: 56, group: "J", teamA: "Autriche",               teamB: "Jordanie",              date: "2026-06-16", time: "21:00" },
  { id: 57, group: "J", teamA: "Argentine",              teamB: "Autriche",              date: "2026-06-22", time: "18:00" },
  { id: 58, group: "J", teamA: "Jordanie",               teamB: "Algérie",               date: "2026-06-22", time: "21:00" },
  { id: 59, group: "J", teamA: "Jordanie",               teamB: "Argentine",             date: "2026-06-27", time: "19:00" },
  { id: 60, group: "J", teamA: "Algérie",                teamB: "Autriche",              date: "2026-06-27", time: "19:00" },
  // GROUPE K
  { id: 61, group: "K", teamA: "Portugal",               teamB: "RD Congo",              date: "2026-06-17", time: "12:00" },
  { id: 62, group: "K", teamA: "Ouzbékistan",            teamB: "Colombie",              date: "2026-06-17", time: "15:00" },
  { id: 63, group: "K", teamA: "Portugal",               teamB: "Ouzbékistan",           date: "2026-06-22", time: "18:00" },
  { id: 64, group: "K", teamA: "Colombie",               teamB: "RD Congo",              date: "2026-06-23", time: "11:00" },
  { id: 65, group: "K", teamA: "Colombie",               teamB: "Portugal",              date: "2026-06-27", time: "13:00" },
  { id: 66, group: "K", teamA: "RD Congo",               teamB: "Ouzbékistan",           date: "2026-06-27", time: "13:00" },
  // GROUPE L
  { id: 67, group: "L", teamA: "Angleterre",             teamB: "Croatie",               date: "2026-06-17", time: "12:00" },
  { id: 68, group: "L", teamA: "Ghana",                  teamB: "Panama",                date: "2026-06-17", time: "21:00" },
  { id: 69, group: "L", teamA: "Angleterre",             teamB: "Ghana",                 date: "2026-06-23", time: "15:00" },
  { id: 70, group: "L", teamA: "Panama",                 teamB: "Croatie",               date: "2026-06-23", time: "18:00" },
  { id: 71, group: "L", teamA: "Panama",                 teamB: "Angleterre",            date: "2026-06-27", time: "16:00" },
  { id: 72, group: "L", teamA: "Croatie",                teamB: "Ghana",                 date: "2026-06-27", time: "16:00" },
];
