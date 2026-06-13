// lib/football-api.js
// Wrapper pour football-data.org
// Doc : https://www.football-data.org/documentation/quickstart

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY  = process.env.FOOTBALL_API_KEY;

// ID de la compétition WC 2026 sur football-data.org
// 2000 = FIFA World Cup (sera mis à jour pour 2026)
const WC_ID = 2000;

/**
 * Récupère tous les matchs de la WC terminés
 */
export async function getFinishedMatches() {
  const res = await fetch(
    `${BASE_URL}/competitions/${WC_ID}/matches?status=FINISHED`,
    {
      headers: {
        "X-Auth-Token": API_KEY,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`football-data.org error: ${err.message ?? res.status}`);
  }

  const data = await res.json();
  return data.matches ?? [];
}

/**
 * Récupère les matchs en cours (LIVE)
 */
export async function getLiveMatches() {
  const res = await fetch(
    `${BASE_URL}/competitions/${WC_ID}/matches?status=IN_PLAY,PAUSED`,
    {
      headers: {
        "X-Auth-Token": API_KEY,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`football-data.org error: ${err.message ?? res.status}`);
  }

  const data = await res.json();
  return data.matches ?? [];
}

/**
 * Convertit un nom d'équipe football-data.org vers notre format
 * football-data utilise les noms anglais, on mappe vers nos noms français
 */
export const TEAM_NAME_MAP = {
  "France":          "France",
  "Brazil":          "Brésil",
  "Germany":         "Allemagne",
  "Argentina":       "Argentine",
  "Spain":           "Espagne",
  "Portugal":        "Portugal",
  "England":         "Angleterre",
  "Netherlands":     "Pays-Bas",
  "Belgium":         "Belgique",
  "Mexico":          "Mexique",
  "Canada":          "Canada",
  "USA":             "États-Unis",
  "United States":   "États-Unis",
  "Senegal":         "Sénégal",
  "Morocco":         "Maroc",
  "Japan":           "Japon",
  "South Korea":     "Corée du Sud",
  "Australia":       "Australie",
  "Croatia":         "Croatie",
  "Switzerland":     "Suisse",
  "Uruguay":         "Uruguay",
  "Colombia":        "Colombie",
  "Ecuador":         "Équateur",
  "Tunisia":         "Tunisie",
  "Cameroon":        "Cameroun",
  "Ghana":           "Ghana",
  "South Africa":    "Afrique du Sud",
  "Algeria":         "Algérie",
  "Egypt":           "Égypte",
  "Nigeria":         "Nigeria",
  "Ivory Coast":     "Côte d'Ivoire",
  "Sweden":          "Suède",
  "Norway":          "Norvège",
  "Austria":         "Autriche",
  "Turkey":          "Turquie",
  "Saudi Arabia":    "Arabie Saoudite",
  "Iran":            "Iran",
  "Iraq":            "Irak",
  "Qatar":           "Qatar",
  "Serbia":          "Serbie",
  "Poland":          "Pologne",
  "Czechia":         "Tchéquie",
  "Scotland":        "Écosse",
  "Wales":           "Pays de Galles",
  "Panama":          "Panama",
  "Paraguay":        "Paraguay",
  "Bolivia":         "Bolivie",
  "Haiti":           "Haïti",
  "Jamaica":         "Jamaïque",
  "New Zealand":     "Nouvelle-Zélande",
  "DR Congo":        "RD Congo",
  "Uzbekistan":      "Ouzbékistan",
  "Jordan":          "Jordanie",
  "Cape Verde":      "Cap-Vert",
  "Bosnia and Herzegovina": "Bosnie-et-Herzégovine",
  "Curaçao":         "Curaçao",
};

export function mapTeamName(englishName) {
  return TEAM_NAME_MAP[englishName] ?? englishName;
}
