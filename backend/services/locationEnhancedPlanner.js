import { appendFileSync } from "fs";
import OpenAI from "openai";
import { getTopPlaces } from "./placesService.js";
import { getGooglePlaceImageUrl, getGooglePlaceImageUrls } from "./placeImageService.js";

const EXTERNAL_FETCH_TIMEOUT_MS = 3000;
const commonsImageCache = new Map();
const DEBUG_LOG_PATH = "backend/debug.log";
const ITINERARY_GENERATOR_VERSION = "2026-03-11-r1";

const CROSS_LOCATION_CITIES = new Set([
  "dubai", "london", "paris", "tokyo", "singapore", "newyork", "new york", "mumbai", "delhi",
  "bangkok", "sydney", "barcelona", "amsterdam", "rome", "istanbul", "berlin", "toronto",
  "moscow", "beijing", "shanghai", "seoul", "kualalumpur", "dubai", "abudhabi", "doha",
  "cairo", "nairobi", "johannesburg", "sanfrancisco", "losangeles", "chicago", "miami",
  "kolkata", "hyderabad", "bangalore", "pune", "ahmedabad", "jaipur", "surat", "lucknow"
]);

const GENERIC_IMAGE_PATTERN = /(map(_of|s)|location_map|locator_map|blank_map|flag_of|coat_of_arms|logo|icon|symbol|emblem|seal_of|diagram|chart|graph|route_map|suburban_rail|metro_map|transit_map|system_map|network_map|scheme|transport_map|infrastructure|topology|connectivity|transportation_map|urban_rail|railway_map|transit_network|city_map|street_map|geographical_map|political_map|vector_map|interactive_map|transit_system|route_network|map_icon|transit_icon|navigation|gps_map|system_diagram|network_diagram|schematic|layout|blueprint|plan_of|topography|cartography)/i;
const BAD_IMAGE_SUBJECT_PATTERN = /\b(cat|kitten|dog|puppy|pet|animal|motorcycle|bike|bicycle|scooter|helmet|car|truck|bus|train|auto rickshaw|toy|poster|selfie|portrait|people at home|indoor room)\b/i;
const HARD_BLOCK_PLACE_PATTERN = /\b(police|police station|station house|substation|supermarket|grocery|hypermarket|department store|convenience store|hardware|warehouse|depot|wholesale|bus depot|vehicle yard|petrol pump|gas station|fuel station|atm|bank|clinic|hospital|medical|pharmacy|school|college|university|tuition|hostel|government office|municipal office|corporation office|passport office|court complex|jail|prison|cemetery|crematorium|dump yard|sewage|drain|warehouse|industrial estate)\b/i;
const LOW_SIGNAL_PLACE_PATTERN = /\b(playground|mini park|municipal park|roadside|exterior only|surroundings|service road|bus stand|junction|intersection|parking|empty lot|market complex)\b/i;
const USER_FACING_PLACEHOLDER_PATTERN = /\bplaceholder\b|used only when verified local place data is limited|local attraction|city exploration/i;

const CURATED_CITY_CENTERS = {
  chennai: {
    lat: 13.0827,
    lng: 80.2707,
    displayName: "Chennai, Tamil Nadu",
    boundingBox: {
      south: 12.78,
      north: 13.24,
      west: 80.12,
      east: 80.36
    }
  },
  london: {
    lat: 51.5072,
    lng: -0.1276,
    displayName: "London, United Kingdom",
    boundingBox: {
      south: 51.28,
      north: 51.70,
      west: -0.51,
      east: 0.23
    }
  },
  paris: {
    lat: 48.8566,
    lng: 2.3522,
    displayName: "Paris, France",
    boundingBox: {
      south: 48.79,
      north: 48.92,
      west: 2.22,
      east: 2.43
    }
  },
  "new-york": {
    lat: 40.7128,
    lng: -74.006,
    displayName: "New York City, New York",
    boundingBox: {
      south: 40.67,
      north: 40.83,
      west: -74.06,
      east: -73.90
    }
  },
  pondicherry: {
    lat: 11.9416,
    lng: 79.8083,
    displayName: "Puducherry, India",
    boundingBox: {
      south: 11.86,
      north: 12.04,
      west: 79.76,
      east: 79.87
    }
  },
  madurai: {
    lat: 9.9252,
    lng: 78.1198,
    displayName: "Madurai, Tamil Nadu",
    boundingBox: {
      south: 9.84,
      north: 10.02,
      west: 78.02,
      east: 78.21,
    }
  },
  coimbatore: {
    lat: 11.0168,
    lng: 76.9558,
    displayName: "Coimbatore, Tamil Nadu",
    boundingBox: {
      south: 10.92,
      north: 11.14,
      west: 76.84,
      east: 77.08,
    }
  },
  bangalore: {
    lat: 12.9716,
    lng: 77.5946,
    displayName: "Bengaluru, Karnataka",
    boundingBox: {
      south: 12.84,
      north: 13.10,
      west: 77.46,
      east: 77.74,
    }
  },
  hyderabad: {
    lat: 17.385,
    lng: 78.4867,
    displayName: "Hyderabad, Telangana",
    boundingBox: {
      south: 17.25,
      north: 17.53,
      west: 78.33,
      east: 78.62,
    }
  }
};

const CHENNAI_CURATED_PLACES = [
  { title: "Marina Beach", area: "Triplicane", category: "beach", lat: 13.0505, lng: 80.2824 },
  { title: "Elliot's Beach", area: "Besant Nagar", category: "beach", lat: 12.9983, lng: 80.2729 },
  { title: "Besant Nagar Beach", area: "Besant Nagar", category: "beach", lat: 12.9985, lng: 80.2732 },
  { title: "Ashtalakshmi Temple", area: "Besant Nagar", category: "temple", lat: 12.9988, lng: 80.2708 },
  { title: "Theosophical Society", area: "Adyar", category: "culture", lat: 13.0098, lng: 80.2662 },
  { title: "Kalakshetra Foundation", area: "Thiruvanmiyur", category: "culture", lat: 13.005, lng: 80.2576 },
  { title: "Tholkappia Poonga", area: "Adyar", category: "nature", lat: 13.0067, lng: 80.268 },
  { title: "Kasimedu Fishing Harbour", area: "Royapuram", category: "waterfront", lat: 13.1272, lng: 80.3001 },
  { title: "Santhome Basilica", area: "Santhome", category: "temple", lat: 13.0335, lng: 80.2785 },
  { title: "Kapaleeshwarar Temple", area: "Mylapore", category: "temple", lat: 13.0335, lng: 80.2697 },
  { title: "Nageswara Rao Park", area: "Mylapore", category: "park", lat: 13.0349, lng: 80.2548 },
  { title: "Vivekananda House", area: "Marina", category: "landmark", lat: 13.0476, lng: 80.283 },
  { title: "Chennai Lighthouse", area: "Marina", category: "landmark", lat: 13.0484, lng: 80.2821 },
  { title: "Parthasarathy Temple", area: "Triplicane", category: "temple", lat: 13.0527, lng: 80.2793 },
  { title: "Triplicane Heritage Streets", area: "Triplicane", category: "neighborhood", lat: 13.0558, lng: 80.2767 },
  { title: "Wallajah Mosque", area: "Triplicane", category: "temple", lat: 13.0615, lng: 80.2759 },
  { title: "Chepauk Stadium Exterior", area: "Chepauk", category: "landmark", lat: 13.0636, lng: 80.2805 },
  { title: "Government Museum Chennai", area: "Egmore", category: "museum", lat: 13.0723, lng: 80.2649 },
  { title: "Museum Theatre Egmore", area: "Egmore", category: "museum", lat: 13.0718, lng: 80.2643 },
  { title: "Connemara Public Library", area: "Egmore", category: "museum", lat: 13.0713, lng: 80.2638 },
  { title: "Thousand Lights Mosque", area: "Royapettah", category: "temple", lat: 13.0586, lng: 80.2642 },
  { title: "Ripon Building", area: "Park Town", category: "landmark", lat: 13.0813, lng: 80.2746 },
  { title: "Chennai Central Railway Heritage Facade", area: "Park Town", category: "landmark", lat: 13.0826, lng: 80.2754 },
  { title: "Fort St. George", area: "George Town", category: "landmark", lat: 13.0796, lng: 80.2871 },
  { title: "Madras High Court Exterior", area: "George Town", category: "landmark", lat: 13.0865, lng: 80.2878 },
  { title: "Armenian Church", area: "George Town", category: "culture", lat: 13.0957, lng: 80.2868 },
  { title: "Burma Bazaar Lanes", area: "George Town", category: "market", lat: 13.0894, lng: 80.286 },
  { title: "George Town Heritage Walk", area: "George Town", category: "neighborhood", lat: 13.0922, lng: 80.2858 },
  { title: "Sowcarpet Market Streets", area: "Sowcarpet", category: "market", lat: 13.0947, lng: 80.2828 },
  { title: "Flower Bazaar Wholesale Area", area: "Parry's Corner", category: "market", lat: 13.0919, lng: 80.281 },
  { title: "Royapuram Fishing Harbor", area: "Royapuram", category: "waterfront", lat: 13.1132, lng: 80.2967 },
  { title: "Valluvar Kottam", area: "Nungambakkam", category: "landmark", lat: 13.054, lng: 80.2446 },
  { title: "Semmozhi Poonga", area: "Teynampet", category: "park", lat: 13.0457, lng: 80.2527 },
  { title: "Taj Coromandel", area: "Nungambakkam", category: "stay", lat: 13.0617, lng: 80.2486 },
  { title: "ITC Grand Chola", area: "Guindy", category: "stay", lat: 13.0106, lng: 80.2206 },
  { title: "The Leela Palace Chennai", area: "MRC Nagar", category: "stay", lat: 13.0177, lng: 80.2735 },
  { title: "Amethyst Cafe Courtyard", area: "Royapettah", category: "food", lat: 13.0544, lng: 80.2585 },
  { title: "Express Avenue", area: "Royapettah", category: "mall", lat: 13.0587, lng: 80.2642 },
  { title: "Pondy Bazaar", area: "T Nagar", category: "market", lat: 13.0417, lng: 80.2335 },
  { title: "T Nagar Shopping District", area: "T Nagar", category: "neighborhood", lat: 13.0419, lng: 80.2331 },
  { title: "Panagal Park", area: "T Nagar", category: "park", lat: 13.0412, lng: 80.2345 },
  { title: "Kodambakkam Bridge View", area: "Kodambakkam", category: "landmark", lat: 13.0565, lng: 80.2305 },
  { title: "Vadapalani Murugan Temple", area: "Vadapalani", category: "temple", lat: 13.0517, lng: 80.2125 },
  { title: "Buhari Mount Road", area: "Mount Road", category: "food", lat: 13.0631, lng: 80.2617 },
  { title: "Palmshore Restaurant", area: "Triplicane", category: "food", lat: 13.0572, lng: 80.2758 },
  { title: "Zaitoon Restaurant", area: "Anna Nagar", category: "food", lat: 13.0842, lng: 80.2166 },
  { title: "Chetpet Eco Park", area: "Chetpet", category: "park", lat: 13.074, lng: 80.2442 },
  { title: "Anna Nagar Tower Park", area: "Anna Nagar", category: "park", lat: 13.0855, lng: 80.2109 },
  { title: "VR Chennai", area: "Anna Nagar West", category: "mall", lat: 13.0719, lng: 80.1947 },
  { title: "Koyambedu Market", area: "Koyambedu", category: "market", lat: 13.0694, lng: 80.1947 },
  { title: "Ranganathan Street", area: "T Nagar", category: "market", lat: 13.0404, lng: 80.232 },
  { title: "Birla Planetarium Chennai", area: "Kotturpuram", category: "museum", lat: 13.0108, lng: 80.2432 },
  { title: "Guindy National Park", area: "Guindy", category: "nature", lat: 13.0068, lng: 80.2368 },
  { title: "Raj Bhavan Perimeter View", area: "Guindy", category: "nature", lat: 13.0185, lng: 80.2286 },
  { title: "St Thomas Mount Summit", area: "St Thomas Mount", category: "landmark", lat: 13.0057, lng: 80.2036 },
  { title: "Little Mount Shrine", area: "Saidapet", category: "temple", lat: 13.0153, lng: 80.2206 },
  { title: "Chennai Rail Museum", area: "Villivakkam", category: "museum", lat: 13.1078, lng: 80.2264 },
  { title: "Phoenix Marketcity", area: "Velachery", category: "mall", lat: 12.9913, lng: 80.2184 },
  { title: "Pallikaranai Marshland Viewpoint", area: "Pallikaranai", category: "nature", lat: 12.9492, lng: 80.2164 },
  { title: "Muttukadu Boat House", area: "ECR", category: "waterfront", lat: 12.8276, lng: 80.2416 },
  { title: "DakshinaChitra Museum", area: "ECR", category: "museum", lat: 12.8244, lng: 80.2482 },
  { title: "VGP Snow Kingdom", area: "Injambakkam", category: "landmark", lat: 12.9844, lng: 80.2495 },
  { title: "Kovalam Beach", area: "ECR", category: "beach", lat: 12.7873, lng: 80.2521 },
  { title: "Mahabalipuram Shore Temple", area: "Mahabalipuram", category: "landmark", lat: 12.6208, lng: 80.1932 },
  { title: "Mamallapuram Sculpture Streets", area: "Mahabalipuram", category: "market", lat: 12.6179, lng: 80.1924 },
  { title: "Cholamandal Artists Village", area: "Injambakkam", category: "culture", lat: 12.9218, lng: 80.254 },
  { title: "MGR Film City Roadside", area: "Taramani", category: "landmark", lat: 13.0083, lng: 80.2385 },
  { title: "Adyar Eco Park Riverside", area: "Adyar", category: "nature", lat: 13.0099, lng: 80.2571 },
  { title: "Broken Bridge Viewpoint", area: "Adyar", category: "waterfront", lat: 13.0126, lng: 80.2675 }
];

const LONDON_CURATED_PLACES = [
  { title: "The Regent's Park Mosque", area: "Regent's Park", category: "temple", lat: 51.5237, lng: -0.1586 },
  { title: "East London Mosque", area: "Whitechapel", category: "temple", lat: 51.5175, lng: -0.0634 },
  { title: "Westminster Abbey", area: "Westminster", category: "landmark", lat: 51.4993, lng: -0.1273 },
  { title: "St Paul's Cathedral", area: "City of London", category: "landmark", lat: 51.5138, lng: -0.0984 },
  { title: "Tower Bridge Riverside", area: "Southwark", category: "waterfront", lat: 51.5055, lng: -0.0754 },
  { title: "South Bank Promenade", area: "South Bank", category: "waterfront", lat: 51.5079, lng: -0.1169 },
  { title: "Borough Market", area: "Southwark", category: "market", lat: 51.5055, lng: -0.0910 },
  { title: "Leadenhall Market", area: "City of London", category: "market", lat: 51.5128, lng: -0.0838 },
  { title: "The British Museum", area: "Bloomsbury", category: "museum", lat: 51.5194, lng: -0.1269 },
  { title: "Victoria and Albert Museum", area: "South Kensington", category: "museum", lat: 51.4966, lng: -0.1722 },
  { title: "Kensington Gardens", area: "Kensington", category: "park", lat: 51.5066, lng: -0.1795 },
  { title: "Hyde Park Serpentine", area: "Hyde Park", category: "park", lat: 51.5050, lng: -0.1657 },
  { title: "Covent Garden Piazza", area: "Covent Garden", category: "neighborhood", lat: 51.5117, lng: -0.1230 },
  { title: "Notting Hill Streets", area: "Notting Hill", category: "neighborhood", lat: 51.5099, lng: -0.1974 },
  { title: "Dishoom Covent Garden", area: "Covent Garden", category: "food", lat: 51.5129, lng: -0.1269 },
  { title: "The Great Chase", area: "Clerkenwell", category: "food", lat: 51.5231, lng: -0.1095 },
  { title: "Harrods", area: "Knightsbridge", category: "mall", lat: 51.4994, lng: -0.1632 },
  { title: "Liberty London", area: "Soho", category: "mall", lat: 51.5138, lng: -0.1419 }
];

const PARIS_CURATED_PLACES = [
  { title: "Grande Mosquee de Paris", area: "Latin Quarter", category: "temple", lat: 48.8423, lng: 2.3553 },
  { title: "Paris Grand Mosque Courtyard", area: "5th Arrondissement", category: "temple", lat: 48.8419, lng: 2.3557 },
  { title: "Louvre Museum", area: "1st Arrondissement", category: "museum", lat: 48.8606, lng: 2.3376 },
  { title: "Musee d'Orsay", area: "7th Arrondissement", category: "museum", lat: 48.8600, lng: 2.3266 },
  { title: "Sainte-Chapelle", area: "Ile de la Cite", category: "landmark", lat: 48.8554, lng: 2.3450 },
  { title: "Pont Alexandre III", area: "7th Arrondissement", category: "waterfront", lat: 48.8638, lng: 2.3130 },
  { title: "Seine Riverside Walk", area: "Central Paris", category: "waterfront", lat: 48.8570, lng: 2.3410 },
  { title: "Tuileries Garden", area: "1st Arrondissement", category: "park", lat: 48.8635, lng: 2.3270 },
  { title: "Luxembourg Gardens", area: "6th Arrondissement", category: "park", lat: 48.8462, lng: 2.3372 },
  { title: "Le Marais Lanes", area: "Le Marais", category: "neighborhood", lat: 48.8578, lng: 2.3622 },
  { title: "Montmartre Streets", area: "18th Arrondissement", category: "neighborhood", lat: 48.8867, lng: 2.3431 },
  { title: "Galeries Lafayette", area: "Opera", category: "mall", lat: 48.8720, lng: 2.3320 },
  { title: "Printemps Haussmann", area: "Opera", category: "mall", lat: 48.8724, lng: 2.3295 },
  { title: "Marché des Enfants Rouges", area: "Le Marais", category: "market", lat: 48.8631, lng: 2.3626 },
  { title: "Rue Cler Food Street", area: "7th Arrondissement", category: "market", lat: 48.8559, lng: 2.3048 },
  { title: "Le Confidentiel", area: "1st Arrondissement", category: "food", lat: 48.8618, lng: 2.3402 },
  { title: "Mian Bar", area: "10th Arrondissement", category: "food", lat: 48.8721, lng: 2.3586 }
];

const NEW_YORK_CURATED_PLACES = [
  { title: "The Plaza Hotel", area: "Midtown Manhattan", category: "stay", lat: 40.7644, lng: -73.9747 },
  { title: "The St. Regis New York", area: "Midtown Manhattan", category: "stay", lat: 40.7616, lng: -73.9744 },
  { title: "The Metropolitan Museum of Art", area: "Upper East Side", category: "museum", lat: 40.7794, lng: -73.9632 },
  { title: "Museum of Modern Art", area: "Midtown Manhattan", category: "museum", lat: 40.7614, lng: -73.9776 },
  { title: "Central Park Bethesda Terrace", area: "Central Park", category: "park", lat: 40.774, lng: -73.9701 },
  { title: "Brooklyn Bridge Promenade", area: "Lower Manhattan", category: "waterfront", lat: 40.7061, lng: -73.9969 },
  { title: "Top of the Rock", area: "Midtown Manhattan", category: "landmark", lat: 40.7591, lng: -73.9799 },
  { title: "Empire State Building", area: "Midtown Manhattan", category: "landmark", lat: 40.7484, lng: -73.9857 },
  { title: "Statue of Liberty Viewpoint", area: "Battery Park", category: "waterfront", lat: 40.7033, lng: -74.017 },
  { title: "Rockefeller Center", area: "Midtown Manhattan", category: "landmark", lat: 40.7587, lng: -73.9787 },
  { title: "SoHo Cast-Iron District", area: "SoHo", category: "neighborhood", lat: 40.7233, lng: -74.003 },
  { title: "Fifth Avenue Luxury Boutiques", area: "Midtown Manhattan", category: "mall", lat: 40.7608, lng: -73.9758 },
  { title: "Madison Avenue Designer Row", area: "Upper East Side", category: "mall", lat: 40.7666, lng: -73.9697 },
  { title: "The High Line", area: "Chelsea", category: "park", lat: 40.748, lng: -74.0048 },
  { title: "DUMBO Waterfront", area: "Brooklyn", category: "waterfront", lat: 40.7033, lng: -73.9881 },
  { title: "The River Cafe", area: "Brooklyn", category: "food", lat: 40.7037, lng: -73.9947 },
  { title: "Peak at Hudson Yards", area: "Hudson Yards", category: "food", lat: 40.7538, lng: -74.0025 },
  { title: "The Morgan Library & Museum", area: "Murray Hill", category: "museum", lat: 40.7493, lng: -73.9817 },
  { title: "Grand Central Terminal Main Concourse", area: "Midtown Manhattan", category: "landmark", lat: 40.7527, lng: -73.9772 },
  { title: "Lincoln Center Plaza", area: "Upper West Side", category: "culture", lat: 40.7725, lng: -73.9835 }
];

const PONDICHERRY_CURATED_PLACES = [
  { title: "Promenade Beach", area: "White Town", category: "waterfront", lat: 11.9344, lng: 79.8368 },
  { title: "Rock Beach", area: "White Town", category: "waterfront", lat: 11.9357, lng: 79.8342 },
  { title: "Sri Aurobindo Ashram", area: "White Town", category: "temple", lat: 11.9368, lng: 79.8347 },
  { title: "French Quarter Heritage Streets", area: "White Town", category: "neighborhood", lat: 11.9349, lng: 79.8329 },
  { title: "Basilica of the Sacred Heart of Jesus", area: "Puducherry", category: "temple", lat: 11.9292, lng: 79.8196 },
  { title: "Immaculate Conception Cathedral", area: "Mission Street", category: "temple", lat: 11.9319, lng: 79.8179 },
  { title: "Puducherry Museum", area: "Saint Louis Street", category: "museum", lat: 11.9352, lng: 79.8308 },
  { title: "Bharathi Park", area: "White Town", category: "park", lat: 11.9345, lng: 79.8306 },
  { title: "Aayi Mandapam", area: "Bharathi Park", category: "landmark", lat: 11.9343, lng: 79.8309 },
  { title: "Auroville Matrimandir Viewpoint", area: "Auroville", category: "landmark", lat: 12.0054, lng: 79.8099 },
  { title: "Serenity Beach", area: "Kottakuppam", category: "beach", lat: 11.9676, lng: 79.8466 },
  { title: "Paradise Beach Boat Jetty", area: "Chunnambar", category: "waterfront", lat: 11.8786, lng: 79.8146 },
  { title: "Le Dupleix Courtyard", area: "White Town", category: "stay", lat: 11.9314, lng: 79.8343 },
  { title: "Villa Shanti Courtyard", area: "White Town", category: "food", lat: 11.9342, lng: 79.8326 },
  { title: "Cafe des Arts", area: "White Town", category: "food", lat: 11.9342, lng: 79.8279 },
  { title: "La Villa Heritage Dining", area: "White Town", category: "food", lat: 11.9348, lng: 79.8297 },
  { title: "Goubert Market", area: "MG Road", category: "market", lat: 11.9332, lng: 79.8158 },
  { title: "Jawahar Toy Museum", area: "White Town", category: "museum", lat: 11.9349, lng: 79.8313 }
];

const MADURAI_CURATED_PLACES = [
  { title: "Meenakshi Amman Temple", area: "Temple City Core", category: "temple", lat: 9.9195, lng: 78.1193 },
  { title: "Puthu Mandapam", area: "Temple City Core", category: "market", lat: 9.9187, lng: 78.1196 },
  { title: "Thirumalai Nayakkar Mahal", area: "Mahal Area", category: "landmark", lat: 9.9147, lng: 78.1247 },
  { title: "Gandhi Memorial Museum", area: "Tamukkam", category: "museum", lat: 9.9321, lng: 78.1325 },
  { title: "Vandiyur Mariamman Teppakulam", area: "Vandiyur", category: "waterfront", lat: 9.9182, lng: 78.1463 },
  { title: "Aayiram Kaal Mandapam", area: "Temple City Core", category: "culture", lat: 9.9192, lng: 78.1194 },
  { title: "St. Mary's Cathedral Madurai", area: "East Veli Street", category: "temple", lat: 9.9216, lng: 78.1244 },
  { title: "Kazimar Big Mosque", area: "Kazimar Street", category: "temple", lat: 9.9181, lng: 78.1128 },
  { title: "Banana Market Madurai", area: "Mattuthavani", category: "market", lat: 9.9464, lng: 78.1598 },
  { title: "Madurai Heritage Streets", area: "Old City", category: "neighborhood", lat: 9.9199, lng: 78.1184 },
  { title: "Vilakkuthoon", area: "Old City", category: "landmark", lat: 9.9226, lng: 78.1177 },
  { title: "Mappillai Vinayagar Theatre Street Food Stretch", area: "Town Hall Road", category: "food", lat: 9.9187, lng: 78.1138 },
  { title: "Murugan Idli Shop", area: "West Masi Street", category: "food", lat: 9.9224, lng: 78.1146 },
  { title: "The Banyan Courtyard", area: "KK Nagar", category: "food", lat: 9.9392, lng: 78.1289 },
  { title: "Heritage Madurai", area: "Mellakkal", category: "stay", lat: 9.9794, lng: 78.0654 },
  { title: "The Gateway Hotel Pasumalai", area: "Pasumalai", category: "stay", lat: 9.8884, lng: 78.0935 },
  { title: "Regency Madurai by GRT Hotels", area: "Melur Road", category: "stay", lat: 9.9385, lng: 78.1454 },
  { title: "Samanar Hills Viewpoint", area: "Keelakuyilkudi", category: "nature", lat: 9.8782, lng: 78.0764 },
  { title: "Keelakuyilkudi Jain Beds", area: "Keelakuyilkudi", category: "culture", lat: 9.8775, lng: 78.0776 },
  { title: "Yanaikkal Bridge View", area: "Vaigai Riverside", category: "waterfront", lat: 9.9254, lng: 78.1219 },
  { title: "Town Hall Road Night Bazaar", area: "Town Hall Road", category: "market", lat: 9.9189, lng: 78.1143 },
  { title: "Aruppukottai Road Textile Boutiques", area: "South Gate", category: "mall", lat: 9.9104, lng: 78.1221 },
];

const COIMBATORE_CURATED_PLACES = [
  { title: "Arulmigu Patteeswarar Swamy Temple", area: "Perur", category: "temple", lat: 10.9736, lng: 76.9124 },
  { title: "Marudhamalai Temple", area: "Marudhamalai", category: "temple", lat: 11.0443, lng: 76.8614 },
  { title: "Gass Forest Museum", area: "R.S. Puram", category: "museum", lat: 11.0089, lng: 76.9445 },
  { title: "Gedee Car Museum", area: "Avinashi Road", category: "museum", lat: 11.0005, lng: 76.9708 },
  { title: "VOC Park and Zoo", area: "Town Hall", category: "park", lat: 10.9988, lng: 76.9562 },
  { title: "Race Course Coimbatore", area: "Race Course", category: "park", lat: 10.9942, lng: 76.9676 },
  { title: "Brookefields Mall", area: "R.S. Puram", category: "mall", lat: 11.0128, lng: 76.9566 },
  { title: "Prozone Mall Coimbatore", area: "Sivanandhapuram", category: "mall", lat: 11.0709, lng: 76.9965 },
  { title: "RS Puram Shopping Streets", area: "R.S. Puram", category: "neighborhood", lat: 11.0107, lng: 76.9475 },
  { title: "Town Hall Market Coimbatore", area: "Town Hall", category: "market", lat: 10.9961, lng: 76.9612 },
  { title: "Siruvani Viewpoint Drive", area: "Siruvani Road", category: "nature", lat: 10.9164, lng: 76.8122 },
  { title: "Isha Yoga Center", area: "Velliangiri Foothills", category: "wellness", lat: 10.9868, lng: 76.7354 },
  { title: "Adiyogi Complex", area: "Velliangiri Foothills", category: "landmark", lat: 10.9861, lng: 76.7357 },
  { title: "Eachanari Vinayagar Temple", area: "Eachanari", category: "temple", lat: 10.9571, lng: 76.9904 },
  { title: "Sree Annapoorna Sree Gowrishankar", area: "R.S. Puram", category: "food", lat: 11.0101, lng: 76.9494 },
  { title: "Haribhavanam", area: "Peelamedu", category: "food", lat: 11.0288, lng: 77.0021 },
  { title: "Kove", area: "Race Course", category: "food", lat: 10.9951, lng: 76.9704 },
  { title: "The Residency Towers Coimbatore", area: "Avinashi Road", category: "stay", lat: 11.0046, lng: 76.9679 },
  { title: "Vivanta Coimbatore", area: "Race Course", category: "stay", lat: 10.9956, lng: 76.9688 },
  { title: "Welcomhotel by ITC Hotels RaceCourse", area: "Race Course", category: "stay", lat: 10.9953, lng: 76.9711 },
  { title: "Kovai Kutralam Eco Stretch", area: "Siruvani Foothills", category: "nature", lat: 10.9865, lng: 76.8072 },
  { title: "Ukkadam Lake View", area: "Ukkadam", category: "waterfront", lat: 10.9869, lng: 76.9517 },
];

const BANGALORE_CURATED_PLACES = [
  { title: "Bangalore Palace", area: "Vasanth Nagar", category: "landmark", lat: 12.9987, lng: 77.5920 },
  { title: "Cubbon Park", area: "Central Bengaluru", category: "park", lat: 12.9763, lng: 77.5929 },
  { title: "Lalbagh Botanical Garden", area: "Mavalli", category: "park", lat: 12.9507, lng: 77.5848 },
  { title: "Vidhana Soudha Viewpoint", area: "Central Bengaluru", category: "landmark", lat: 12.9797, lng: 77.5913 },
  { title: "National Gallery of Modern Art Bengaluru", area: "Palace Road", category: "museum", lat: 12.9895, lng: 77.5848 },
  { title: "Church Street", area: "MG Road", category: "neighborhood", lat: 12.9757, lng: 77.6076 },
  { title: "UB City", area: "Ashok Nagar", category: "mall", lat: 12.9717, lng: 77.5962 },
  { title: "Commercial Street", area: "Shivaji Nagar", category: "market", lat: 12.9825, lng: 77.6080 },
  { title: "Bengaluru Palace Grounds Heritage Circuit", area: "Palace Grounds", category: "culture", lat: 12.9991, lng: 77.5910 },
  { title: "Visvesvaraya Industrial and Technological Museum", area: "Kasturba Road", category: "museum", lat: 12.9758, lng: 77.5969 },
  { title: "The Leela Palace Bengaluru", area: "Old Airport Road", category: "stay", lat: 12.9607, lng: 77.6489 },
  { title: "The Ritz-Carlton Bangalore", area: "Residency Road", category: "stay", lat: 12.9674, lng: 77.6012 },
  { title: "Karavalli", area: "Residency Road", category: "food", lat: 12.9670, lng: 77.6010 },
  { title: "Toit Indiranagar", area: "Indiranagar", category: "food", lat: 12.9719, lng: 77.6412 },
  { title: "Nandi Hills Sunrise Ridge", area: "Nandi Hills", category: "nature", lat: 13.3702, lng: 77.6835 },
  { title: "Bangalore Golf Club Outlook", area: "High Grounds", category: "landmark", lat: 12.9866, lng: 77.5806 },
];

const HYDERABAD_CURATED_PLACES = [
  { title: "Charminar", area: "Old City", category: "landmark", lat: 17.3616, lng: 78.4747 },
  { title: "Mecca Masjid", area: "Old City", category: "temple", lat: 17.3605, lng: 78.4736 },
  { title: "Chowmahalla Palace", area: "Old City", category: "landmark", lat: 17.3578, lng: 78.4717 },
  { title: "Salar Jung Museum", area: "Darulshifa", category: "museum", lat: 17.3713, lng: 78.4804 },
  { title: "Golconda Fort", area: "Ibrahim Bagh", category: "landmark", lat: 17.3833, lng: 78.4011 },
  { title: "Qutb Shahi Tombs", area: "Ibrahim Bagh", category: "culture", lat: 17.3967, lng: 78.3961 },
  { title: "Hussain Sagar Lakefront", area: "Tank Bund", category: "waterfront", lat: 17.4239, lng: 78.4738 },
  { title: "Birla Mandir Hyderabad", area: "Hill Fort", category: "temple", lat: 17.4062, lng: 78.4691 },
  { title: "Laad Bazaar", area: "Old City", category: "market", lat: 17.3609, lng: 78.4732 },
  { title: "Shilparamam", area: "HITEC City", category: "culture", lat: 17.4526, lng: 78.3790 },
  { title: "Banjara Hills Design District", area: "Banjara Hills", category: "neighborhood", lat: 17.4163, lng: 78.4382 },
  { title: "Falaknuma Palace", area: "Falaknuma", category: "stay", lat: 17.3317, lng: 78.4676 },
  { title: "Taj Falaknuma Palace", area: "Falaknuma", category: "stay", lat: 17.3315, lng: 78.4678 },
  { title: "The Park Hyderabad", area: "Somajiguda", category: "stay", lat: 17.4234, lng: 78.4672 },
  { title: "Pista House Charminar", area: "Old City", category: "food", lat: 17.3624, lng: 78.4739 },
  { title: "Jewel of Nizam", area: "Golconda", category: "food", lat: 17.3828, lng: 78.4017 },
];

function logDebug(msg) {
  try {
    const timestamp = new Date().toISOString();
    appendFileSync(DEBUG_LOG_PATH, `[${timestamp}] ${msg}\n`);
  } catch (_) { }
}

function normalizeToken(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function formatDisplayName(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function keywordTokens(text) {
  return normalizeToken(text).split(" ").filter((w) => w.length >= 4);
}

function detectCuratedCityKey(destination) {
  const d = String(destination || "").toLowerCase();
  if (d.includes("chennai") || d.includes("madras")) return "chennai";
  if (d.includes("london")) return "london";
  if (d.includes("paris")) return "paris";
  if (d.includes("new york") || d.includes("newyork") || d.includes("nyc") || d.includes("manhattan")) return "new-york";
  if (d.includes("pondicherry") || d.includes("puducherry")) return "pondicherry";
  if (d.includes("madurai")) return "madurai";
  if (d.includes("coimbatore") || d.includes("kovai")) return "coimbatore";
  if (d.includes("bangalore") || d.includes("bengaluru")) return "bangalore";
  if (d.includes("hyderabad")) return "hyderabad";
  return null;
}

function buildCuratedPlaceDescription(place, destinationLabel) {
  const title = place.title;
  const area = place.area;
  const byCategory = {
    beach: `${title} is a popular coastal stop in ${area}, ${destinationLabel}, suited for sunrise and evening walks.`,
    temple: `${title} is a significant spiritual landmark in ${area}, ${destinationLabel}, known for local heritage and architecture.`,
    museum: `${title} is a well-known museum and culture stop in ${area}, ${destinationLabel}, with strong educational value.`,
    park: `${title} is a green urban break in ${area}, ${destinationLabel}, ideal for relaxed walks and local leisure time.`,
    market: `${title} is a lively market zone in ${area}, ${destinationLabel}, suitable for street exploration and local shopping.`,
    food: `${title} is a strong dining anchor in ${area}, ${destinationLabel}, well suited for a more intentional meal stop.`,
    stay: `${title} is a refined hospitality address in ${area}, ${destinationLabel}, better used as a comfort anchor than a filler sightseeing stop.`,
    waterfront: `${title} offers a stronger open-view and waterfront atmosphere in ${area}, ${destinationLabel}, especially effective later in the day.`,
    culture: `${title} adds a culture-led chapter in ${area}, ${destinationLabel}, with more depth than a generic photo stop.`,
    mall: `${title} is a premium shopping district in ${area}, ${destinationLabel}, best used when the travel style calls for design and retail time.`,
    nature: `${title} is a nature-oriented stop in ${area}, ${destinationLabel}, suitable for slower-paced outdoor visits.`,
    landmark: `${title} is a major city landmark in ${area}, ${destinationLabel}, capable of carrying a stronger signature chapter of the day.`,
    neighborhood: `${title} highlights local neighborhood character in ${area}, ${destinationLabel}, and works best when paired with nearby food or design stops.`
  };
  return byCategory[place.category] || `${title} is a notable local stop in ${area}, ${destinationLabel}.`;
}

function getCuratedCityCenter(destination) {
  const key = detectCuratedCityKey(destination);
  if (!key) return null;
  return CURATED_CITY_CENTERS[key] || null;
}

function getCuratedCityPlaces(destination) {
  const key = detectCuratedCityKey(destination);
  if (!key) return [];
  const destinationLabel = formatDisplayName(destination) || destination;
  if (key === "chennai") {
    return CHENNAI_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "london") {
    return LONDON_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "paris") {
    return PARIS_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "new-york") {
    return NEW_YORK_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "pondicherry") {
    return PONDICHERRY_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "madurai") {
    return MADURAI_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "coimbatore") {
    return COIMBATORE_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "bangalore") {
    return BANGALORE_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  if (key === "hyderabad") {
    return HYDERABAD_CURATED_PLACES.map((place) => ({
      title: place.title,
      description: buildCuratedPlaceDescription(place, destinationLabel),
      lat: Number(place.lat),
      lng: Number(place.lng),
      imageUrl: null,
      area: place.area,
      category: place.category
    }));
  }
  return [];
}

function chooseVariant(values, seed) {
  if (!Array.isArray(values) || values.length === 0) return "";
  const index = Math.abs(seed) % values.length;
  return values[index];
}

function rotateUnique(values, offset, count) {
  const safe = uniqueBy((Array.isArray(values) ? values : []).filter(Boolean), (value) => {
    if (typeof value === "string") return value.toLowerCase();
    if (value && typeof value === "object") {
      return normalizeToken(value.title || value.name || value.location || JSON.stringify(value));
    }
    return String(value || "").toLowerCase();
  });
  if (safe.length === 0) return [];
  const normalizedOffset = Math.abs(offset) % safe.length;
  const rotated = safe.slice(normalizedOffset).concat(safe.slice(0, normalizedOffset));
  return rotated.slice(0, Math.min(count, rotated.length));
}

function uniqueBy(arr, keyFn) {
  const seen = new Set();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = EXTERNAL_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function seededOffset(index) {
  const value = Math.sin(index * 9973) * 1e4;
  return (value - Math.floor(value) - 0.5) * 0.18;
}

function imageUrlPassesCrossLocationCheck(imageUrl, destination) {
  const destNorm = normalizeToken(destination);
  const urlNorm = normalizeToken(decodeURIComponent(imageUrl || ""));
  for (const city of CROSS_LOCATION_CITIES) {
    if (city !== destNorm && !destNorm.includes(city) && urlNorm.includes(city)) return false;
  }
  return true;
}

function imageMetadataLooksTravelRelevant(text = "", destination = "", placeTitle = "", category = "") {
  const body = normalizeToken(text);
  if (!body) return true;
  if (BAD_IMAGE_SUBJECT_PATTERN.test(body)) return false;

  const destinationTokens = keywordTokens(destination);
  const placeTokens = keywordTokens(placeTitle);
  const categoryTokens = keywordTokens(category);
  const requiredTokens = [...placeTokens.slice(0, 3), ...destinationTokens.slice(0, 2)];
  const categoryBoost = categoryTokens.some((token) => body.includes(token));
  if (requiredTokens.length === 0) return !BAD_IMAGE_SUBJECT_PATTERN.test(body);
  const hitCount = requiredTokens.filter((token) => body.includes(token)).length;
  return hitCount >= 1 || categoryBoost;
}

function shouldAttachExternalImage(place = {}, destination = "") {
  if (!place || place.synthetic) return false;
  if (hasHardBlockedSignal(place)) return false;
  const kind = inferPlaceKind(place);
  if (kind === "generic") return false;
  if (!place.title || /^local attraction$/i.test(String(place.title || "").trim())) return false;
  if (normalizeToken(place.title).includes(normalizeToken(destination))) return true;
  return ["temple", "museum", "beach", "waterfront", "nature", "stay", "wellness", "park", "food", "mall", "market", "neighborhood", "landmark", "culture"].includes(kind);
}

function normalizeSupplementalPlace(entry = {}, destination = "") {
  const title = String(entry.title || entry.name || "").trim();
  if (!title) return null;
  const lat = Number(entry.lat);
  const lng = Number(entry.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const destinationLabel = formatDisplayName(destination) || destination;
  const category = inferPlaceKind({
    title,
    category: entry.category || "",
    cuisine: entry.cuisine || "",
    description: entry.description || "",
  });
  return {
    title,
    description: entry.description || `${title} is a real place in ${destinationLabel} suited to a ${category} stop.`,
    lat,
    lng,
    imageUrl: null,
    category,
    cuisine: entry.cuisine || "",
    tags: entry.tags || {},
    area: entry.address || entry.area || "",
  };
}

async function fetchCommonsImages(query, destination, placeTitle, limit = 8) {
  const cacheKey = `${normalizeToken(query)}::${normalizeToken(destination)}::${normalizeToken(placeTitle)}::${limit}`;
  if (commonsImageCache.has(cacheKey)) return commonsImageCache.get(cacheKey);
  try {
    const strictQuery = `${placeTitle} ${destination}`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(strictQuery)}&gsrlimit=${Math.min(limit * 3, 30)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&format=json&origin=*`;
    const resp = await fetchWithTimeout(url, {}, 2500);
    if (!resp.ok) { commonsImageCache.set(cacheKey, []); return []; }
    const data = await resp.json();
    const pages = Object.values(data?.query?.pages || {});
    const placeTokensArr = keywordTokens(placeTitle);
    const destTokensArr = keywordTokens(destination);
    const normalized = pages.map((page) => {
      const title = String(page?.title || "");
      const image = page?.imageinfo?.[0];
      const imageUrl = image?.thumburl || image?.url || "";
      const description = String(image?.extmetadata?.ImageDescription?.value || "").toLowerCase();
      const categories = String(image?.extmetadata?.Categories?.value || "").toLowerCase();
      return { title, imageUrl, description, categories };
    }).filter((item) =>
      item.imageUrl.startsWith("http") &&
      /\.(jpg|jpeg|png|webp)(\?|$)/i.test(item.imageUrl) &&
      !GENERIC_IMAGE_PATTERN.test(item.imageUrl) &&
      !GENERIC_IMAGE_PATTERN.test(item.title) &&
      !BAD_IMAGE_SUBJECT_PATTERN.test(`${item.title} ${item.description} ${item.categories}`) &&
      imageUrlPassesCrossLocationCheck(item.imageUrl, destination)
    );
    const strict = normalized.filter((item) => {
      const meta = `${normalizeToken(item.title)} ${item.description} ${item.categories}`;
      const hasPlace = placeTokensArr.length === 0 || placeTokensArr.some((t) => meta.includes(t));
      const hasDest = destTokensArr.length === 0 || destTokensArr.some((t) => meta.includes(t));
      return hasPlace && hasDest && imageMetadataLooksTravelRelevant(meta, destination, placeTitle);
    }).map((i) => i.imageUrl);
    const relaxed = normalized.filter((item) => {
      const meta = `${normalizeToken(item.title)} ${item.description} ${item.categories}`;
      return (destTokensArr.length === 0 || destTokensArr.some((t) => meta.includes(t))) &&
        imageMetadataLooksTravelRelevant(meta, destination, placeTitle);
    }).map((i) => i.imageUrl);
    const urls = strict.length > 0 ? strict : relaxed;
    const uniqueUrls = [...new Set(urls)].slice(0, limit);
    commonsImageCache.set(cacheKey, uniqueUrls);
    return uniqueUrls;
  } catch (_error) {
    commonsImageCache.set(cacheKey, []);
    return [];
  }
}

async function fetchWikipediaSummaryImage(title) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const resp = await fetchWithTimeout(url, {}, 2500);
    if (resp.status === 404) return null;
    const data = await resp.json();
    const imageUrl = data?.originalimage?.source || data?.thumbnail?.source || null;
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return null;
    if (imageUrl && (GENERIC_IMAGE_PATTERN.test(imageUrl) || GENERIC_IMAGE_PATTERN.test(data.title))) return null;
    if (BAD_IMAGE_SUBJECT_PATTERN.test(`${data?.title || ""} ${data?.description || ""} ${data?.extract || ""}`)) return null;
    return imageUrl;
  } catch (_error) {
    return null;
  }
}

async function buildVerifiedImageSet(destination, placeTitle, fallbackImageUrl, photoIndex = 0) {
  const googleQueries = [
    `${placeTitle}, ${destination}`,
    `${placeTitle} ${destination}`,
    `${placeTitle} ${destination} landmark`,
  ];
  const [googlePrimaryCandidates, googleExpandedCandidates] = await Promise.all([
    Promise.all(googleQueries.map((query, idx) =>
      getGooglePlaceImageUrl(query, {
        photoIndex: photoIndex + idx,
        maxwidth: 1200,
      }).catch(() => null)
    )),
    Promise.all(
      googleQueries.map((query, idx) =>
        getGooglePlaceImageUrls(query, {
          startIndex: (photoIndex + idx) % 2,
          maxResults: idx === 0 ? 4 : 3,
          maxwidth: 1200,
        }).catch(() => [])
      )
    ),
  ]);
  const googleUrls = [
    ...googlePrimaryCandidates.map((entry) => entry?.url).filter(Boolean),
    ...googleExpandedCandidates.flat().map((entry) => entry?.url).filter(Boolean),
  ];
  const [q1, q2, q3] = await Promise.all([
    fetchCommonsImages(`${placeTitle} ${destination} landmark`, destination, placeTitle, 10),
    fetchCommonsImages(`${placeTitle} tourist attraction`, destination, placeTitle, 8),
    fetchCommonsImages(`${placeTitle} architecture heritage`, destination, placeTitle, 8)
  ]);
  let merged = uniqueBy(
    [...googleUrls, fallbackImageUrl, ...q1, ...q2, ...q3].filter(Boolean),
    (url) => String(url).toLowerCase()
  );
  if (merged.length === 0) {
    const summaryImage = await fetchWikipediaSummaryImage(placeTitle);
    if (summaryImage) merged = [summaryImage];
  }
  if (merged.length === 0) {
    const destinationImage = await fetchWikipediaSummaryImage(destination);
    if (destinationImage) merged = [destinationImage];
  }
  return merged.filter((url) => imageUrlPassesCrossLocationCheck(url, destination)).slice(0, 8);
}

function pickUniqueCardImages(images = [], usedImageUrls = new Set(), seed = 0) {
  const uniqueImages = uniqueBy(
    (Array.isArray(images) ? images : []).filter(Boolean),
    (url) => String(url).toLowerCase()
  );
  if (!uniqueImages.length) return [];

  const normalizedSeed = Math.max(0, Number(seed) || 0);
  const rotated = uniqueImages.map((_, index) => uniqueImages[(index + (normalizedSeed % uniqueImages.length)) % uniqueImages.length]);
  const fresh = rotated.filter((url) => !usedImageUrls.has(String(url).toLowerCase()));
  const repeated = rotated.filter((url) => usedImageUrls.has(String(url).toLowerCase()));
  const ordered = [...fresh, ...repeated];

  if (ordered[0]) {
    usedImageUrls.add(String(ordered[0]).toLowerCase());
  }
  return ordered;
}

async function fetchWikipediaBulkThumbnails(titles) {
  const results = new Map();
  if (!Array.isArray(titles) || titles.length === 0) return results;
  const chunks = [];
  for (let i = 0; i < titles.length; i += 50) chunks.push(titles.slice(i, i + 50));
  await Promise.all(chunks.map(async (chunk) => {
    try {
      const titleParam = chunk.join('|');
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titleParam)}&prop=pageimages&pithumbsize=1200&format=json&origin=*`;
      const resp = await fetchWithTimeout(url, {}, 4000);
      if (!resp.ok) return;
      const data = await resp.json();
      for (const page of Object.values(data?.query?.pages || {})) {
        const thumb = page?.thumbnail?.source || null;
        if (thumb && page.title) results.set(normalizeToken(page.title), thumb);
      }
    } catch (_) { }
  }));
  return results;
}

function createStaticMapImageUrl(lat, lng, zoom = 14, label = "Location Preview") {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null;
  const palette = [
    ["#0F766E", "#0EA5E9"],
    ["#0369A1", "#2563EB"],
    ["#166534", "#059669"],
    ["#7C2D12", "#EA580C"]
  ];
  const seed = Math.abs(Math.round(nLat * 1e3) + Math.round(nLng * 1e3) + zoom);
  const [start, end] = palette[seed % palette.length];
  const safeLabel = String(label || "Location Preview").replace(/[<>&]/g, "").slice(0, 46);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='${start}'/>
      <stop offset='100%' stop-color='${end}'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='700' fill='url(#bg)'/>
  <g stroke='rgba(255,255,255,0.16)' stroke-width='1'>
    <path d='M0 140 H1200'/><path d='M0 280 H1200'/><path d='M0 420 H1200'/><path d='M0 560 H1200'/>
    <path d='M200 0 V700'/><path d='M400 0 V700'/><path d='M600 0 V700'/><path d='M800 0 V700'/><path d='M1000 0 V700'/>
  </g>
  <g transform='translate(600,320)'>
    <path d='M0 -78 C42 -78 76 -44 76 -2 C76 42 43 72 0 124 C-43 72 -76 42 -76 -2 C-76 -44 -42 -78 0 -78 Z' fill='white' fill-opacity='0.94'/>
    <circle cx='0' cy='-8' r='24' fill='${end}'/>
  </g>
  <text x='72' y='610' fill='white' font-size='40' font-family='Segoe UI, Arial, sans-serif' font-weight='700'>${safeLabel}</text>
  <text x='72' y='652' fill='rgba(255,255,255,0.94)' font-size='24' font-family='Segoe UI, Arial, sans-serif'>Lat ${nLat.toFixed(4)} | Lng ${nLng.toFixed(4)} | Zoom ${zoom}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function createStaticMapAlternatives(lat, lng) {
  return [
    createStaticMapImageUrl(lat, lng, 14, "Overview"),
    createStaticMapImageUrl(lat, lng, 16, "Zoomed In")
  ];
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizePlaceDescription(text, destination) {
  const destinationLabel = formatDisplayName(destination) || destination;
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return `Well-reviewed place to explore in ${destinationLabel}.`;
  const clipped = cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

function buildDailyInsights(destination, travelStyle, interests, day = 1, slotIndex = 0, placeTitle = "", totalDays = 1) {
  const destinationLabel = formatDisplayName(destination) || destination;
  const interestText = interests.length ? interests.join(", ") : "general sightseeing";
  const placeLabel = formatDisplayName(String(placeTitle || destinationLabel).trim()) || destinationLabel;
  const slotName = ["morning", "morning", "afternoon", "afternoon", "evening", "evening", "night", "night"][slotIndex] || "daytime";
  const styleProfile = getStyleProfile(travelStyle);
  const styleRule = getStyleExperienceRule(travelStyle);
  const styleKey = resolveStyleProfileKey(travelStyle);
  const tripPhase = getTripPhase(day, totalDays);
  const daySeed = day * 17 + slotIndex * 31 + placeLabel.length;
  const districts = rotateUnique([
    "old quarter", "riverfront zone", "cultural belt", "central district",
    "garden-side neighborhood", "market streets", "arts district", "heritage lane",
    "local bazaar corridor"
  ], daySeed, 3);
  const routePatterns = {
    luxury: [
      `Wrap ${placeLabel} into a smoother chauffeur-style loop and avoid unnecessary transfers around the ${slotName} window.`,
      `Let ${placeLabel} carry one signature premium moment instead of diluting the route with too many small pivots.`,
      `Anchor the ${slotName} around ${placeLabel}, then move only if the next district clearly improves comfort or atmosphere.`,
    ],
    cultural: [
      `Approach ${placeLabel} as part of a story-led route and leave time for details, inscriptions, or surrounding heritage context.`,
      `Pair ${placeLabel} with adjacent streets, shrines, galleries, or market texture so the route feels historically layered.`,
      `Use the ${slotName} around ${placeLabel} to connect one landmark with one living-culture stop nearby.`,
    ],
    adventure: [
      `Use ${placeLabel} as part of an active loop and keep the route moving without losing recovery windows.`,
      `Cluster ${placeLabel} with nearby movement-based stops so the ${slotName} feels energetic instead of static.`,
      `Keep the transfer around ${placeLabel} efficient so the route protects outdoor time and momentum.`,
    ],
    cinematic: [
      `Time ${placeLabel} for its strongest light and let the route support better frames rather than faster coverage.`,
      `Use the ${slotName} around ${placeLabel} to move between atmospherically strong corners, not just checklist landmarks.`,
      `Keep one flexible pause near ${placeLabel} so light, crowd, or weather can improve the scene.`,
    ],
    urban: [
      `Use ${placeLabel} as one chapter inside a walkable district so the route feels like city flow, not disconnected pins.`,
      `Keep the ${slotName} around ${placeLabel} anchored in one strong neighborhood and layer in cafes, shopping, or street energy nearby.`,
      `Reduce backtracking around ${placeLabel} and let the district reveal multiple city moods in sequence.`,
    ],
    wellness: [
      `Keep the route around ${placeLabel} low-friction and avoid any transfer that adds noise or stress to the ${slotName}.`,
      `Pair ${placeLabel} with a calmer follow-up like tea, gardens, or quiet waterfront breathing space.`,
      `Let the pace soften around ${placeLabel} so the route feels restorative instead of maximized.`,
    ],
    halal: [
      `Keep the route around ${placeLabel} practical, family-friendly, and easy to align with halal dining and prayer timing.`,
      `Use one comfortable loop around ${placeLabel} and avoid detours that add uncertainty or awkward timing.`,
      `Pair ${placeLabel} with a trusted halal meal or calm family-safe stop nearby.`,
    ],
    coastal: [
      `Let ${placeLabel} connect naturally to the shoreline rhythm so the ${slotName} stays open-air and water-led.`,
      `Keep the route around ${placeLabel} close to the sea, promenade, harbour, or breezier edges of the destination.`,
      `Use ${placeLabel} as one chapter in a waterfront sequence rather than breaking inland too early.`,
    ],
    balanced: travelStyle === "packed" ? [
      `Start ${placeLabel} early in the ${slotName} and keep transfers under 25 minutes.`,
      `Cluster ${placeLabel} with nearby stops in one loop to maintain a tight schedule.`,
      `Book timed entry first, then move to nearby streets before peak crowd windows.`,
      `Use direct transfers around ${placeLabel} to protect your same-day itinerary density.`,
    ] : [
      `Keep a relaxed buffer around ${placeLabel} and avoid backtracking between neighborhoods.`,
      `Use one neighborhood loop around ${placeLabel} for the ${slotName} slot.`,
      `Pair ${placeLabel} with a nearby cafe or market stop to keep pacing comfortable.`,
      `Keep one flexible break after ${placeLabel} before moving to the next area.`,
    ],
  }[styleKey] || [];
  const phaseLine = {
    arrival: `Use ${placeLabel} to set the tone for your first day in ${destinationLabel}.`,
    deep: `This part of the trip should make ${destinationLabel} feel more layered and less obvious.`,
    reset: `Keep the pacing easier here so the longer itinerary still has room to breathe.`,
    finale: `Let ${placeLabel} feel like part of a proper closing chapter for ${destinationLabel}.`,
    "finale-build": `Build gently toward the closing stretch instead of peaking too early.`,
  }[tripPhase] || "";
  return {
    nearbyHighlights: [`${placeLabel} surroundings`, `Walkable ${districts[0] || "city"} segment`, `${districts[1] || "viewpoint"} photo point`],
    travelSuggestion: `${chooseVariant(routePatterns, daySeed)} Day ${day} focus.`,
    localFood: `${styleRule.foodHint} Focus area: ${districts[0] || "nearby local areas"}. Preference focus: ${interestText}.`,
    transportationTip: styleKey === "luxury"
      ? "Use pre-arranged transport or the most comfortable direct transfer between premium stops."
      : styleKey === "adventure"
        ? "Start transfers earlier and protect your outdoor window before crowds or heat build."
        : styleKey === "halal"
          ? "Keep transfers simple and predictable so meal timing and prayer access stay easy."
          : styleKey === "wellness"
            ? "Choose the least stressful transfer option even if it is slightly slower."
            : "Shift transfers 20-30 minutes earlier to avoid peak traffic windows.",
    safetyTip: `Keep valuables secured around ${placeLabel} and avoid isolated stretches late evening.`,
    culturalInsight: `At ${placeLabel}, follow local etiquette and observe site-specific guidelines. ${styleProfile.note} ${styleRule.avoid} ${phaseLine}`.trim()
  };
}

const OVERPASS_BASE = "https://overpass-api.de/api/interpreter";

const OSM_PLACE_QUERY_LIBRARY = {
  temple: [
    { key: "amenity", value: "place_of_worship" },
    { key: "building", value: "mosque" }
  ],
  museum: [
    { key: "tourism", value: "museum" },
    { key: "tourism", value: "gallery" }
  ],
  market: [
    { key: "amenity", value: "marketplace" },
    { key: "shop", value: "marketplace" }
  ],
  mall: [
    { key: "shop", value: "mall" }
  ],
  stay: [
    { key: "tourism", value: "hotel" },
    { key: "tourism", value: "resort" },
    { key: "tourism", value: "guest_house" }
  ],
  wellness: [
    { key: "leisure", value: "spa" },
    { key: "amenity", value: "spa" },
    { key: "leisure", value: "fitness_centre" }
  ],
  park: [
    { key: "leisure", value: "park" },
    { key: "leisure", value: "garden" }
  ],
  waterfront: [
    { key: "leisure", value: "marina" },
    { key: "man_made", value: "pier" },
    { key: "tourism", value: "viewpoint" }
  ],
  landmark: [
    { key: "tourism", value: "attraction" },
    { key: "historic", value: "monument" },
    { key: "historic", value: "castle" },
    { key: "tourism", value: "viewpoint" }
  ],
  nature: [
    { key: "leisure", value: "nature_reserve" },
    { key: "natural", value: "peak" },
    { key: "natural", value: "wood" },
    { key: "route", value: "hiking" }
  ],
  beach: [
    { key: "natural", value: "beach" }
  ],
  food: [
    { key: "amenity", value: "restaurant" },
    { key: "amenity", value: "cafe" },
    { key: "amenity", value: "fast_food" },
    { key: "diet:halal", value: "yes" },
    { key: "cuisine", value: "halal" }
  ],
  culture: [
    { key: "tourism", value: "artwork" },
    { key: "historic", value: "memorial" }
  ],
  neighborhood: [
    { key: "place", value: "square" }
  ]
};

function buildStyleQueryKeys(travelStyle = "") {
  const styleKey = resolveStyleProfileKey(travelStyle);
  const profile = getStyleProfile(travelStyle);
  const keys = new Set(Object.values(profile.slotCategories || {}).flat());
  keys.add("landmark");
  keys.add("park");
  keys.add("museum");
  if (styleKey === "halal") {
    keys.add("temple");
    keys.add("food");
    keys.add("market");
    keys.add("park");
  }
  if (styleKey === "luxury") {
    keys.add("stay");
    keys.add("mall");
    keys.add("food");
    keys.add("waterfront");
  }
  if (styleKey === "coastal") {
    keys.add("beach");
    keys.add("waterfront");
  }
  if (styleKey === "adventure" || styleKey === "wellness") {
    keys.add("nature");
    keys.add("park");
    keys.add("waterfront");
  }
  if (styleKey === "wellness") {
    keys.add("wellness");
    keys.add("stay");
  }
  if (styleKey === "urban") {
    keys.add("market");
    keys.add("mall");
    keys.add("food");
  }
  if (styleKey === "cultural") {
    keys.add("temple");
    keys.add("culture");
  }
  return [...keys].filter((key) => Array.isArray(OSM_PLACE_QUERY_LIBRARY[key]) && OSM_PLACE_QUERY_LIBRARY[key].length);
}

function buildOverpassMultiQuery(lat, lng, radiusM, queryDefs = []) {
  const body = queryDefs.map(({ key, value }) => `
    node["${key}"="${value}"](around:${radiusM},${lat},${lng});
    way["${key}"="${value}"](around:${radiusM},${lat},${lng});
    relation["${key}"="${value}"](around:${radiusM},${lat},${lng});
  `).join("\n");
  return `[out:json][timeout:14];
(
${body}
);
out body center 160;`;
}

function inferOsmCategory(tags = {}, name = "") {
  const source = normalizeToken(`${name} ${Object.entries(tags || {}).map(([k, v]) => `${k} ${v}`).join(" ")}`);
  if (/tourism hotel|tourism resort|tourism guest_house|hotel|resort|guest house|riad|lodge/.test(source)) return "stay";
  if (/leisure spa|amenity spa|wellness|hammam|thermal bath|fitness centre/.test(source)) return "wellness";
  if (/place of worship|building mosque|religion muslim|mosque|masjid|cathedral|church|temple|synagogue|shrine/.test(source)) return "temple";
  if (/tourism museum|tourism gallery|museum|gallery/.test(source)) return "museum";
  if (/amenity marketplace|market|bazaar|souk/.test(source)) return "market";
  if (/shop mall|shopping centre|shopping center|mall/.test(source)) return "mall";
  if (/leisure park|leisure garden|garden|park/.test(source)) return "park";
  if (/natural beach|beach/.test(source)) return "beach";
  if (/leisure marina|man made pier|waterfront|harbour|harbor|marina|river|promenade|boardwalk|viewpoint/.test(source)) return "waterfront";
  if (/tourism attraction|historic monument|historic castle|landmark|palace|fort|tower/.test(source)) return "landmark";
  if (/nature reserve|natural peak|wood|forest|trail|cliff|hill/.test(source)) return "nature";
  if (/amenity restaurant|amenity cafe|amenity fast food|cuisine|halal|dining|bistro|eatery/.test(source)) return "food";
  if (/artwork|memorial|heritage|cultural/.test(source)) return "culture";
  if (/square|district|quarter|street/.test(source)) return "neighborhood";
  return "generic";
}

function buildOsmPlaceDescription(name, category, destinationLabel, tags = {}) {
  const cuisine = String(tags.cuisine || "").replace(/_/g, " ").trim();
  const area = tags["addr:suburb"] || tags["addr:city_district"] || tags["addr:neighbourhood"] || tags["addr:city"] || "";
  const categoryLines = {
    temple: `${name} is a notable spiritual stop${area ? ` in ${area}` : ""} within ${destinationLabel}, useful for respectful and practical routing.`,
    museum: `${name} is a museum or gallery stop${area ? ` in ${area}` : ""} in ${destinationLabel}, suitable for deeper culture coverage.`,
    market: `${name} is a local market stop${area ? ` in ${area}` : ""} in ${destinationLabel}, good for street texture and casual browsing.`,
    mall: `${name} is a shopping hub${area ? ` in ${area}` : ""} in ${destinationLabel}, with comfortable indoor pacing.`,
    stay: `${name} is a stay or hospitality anchor${area ? ` in ${area}` : ""} in ${destinationLabel}, useful for comfort-led routing and premium pacing.`,
    wellness: `${name} is a wellness-oriented stop${area ? ` in ${area}` : ""} in ${destinationLabel}, suited for slower recovery-focused pacing.`,
    park: `${name} is a green urban pause${area ? ` in ${area}` : ""} in ${destinationLabel}, ideal for a slower walking stretch.`,
    beach: `${name} offers an open coastal setting${area ? ` in ${area}` : ""} around ${destinationLabel}, rewarding in calmer light.`,
    waterfront: `${name} gives a waterfront or viewpoint moment${area ? ` in ${area}` : ""} in ${destinationLabel}, with strong scenic value.`,
    landmark: `${name} is a recognizable city landmark${area ? ` in ${area}` : ""} in ${destinationLabel}, useful as a sightseeing anchor.`,
    nature: `${name} adds a nature-oriented break${area ? ` in ${area}` : ""} around ${destinationLabel}, suited for gentler outdoor time.`,
    food: `${name}${cuisine ? ` serves ${cuisine}` : " is a dining stop"}${area ? ` in ${area}` : ""} within ${destinationLabel}, helpful for a grounded local meal stop.`,
    culture: `${name} adds a cultural layer${area ? ` in ${area}` : ""} in ${destinationLabel}, complementing broader sightseeing.`,
    neighborhood: `${name} reflects local district character${area ? ` in ${area}` : ""} within ${destinationLabel}.`,
  };
  return categoryLines[category] || `${name} is a real mapped stop in ${destinationLabel}.`;
}

function isUsefulPlaceName(name = "") {
  const normalized = normalizeToken(name);
  if (!normalized || normalized.length < 3) return false;
  if (/^(unnamed|unknown|yes|no|restaurant|cafe|park|museum|mosque|hotel|attraction)$/.test(normalized)) return false;
  if (/^list of /.test(normalized)) return false;
  return true;
}

async function fetchOsmPlacesNear(destination, geo, travelStyle, targetCount = 72) {
  try {
    if (!geo?.lat || !geo?.lng) return [];
    const queryKeys = buildStyleQueryKeys(travelStyle);
    const queryDefs = uniqueBy(queryKeys.flatMap((key) => OSM_PLACE_QUERY_LIBRARY[key] || []), ({ key, value }) => `${key}:${value}`);
    if (!queryDefs.length) return [];
    const radiusM = geo.isCityLevel === false ? 18000 : 12000;
    const query = buildOverpassMultiQuery(geo.lat, geo.lng, radiusM, queryDefs);
    const res = await fetchWithTimeout(OVERPASS_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AI-TP-Connection/1.0"
      },
      body: `data=${encodeURIComponent(query)}`
    }, 5000);
    if (!res.ok) return [];
    const data = await res.json();
    const destinationLabel = formatDisplayName(destination) || destination;
    const parsed = (data?.elements || []).map((el) => {
      const tags = el.tags || {};
      const title = tags.name || tags["name:en"] || null;
      const lat = Number(el.lat ?? el.center?.lat);
      const lng = Number(el.lon ?? el.center?.lon);
      const category = inferOsmCategory(tags, title);
      return {
        title,
        description: buildOsmPlaceDescription(title || "Local stop", category, destinationLabel, tags),
        lat,
        lng,
        imageUrl: null,
        category,
        tags,
        cuisine: tags.cuisine || "",
        area: tags["addr:suburb"] || tags["addr:city_district"] || tags["addr:neighbourhood"] || ""
      };
    }).filter((place) => {
      if (!isUsefulPlaceName(place.title)) return false;
      if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return false;
      if (geo.boundingBox && !isInsideBoundingBox(place, geo.boundingBox)) return false;
      if (haversineKm(geo.lat, geo.lng, place.lat, place.lng) > 70) return false;
      return true;
    });
    return uniqueBy(parsed, (place) => normalizeToken(place.title)).slice(0, targetCount);
  } catch (_) {
    return [];
  }
}

async function geocodeDestination(destination) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(destination)}&addressdetails=1`;
    const resp = await fetchWithTimeout(url, { headers: { "User-Agent": "AI-TP-Connection/1.0" } }, 2500);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const top = data[0];
    const centerLat = Number(top.lat);
    const centerLng = Number(top.lon);
    let box = Array.isArray(top.boundingbox) && top.boundingbox.length === 4 ? {
      south: Number(top.boundingbox[0]),
      north: Number(top.boundingbox[1]),
      west: Number(top.boundingbox[2]),
      east: Number(top.boundingbox[3])
    } : null;
    if (box) {
      const boxHeightKm = haversineKm(box.south, centerLng, box.north, centerLng);
      const boxWidthKm = haversineKm(centerLat, box.west, centerLat, box.east);
      const maxDimKm = Math.max(boxHeightKm, boxWidthKm);
      if (maxDimKm > 120) {
        const cap = 0.55; 
        box = { south: centerLat - cap, north: centerLat + cap, west: centerLng - cap, east: centerLng + cap };
      }
    }
    return { lat: centerLat, lng: centerLng, displayName: top.display_name || destination, boundingBox: box, isCityLevel: /(city|town|village|municipality|suburb|neighbourhood)/.test(String(top.type || top.class || "").toLowerCase()) };
  } catch (_) { return null; }
}

async function fetchWikiPlacesNear(destination, lat, lng, radiusM = 25000, limit = 80) {
  try {
    const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=${radiusM}&gslimit=${limit}&format=json&origin=*`;
    const geoResp = await fetchWithTimeout(geoUrl, {}, 2500);
    if (!geoResp.ok) return [];
    const geoData = await geoResp.json();
    const geoList = geoData?.query?.geosearch || [];
    if (!Array.isArray(geoList) || geoList.length === 0) return [];
    const pageIds = geoList.map((p) => p.pageid).slice(0, 80).join("|");
    const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=coordinates|pageimages|description|extracts&pageids=${pageIds}&exintro=1&explaintext=1&pithumbsize=1200&format=json&origin=*`;
    const detailsResp = await fetchWithTimeout(detailsUrl, {}, 2500);
    const details = detailsResp.ok ? await detailsResp.json() : {};
    const pagesObj = details?.query?.pages || {};
    const byId = new Map(Object.entries(pagesObj).map(([id, page]) => [Number(id), page]));
    const destTokens = destination ? keywordTokens(destination) : [];
    return geoList.map((geo) => {
      const detail = byId.get(Number(geo.pageid)) || {};
      return { title: geo.title || detail.title || "Local attraction", description: detail.extract || detail.description || `Popular place near ${geo.title || "city center"}.`, lat: Number(geo.lat), lng: Number(geo.lon), imageUrl: detail?.thumbnail?.source || null };
    }).filter((p) => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
      if (haversineKm(lat, lng, p.lat, p.lng) > 60) return false;
      if (destTokens.length > 0 && p.title && p.description) {
        const textBody = normalizeToken(`${p.title} ${p.description}`);
        if (!destTokens.some((t) => textBody.includes(t))) return false;
      }
      return true;
    });
  } catch (_) { return []; }
}

function activitySummaryByInterest(interests, seed = 0) {
  if (interests.includes("Food & Culinary")) return chooseVariant(["Focused on regional specialties.", "Built around authentic local cuisine.", "Combines culinary highlights."], seed);
  return chooseVariant(["Balanced city highlights.", "Designed for broad city coverage.", "Combines key local highlights."], seed);
}

function resolveStyleProfileKey(travelStyle = "") {
  const normalized = normalizeToken(travelStyle).replace(/\s+/g, "");
  if (!normalized) return "balanced";
  const match = Object.entries(STYLE_CITY_PROFILES).find(([, profile]) =>
    (profile.aliases || []).some((alias) => normalizeToken(alias).replace(/\s+/g, "") === normalized)
  );
  return match?.[0] || "balanced";
}

function getStyleProfile(travelStyle = "") {
  return STYLE_CITY_PROFILES[resolveStyleProfileKey(travelStyle)] || STYLE_CITY_PROFILES.balanced;
}

function getStyleExperienceRule(travelStyle = "") {
  return STYLE_EXPERIENCE_RULES[resolveStyleProfileKey(travelStyle)] || STYLE_EXPERIENCE_RULES.balanced;
}

function getTripPhase(day = 1, totalDays = 1) {
  const safeDay = Math.max(1, Number(day) || 1);
  const safeTotal = Math.max(1, Number(totalDays) || 1);
  if (safeDay === 1) return "arrival";
  if (safeDay === safeTotal) return "finale";
  if (safeTotal <= 4) return safeDay === 2 ? "core" : "deep";
  const progress = safeDay / safeTotal;
  if (progress <= 0.28) return "core";
  if (progress <= 0.6) return "deep";
  if (progress <= 0.82) return "reset";
  return "finale-build";
}

function buildStyleDayTheme(travelStyle = "", day = 1, totalDays = 1) {
  const profile = getStyleProfile(travelStyle);
  const themes = Array.isArray(profile.dayThemes) && profile.dayThemes.length ? profile.dayThemes : CITY_ITINERARY_DAY_THEMES;
  const base = themes[(Math.max(1, day) - 1) % themes.length] || `Day ${day}`;
  const phase = getTripPhase(day, totalDays);
  const suffix = {
    reset: " - Slower Chapter",
    "finale-build": " - Closing Build",
    finale: " - Grand Finish",
  }[phase] || "";
  return `${base}${suffix}`;
}

function inferPlaceKind(place = {}) {
  const category = normalizeToken(place.category || "");
  const title = normalizeToken(place.title || "");
  const description = normalizeToken(place.description || "");
  const tags = normalizeToken(Object.entries(place.tags || {}).map(([key, value]) => `${key} ${value}`).join(" "));
  const source = `${category} ${title} ${description} ${tags} ${normalizeToken(place.cuisine || "")}`;
  if (/temple|mosque|church|shrine|monastery|cathedral|basilica|sacred/.test(source)) return "temple";
  if (/museum|gallery|archive|heritage|culture/.test(source)) return "museum";
  if (/beach|coast|shore|promenade/.test(source)) return "beach";
  if (/waterfront|harbour|harbor|river|lake|marina|boat/.test(source)) return "waterfront";
  if (/nature reserve|forest|nature|trail|hill|marsh|peak|valley|cliff/.test(source)) return "nature";
  if (/stay|hotel|palace|resort|grand chola|taj coromandel|leela palace/.test(source)) return "stay";
  if (/spa|wellness|hammam|thermal bath|fitness centre|fitness center|meditation|yoga/.test(source)) return "wellness";
  if (/park|garden/.test(source)) return "park";
  if (/restaurant|dining|cuisine|halal|cafe|bistro|eatery|food/.test(source)) return "food";
  if (/mall|shopping centre|shopping center/.test(source)) return "mall";
  if (/market|bazaar|souk|shopping/.test(source)) return "market";
  if (/neighborhood|neighbourhood|street|district|quarter/.test(source)) return "neighborhood";
  if (/landmark|fort|palace|tower|lighthouse|summit|view/.test(source)) return "landmark";
  return category || "generic";
}

function hasHardBlockedSignal(place = {}) {
  const source = normalizeToken(`${place.title || ""} ${place.description || ""} ${place.category || ""} ${Object.entries(place.tags || {}).map(([key, value]) => `${key} ${value}`).join(" ")}`);
  if (HARD_BLOCK_PLACE_PATTERN.test(source)) return true;
  if (LOW_SIGNAL_PLACE_PATTERN.test(source) && !/heritage|museum|cathedral|ashram|promenade|beach|high line|central park|metropolitan museum/.test(source)) return true;
  return false;
}

function getMinimumStyleScore(travelStyle = "", slotName = "morning") {
  const styleKey = resolveStyleProfileKey(travelStyle);
  if (styleKey === "luxury") return slotName === "night" ? 12 : 11;
  if (styleKey === "adventure") return slotName === "night" ? 5 : 8;
  if (styleKey === "cultural") return 8;
  if (styleKey === "halal") return 8;
  if (styleKey === "coastal") return 8;
  if (styleKey === "wellness") return 8;
  if (styleKey === "urban") return 6;
  return 5;
}

function isPlaceAllowedInSlot(place = {}, travelStyle = "", slotName = "morning", slotIndex = 0) {
  const styleKey = resolveStyleProfileKey(travelStyle);
  const kind = inferPlaceKind(place);
  const source = normalizeToken(`${place.title || ""} ${place.description || ""} ${place.category || ""} ${Object.entries(place.tags || {}).map(([key, value]) => `${key} ${value}`).join(" ")}`);
  if (styleKey === "luxury") {
    if (kind === "stay" && ![0, 7].includes(slotIndex)) return false;
    if (kind === "stay" && !["morning", "night"].includes(slotName)) return false;
    if (kind === "food" && !["afternoon", "night"].includes(slotName)) return false;
    if (kind === "temple" && !/palace|heritage|iconic|cathedral|basilica|royal|monument|private/.test(source)) return false;
    if (kind === "museum" && !/museum|gallery|heritage|collection|design|art/.test(source)) return false;
  }
  if (styleKey === "adventure") {
    if (kind === "food" && slotName === "morning") return false;
    if (["stay", "museum", "mall"].includes(kind) && slotIndex < 5) return false;
  }
  if (styleKey === "cultural") {
    if (["mall", "stay", "wellness"].includes(kind) && slotIndex < 6) return false;
  }
  if (styleKey === "cinematic") {
    if (kind === "food" && !["afternoon", "night"].includes(slotName)) return false;
    if (kind === "mall") return false;
  }
  if (styleKey === "urban") {
    if (kind === "temple" && slotIndex < 2) return false;
  }
  if (styleKey === "wellness") {
    if (kind === "market" && slotIndex < 4) return false;
  }
  if (styleKey === "coastal") {
    if (!["beach", "waterfront", "food", "park", "landmark", "culture", "neighborhood"].includes(kind)) return false;
  }
  return true;
}

function isPlaceExcludedForStyle(place = {}, travelStyle = "") {
  const styleKey = resolveStyleProfileKey(travelStyle);
  const kind = inferPlaceKind(place);
  const source = normalizeToken(`${place.title || ""} ${place.description || ""} ${place.category || ""} ${Object.entries(place.tags || {}).map(([key, value]) => `${key} ${value}`).join(" ")}`);
  const halalFoodSignal = /(halal|diet halal yes|diet:halal yes|cuisine halal|buhari|palmshore|zaitoon|confidentiel|great chase|mian bar|arab|arabic|middle eastern|lebanese|turkish|pakistani|indian|malaysian|indonesian|mughlai|kebab|shawarma|biryani)/;
  if (hasHardBlockedSignal(place)) return true;
  if (kind === "generic") return true;
  if (styleKey === "halal" && /(bar|pub|club|nightclub|wine|brewery|cocktail|casino|liquor|alcohol)/.test(source)) return true;
  if (styleKey === "halal" && /( vr chennai |marketcity|shopping centre|shopping center|\bmall\b)/.test(` ${source} `)) return true;
  if (styleKey === "halal" && kind === "mall") return true;
  if (styleKey === "halal" && kind === "food" && !halalFoodSignal.test(source)) return true;
  if (styleKey === "wellness" && /(nightclub|casino|liquor|cocktail)/.test(source)) return true;
  if (styleKey === "wellness" && /(arcade|gaming|mall|food court|loud music|sports bar)/.test(source)) return true;
  if (styleKey === "luxury" && /(budget|hostel|dormitory|discount|value|mart|wholesale|food court|canteen)/.test(source)) return true;
  if (styleKey === "luxury" && /park/.test(kind) && !/central park|luxembourg|tuileries|high line|kensington|hyde park|bharathi park/.test(source)) return true;
  if (styleKey === "luxury" && /market/.test(kind) && !/fifth avenue|madison avenue|harrods|liberty london|galeries lafayette|printemps/.test(source)) return true;
  if (styleKey === "luxury" && kind === "temple" && !/palace|heritage|iconic|monument|royal|cathedral|basilica/.test(source)) return true;
  if (styleKey === "luxury" && kind === "food" && /(fast food|canteen|mess|food court)/.test(source)) return true;
  if (styleKey === "adventure" && /(mall|museum|stay)/.test(kind)) return true;
  if (styleKey === "adventure" && /(indoor|shopping|boutique)/.test(source)) return true;
  if (styleKey === "adventure" && /(spa|wellness|tea room|lounge)/.test(source)) return true;
  if (styleKey === "cultural" && /(mall|supermarket|grocery|resort)/.test(source)) return true;
  if (styleKey === "cultural" && kind === "food" && /(fast food|food court)/.test(source)) return true;
  if (styleKey === "cinematic" && /(mall|warehouse|supermarket|industrial)/.test(source)) return true;
  if (styleKey === "urban" && /(forest|marsh|village trail|hiking route)/.test(source)) return true;
  if (styleKey === "coastal" && !/(beach|coast|shore|waterfront|harbour|harbor|river|lake|sea|promenade|boat|marina|view|coastal)/.test(source) && ["beach", "waterfront", "nature", "park", "landmark", "food", "neighborhood"].includes(kind) === false) return true;
  return false;
}

function scorePlaceForStyle(place, travelStyle, slotName, day, totalDays) {
  const profile = getStyleProfile(travelStyle);
  const styleKey = resolveStyleProfileKey(travelStyle);
  const desired = profile.slotCategories?.[slotName] || profile.slotCategories?.morning || [];
  const kind = inferPlaceKind(place);
  const source = normalizeToken(`${place.title || ""} ${place.description || ""} ${place.category || ""} ${Object.entries(place.tags || {}).map(([key, value]) => `${key} ${value}`).join(" ")}`);
  let score = 0;
  if (desired.includes(kind)) score += 8;
  if (kind === "waterfront" && /coastal|cinematic|luxury/.test(styleKey)) score += 4;
  if (kind === "temple" && /cultural|halal|wellness/.test(styleKey)) score += 4;
  if (kind === "market" && /urban|halal|cultural/.test(styleKey)) score += 3;
  if (kind === "mall" && /luxury|urban/.test(styleKey)) score += 4;
  if (kind === "stay" && /luxury|wellness/.test(styleKey)) score += 8;
  if (kind === "wellness" && /wellness|luxury/.test(styleKey)) score += 8;
  if (kind === "park" && /wellness|adventure|cinematic|coastal/.test(styleKey)) score += 3;
  if (kind === "nature" && /wellness|adventure|cinematic|coastal/.test(styleKey)) score += 4;
  if (kind === "museum" && /cultural|urban|luxury/.test(styleKey)) score += 3;
  if (kind === "food" && /halal|luxury|urban|balanced|coastal/.test(styleKey)) score += 4;
  if (kind === "landmark" && /cultural|luxury|urban|halal|balanced/.test(styleKey)) score += 2;
  if (kind === "beach" && /coastal|cinematic|wellness/.test(styleKey)) score += 4;

  if (styleKey === "halal") {
    if (kind === "temple") score += 12;
    if (kind === "food" && /(halal|diet halal yes|diet:halal yes|arab|middle eastern|lebanese|turkish|pakistani|indian|malaysian|indonesian|mughlai|kebab|shawarma|biryani|buhari|palmshore|zaitoon)/.test(source)) score += 10;
    if (kind === "market" || kind === "park" || kind === "neighborhood") score += 4;
    if (/mosque|masjid|halal|family/.test(source)) score += 10;
    if (kind === "mall") score -= 8;
    if (kind === "beach" || kind === "waterfront") score -= 3;
  } else if (styleKey === "luxury") {
    if (kind === "stay") score += 12;
    if (kind === "mall" || kind === "food" || kind === "museum" || kind === "waterfront") score += 6;
    if (kind === "landmark") score += 5;
    if (/michelin|chef|suite|plaza|st regis|ritz|palace|rooftop|designer|boutique|lounge|river cafe|peak at hudson/.test(source)) score += 8;
    if (/heritage hotel|courtyard|club lounge|afternoon tea|signature dining|fine dining|private/.test(source)) score += 8;
    if (kind === "market") score -= 2;
    if (kind === "nature") score -= 2;
    if (kind === "park") score -= 4;
  } else if (styleKey === "adventure") {
    if (kind === "nature" || kind === "park" || kind === "waterfront" || kind === "beach") score += 7;
    if (kind === "mall" || kind === "museum") score -= 5;
    if (/trail|hike|cliff|ridge|summit|boat|surf|kayak|marsh|national park|bridge promenade|high line|beach/.test(source)) score += 6;
    if (/heritage hotel|designer|boutique|fine dining/.test(source)) score -= 8;
  } else if (styleKey === "coastal") {
    if (kind === "beach" || kind === "waterfront") score += 10;
    if (kind === "mall") score -= 5;
    if (kind === "museum") score -= 2;
    if (/promenade|harbour|harbor|shore|coast|boat|marina|sea view|waterfront/.test(source)) score += 7;
  } else if (styleKey === "wellness") {
    if (kind === "wellness" || kind === "stay") score += 8;
    if (kind === "park" || kind === "nature" || kind === "temple" || kind === "food") score += 6;
    if (kind === "mall") score -= 6;
    if (/spa|ayurveda|tea|garden|retreat|calm|quiet|meditation|yoga/.test(source)) score += 7;
  } else if (styleKey === "urban") {
    if (kind === "market" || kind === "mall" || kind === "food" || kind === "neighborhood") score += 6;
    if (kind === "nature") score -= 3;
    if (/boulevard|district|design|shopping|skyline|modern|cafe|street/.test(source)) score += 5;
  } else if (styleKey === "cultural") {
    if (kind === "temple" || kind === "museum" || kind === "landmark" || kind === "market") score += 6;
    if (kind === "mall") score -= 4;
    if (/temple|heritage|museum|archive|craft|old quarter|historic|cathedral|basilica/.test(source)) score += 6;
  } else if (styleKey === "cinematic") {
    if (/sunrise|sunset|viewpoint|panoramic|architecture|light|waterfront|blue hour|street/.test(source)) score += 7;
  }

  const phase = getTripPhase(day, totalDays);
  if (phase === "arrival" && /landmark|waterfront|park/.test(kind)) score += 2;
  if (phase === "reset" && /park|waterfront|beach|culture/.test(kind)) score += 2;
  if (phase === "finale" && /waterfront|landmark|culture|beach/.test(kind)) score += 2;
  if (hasHardBlockedSignal(place)) score -= 50;
  if (place.synthetic) score -= 12;
  score += (place.title || "").length % 3;
  return score;
}

const SLOT_TIME_LABELS = [
  "Morning",
  "Morning Activity",
  "Afternoon",
  "Afternoon Activity",
  "Evening",
  "Evening Activity",
  "Night",
  "Night Activity",
];

const SLOT_ACTIVITY_FOCUS = [
  "Begin the day with a scenic orientation and easy local discovery.",
  "Dive deeper with a guided route or hands-on cultural stop.",
  "Use the midday window for signature food, museum, or landmark coverage.",
  "Keep momentum with a second focused stop in the same district.",
  "Slow into golden-hour viewpoints and calmer public spaces.",
  "Shift toward local atmosphere, dining, and social energy.",
  "Use the night window for mood, lights, and premium evening pacing.",
  "Close the day with a relaxed final stop or stay experience.",
];

function makePlaceActivity(place, destination, budget, slotIndex, travelStyle, interests, day = 1, totalDays = 1, dayTheme = "") {
  const destinationLabel = formatDisplayName(destination) || destination;
  const concise = normalizePlaceDescription(place.description, destination);
  const insights = buildDailyInsights(destination, travelStyle, interests, day, slotIndex, place.title, totalDays);
  const revisitCount = Number(place.revisitCount || 1);
  const title = revisitCount > 1 ? `${place.title} (Visit ${revisitCount})` : place.title;
  const styleProfile = getStyleProfile(travelStyle);
  const styleKey = resolveStyleProfileKey(travelStyle);
  const styleRule = getStyleExperienceRule(travelStyle);
  const styleClose = {
    luxury: "Favor atmosphere, comfort, and one standout premium moment.",
    cultural: "Let the strongest story or heritage layer guide the stop.",
    adventure: "Keep the momentum active without losing later-day recovery.",
    cinematic: "Give the best light or most rewarding frame enough time to matter.",
    urban: "Let one district reveal several layers instead of over-transferring.",
    wellness: "Protect spaciousness so the experience feels restorative, not packed.",
    halal: "Keep the route comfortable and easy to navigate around practical needs.",
    coastal: "Let the waterfront rhythm shape the pace instead of forcing it inland.",
    balanced: "Balance atmosphere, local texture, and a clear highlight.",
  }[styleKey] || "Balance atmosphere, local texture, and a clear highlight.";
  const kind = inferPlaceKind(place);
  const slotLine = [
    kind === "stay" ? "Use this more as an anchor for comfort and pacing than as a long sightseeing stop." : "",
    kind === "food" ? "Let one memorable dish or dining room detail carry the experience." : "",
    kind === "landmark" ? "Give the place enough time to feel iconic rather than rushed." : "",
    kind === "waterfront" ? "Treat the setting and light as part of the experience, not just the backdrop." : "",
    kind === "museum" ? "Focus on the strongest gallery or collection instead of trying to cover everything." : "",
    kind === "neighborhood" ? "Pair the wider walk with one exact corner, cafe, or design detail that makes it feel local." : "",
  ].find(Boolean) || "Keep the stop intentional so it feels specific rather than generic.";
  const styleLead = {
    luxury: "Use a more refined rhythm here, prioritizing comfort, service, and polish.",
    cultural: "Treat this as a story-carrying chapter with historical or spiritual context.",
    adventure: "Keep the energy active and let movement drive the experience forward.",
    cinematic: "Let the strongest visual angle, light, or composition shape the stop.",
    urban: "Read the district as a living city chapter, not just a single pin on the map.",
    wellness: "Protect calm pacing so the stop feels restorative and breathable.",
    halal: "Keep the experience comfortable, family-friendly, and practical around halal needs.",
    coastal: "Let sea air, openness, and waterfront mood stay central to the experience.",
    balanced: "Keep the stop clear, grounded, and meaningfully different from the rest of the day.",
  }[styleKey] || "Keep the stop clear and intentional.";
  return {
    time: SLOT_TIME_LABELS[slotIndex] || "Anytime",
    title,
    description: `${concise}${concise.endsWith(".") ? "" : "."} ${styleLead} ${SLOT_ACTIVITY_FOCUS[slotIndex] || "Enjoy a well-paced city moment."} ${slotLine} ${activitySummaryByInterest(interests, day * 13 + slotIndex * 7 + title.length)} Day ${day} focus within the ${dayTheme || buildStyleDayTheme(travelStyle, day, totalDays)} chapter. ${styleClose} ${styleRule.openingFocus}`,
    location: `${place.title}, ${destinationLabel}`,
    lat: place.lat,
    lng: place.lng,
    imageUrl: place.imageUrl || null,
    imageAlternatives: Array.isArray(place.imageAlternatives) ? place.imageAlternatives : [],
    cost: normalizeCost(budget, slotIndex + 1),
    tips: travelStyle === "packed" ? "Start early and pre-book timed entries." : `${styleProfile.note} Keep a 30-45 minute buffer.`,
    nearbyHighlights: insights.nearbyHighlights,
    travelSuggestion: insights.travelSuggestion,
    localFood: insights.localFood,
    transportationTip: insights.transportationTip || "Use verified transport.",
    safetyTip: insights.safetyTip || "Keep valuables secure.",
    culturalInsight: insights.culturalInsight || "Follow local etiquette."
  };
}

function normalizeCost(budget, idx) {
  if (budget === "luxury") return `$${180 + idx * 45}-${340 + idx * 60}`;
  if (budget === "moderate") return `$${40 + idx * 15}-${90 + idx * 20}`;
  return `$${10 + idx * 8}-${35 + idx * 10}`;
}

function isInsideBoundingBox(place, boundingBox) {
  if (!boundingBox) return true;
  return place.lat >= boundingBox.south && place.lat <= boundingBox.north && place.lng >= boundingBox.west && place.lng <= boundingBox.east;
}

function makeSyntheticPlace(destination, day, slot, fallbackBase, travelStyle = "balanced") {
  const destinationLabel = formatDisplayName(destination) || destination;
  const styleKey = resolveStyleProfileKey(travelStyle);
  const styleSlotNames = {
    luxury: ["Signature Arrival Window", "Iconic Landmark Chapter", "Luxury Lunch Window", "Boutique Culture Chapter", "Scenic Lounge Moment", "Waterfront Evening Chapter", "Fine Dining Window", "Suite Wind-Down"],
    cultural: ["Old Quarter Orientation", "Sacred Landmark Chapter", "Traditional Lunch Window", "Museum Collection Chapter", "Architecture Walk", "Craft Quarter Chapter", "Story-Led Dinner", "Heritage Night Stroll"],
    adventure: ["Sunrise Trail Start", "Active Landmark Route", "Fuel-Up Lunch Window", "Outdoor Push", "Viewpoint Reward", "Open-Air Exploration", "Recovery Dinner", "Easy Night Reset"],
    cinematic: ["Golden-Light Arrival", "Panorama Walk", "Photo-Worthy Lunch Window", "Architecture Frames", "Blue-Hour Viewpoint", "Atmospheric Street Sequence", "Photo-Friendly Dinner", "Night Scene Close"],
    urban: ["City Pulse Start", "Boulevard Discovery", "Market Lunch Window", "Design District Chapter", "Skyline View", "Lifestyle Neighborhood", "Modern Dining", "City Lights Close"],
    wellness: ["Slow Sunrise Reset", "Garden or Spa Start", "Nourishing Lunch Window", "Quiet Culture Pause", "Waterfront Breathing Space", "Gentle Scenic Walk", "Restorative Dinner", "Calm Stay Finish"],
    halal: ["Prayer-Aware Start", "Mosque Visit", "Halal Lunch Window", "Family-Friendly Culture", "Comfortable Scenic Stop", "Market Without Rush", "Halal Dinner Window", "Quiet Reflection Close"],
    coastal: ["Sea-Breeze Morning", "Promenade Walk", "Coastal Lunch Window", "Harbour Discovery", "Beach Golden Hour", "Waterfront Stroll", "Sea-View Dinner", "Shoreline Night Close"],
    balanced: ["Sunrise Orientation", "Heritage Walk", "Local Lunch Window", "Museum or Craft Chapter", "Golden Hour Viewpoint", "Neighborhood Food Trail", "Night Lights Route", "Stay Wind-Down"],
  };
  const slotName = (styleSlotNames[styleKey] || styleSlotNames.balanced)[slot] || "City Exploration";
  const categoryByStyle = {
    luxury: ["stay", "landmark", "food", "culture", "waterfront", "waterfront", "food", "stay"],
    cultural: ["neighborhood", "temple", "food", "museum", "landmark", "culture", "food", "neighborhood"],
    adventure: ["nature", "landmark", "food", "park", "waterfront", "nature", "food", "park"],
    cinematic: ["landmark", "waterfront", "food", "culture", "waterfront", "neighborhood", "food", "landmark"],
    urban: ["landmark", "neighborhood", "market", "culture", "waterfront", "neighborhood", "food", "landmark"],
    wellness: ["park", "wellness", "food", "culture", "waterfront", "park", "food", "stay"],
    halal: ["temple", "temple", "food", "culture", "park", "market", "food", "culture"],
    coastal: ["beach", "waterfront", "food", "waterfront", "beach", "waterfront", "food", "waterfront"],
    balanced: ["landmark", "culture", "food", "museum", "waterfront", "neighborhood", "food", "stay"],
  };
  return {
    title: `${destinationLabel} ${slotName}`,
    description: `${slotName} in ${destinationLabel}, held as a backup when stronger verified local place data is unavailable for this ${styleKey} itinerary.`,
    lat: Number((fallbackBase.lat + seededOffset(day * 31 + slot * 7)).toFixed(6)),
    lng: Number((fallbackBase.lng + seededOffset(day * 37 + slot * 11)).toFixed(6)),
    imageUrl: null,
    category: (categoryByStyle[styleKey] || categoryByStyle.balanced)[slot] || "generic",
    syntheticDay: day,
    syntheticSlot: slot,
    synthetic: true
  };
}

function buildBackupCardTitle(destination, travelStyle, slotIndex) {
  const destinationLabel = formatDisplayName(destination) || destination;
  const styleKey = resolveStyleProfileKey(travelStyle);
  const slotNames = {
    luxury: ["Arrival Lounge", "Heritage Signature", "Refined Lunch", "Boutique Culture", "Golden-Hour Leisure", "Evening Drive", "Signature Dinner", "Suite Wind-Down"],
    cultural: ["Old Quarter Start", "Sacred Landmark", "Traditional Lunch", "Museum Chapter", "Architecture Walk", "Craft Quarter", "Story-Led Dinner", "Heritage Close"],
    adventure: ["Trail Start", "Outdoor Push", "Fuel Stop", "Active Route", "Viewpoint Reward", "Open-Air Circuit", "Recovery Dinner", "Night Reset"],
    cinematic: ["First Frames", "Panoramic Chapter", "Photo Lunch", "Architecture Frames", "Blue-Hour View", "Atmospheric Streets", "Visual Dinner", "Night Scene Close"],
    urban: ["City Start", "District Route", "Cafe Lunch", "Design Chapter", "Skyline Pause", "Lifestyle District", "City Dinner", "After-Dark Close"],
    wellness: ["Calm Start", "Garden or Spa", "Nourishing Lunch", "Quiet Chapter", "Breathing Space", "Gentle Walk", "Restorative Dinner", "Slow Close"],
    halal: ["Comfort Start", "Prayer-Aware Landmark", "Halal Lunch", "Family Culture", "Scenic Pause", "Market Walk", "Halal Dinner", "Quiet Reflection"],
    coastal: ["Sea-Breeze Start", "Promenade Route", "Coastal Lunch", "Harbour Chapter", "Sunset Shore", "Waterfront Walk", "Sea-View Dinner", "Shoreline Close"],
    balanced: ["Morning Start", "Local Highlight", "Lunch Chapter", "Culture Chapter", "Evening View", "Neighborhood Walk", "Dinner Chapter", "Night Close"],
  };
  return `${destinationLabel} ${((slotNames[styleKey] || slotNames.balanced)[slotIndex] || "Trip Chapter")}`;
}

function buildBackupCardDescription(destination, travelStyle, slotIndex, dayTheme = "") {
  const destinationLabel = formatDisplayName(destination) || destination;
  const styleRule = getStyleExperienceRule(travelStyle);
  const slotFocus = SLOT_ACTIVITY_FOCUS[slotIndex] || "Enjoy a well-paced city moment.";
  return `${slotFocus} Keep this stop grounded in ${destinationLabel} while following the ${dayTheme || "day's"} rhythm. ${styleRule.openingFocus}`;
}

function validateItineraryOutput(dayPlans, destination, travelStyle) {
  return (Array.isArray(dayPlans) ? dayPlans : []).map((dayPlan, dayIndex) => {
    const theme = dayPlan?.theme || buildStyleDayTheme(travelStyle, dayIndex + 1, dayPlans.length);
    const activities = Array.isArray(dayPlan?.activities) ? dayPlan.activities : [];
    const sanitizedActivities = activities.map((activity, slotIndex) => {
      const title = String(activity?.title || "").trim();
      const description = String(activity?.description || "").trim();
      const titleLooksWeak = !title || USER_FACING_PLACEHOLDER_PATTERN.test(title);
      const descriptionLooksWeak = !description || USER_FACING_PLACEHOLDER_PATTERN.test(description);
      const isSynthetic = Boolean(activity?.synthetic || activity?.syntheticSource);
      return {
        ...activity,
        title: titleLooksWeak ? buildBackupCardTitle(destination, travelStyle, slotIndex) : title,
        description: descriptionLooksWeak
          ? buildBackupCardDescription(destination, travelStyle, slotIndex, theme)
          : description.replace(/A placeholder\s+/gi, "").replace(/used only when verified local place data is limited[^.]*\.\s*/gi, ""),
        imageUrl: isSynthetic ? null : (activity?.imageUrl || null),
        imageAlternatives: isSynthetic ? [] : (Array.isArray(activity?.imageAlternatives) ? activity.imageAlternatives : []),
      };
    });
    return {
      ...dayPlan,
      title: USER_FACING_PLACEHOLDER_PATTERN.test(String(dayPlan?.title || ""))
        ? `Day ${dayIndex + 1} in ${formatDisplayName(destination) || destination}`
        : (dayPlan?.title || `Day ${dayIndex + 1} in ${destination}`),
      theme,
      activities: sanitizedActivities,
    };
  });
}

function buildSyntheticPlacePool(destination, days, travelStyle, fallbackBase) {
  const totalDays = Math.max(1, Number(days) || 1);
  const pool = [];
  for (let day = 1; day <= totalDays; day++) {
    for (let slot = 0; slot < 8; slot++) {
      pool.push(makeSyntheticPlace(destination, day, slot, fallbackBase, travelStyle));
    }
  }
  return pool;
}

function pickPlaceForSlot(candidates, usedKeys, globalUsage, lastDayUsed, travelStyle, slotName, day, totalDays, slotIndex = 0) {
  const ranked = [...(Array.isArray(candidates) ? candidates : [])]
    .sort((a, b) => {
      const scorePlace = (place) => {
        const key = normalizeToken(place.title);
        const totalUsage = globalUsage.get(key) || 0;
        const lastDay = lastDayUsed.get(key) || 0;
        const dayGap = lastDay ? day - lastDay : 99;
        let score = scorePlaceForStyle(place, travelStyle, slotName, day, totalDays) - totalUsage * 5;
        if (dayGap === 0) score -= 100;
        else if (dayGap === 1) score -= 16;
        else if (dayGap === 2) score -= 7;
        return score;
      };
      const scoreDiff = scorePlace(b) - scorePlace(a);
      if (scoreDiff !== 0) return scoreDiff;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });

  for (const candidate of ranked) {
    const key = normalizeToken(candidate.title);
    const usage = usedKeys.get(key) || 0;
    const totalUsage = globalUsage.get(key) || 0;
    if (usage === 0) {
      usedKeys.set(key, usage + 1);
      globalUsage.set(key, totalUsage + 1);
      lastDayUsed.set(key, day);
      return candidate;
    }
  }

  const fallback = ranked[slotIndex % Math.max(1, ranked.length)] || null;
  if (fallback) {
    const key = normalizeToken(fallback.title);
    usedKeys.set(key, (usedKeys.get(key) || 0) + 1);
    globalUsage.set(key, (globalUsage.get(key) || 0) + 1);
    lastDayUsed.set(key, day);
  }
  return fallback;
}

function buildSlotCandidatePool(preferredPool, eligiblePlaces, globalUsage) {
  const preferred = Array.isArray(preferredPool) ? preferredPool : [];
  const eligible = Array.isArray(eligiblePlaces) ? eligiblePlaces : [];
  const unusedPreferred = preferred.filter((place) => (globalUsage.get(normalizeToken(place.title)) || 0) === 0);
  const unusedEligible = eligible.filter((place) => (globalUsage.get(normalizeToken(place.title)) || 0) === 0);

  if (unusedPreferred.length >= 2) return unusedPreferred;
  if (unusedEligible.length >= 3) {
    return uniqueBy([...unusedPreferred, ...unusedEligible], (place) => normalizeToken(place.title));
  }
  return preferred.length ? preferred : eligible;
}

function filterSlotPoolByQuality(candidates, travelStyle, slotName, day, totalDays, slotIndex = 0) {
  const minimum = getMinimumStyleScore(travelStyle, slotName);
  const pool = (Array.isArray(candidates) ? candidates : []).filter((candidate) =>
    !hasHardBlockedSignal(candidate) &&
    isPlaceAllowedInSlot(candidate, travelStyle, slotName, slotIndex) &&
    scorePlaceForStyle(candidate, travelStyle, slotName, day, totalDays) >= minimum
  );
  return pool;
}

function shouldUseWikipediaThumb(place = {}) {
  if (!place || place.synthetic) return false;
  const source = normalizeToken(`${place.title || ""} ${place.description || ""} ${place.category || ""}`);
  if (hasHardBlockedSignal(place)) return false;
  if (BAD_IMAGE_SUBJECT_PATTERN.test(source)) return false;
  if (/\b(route|arrival|reset|close|stop|session|district lunch|discovery|wind down|night close)\b/.test(source)) return false;
  return true;
}

const CITY_ITINERARY_DAY_THEMES = [
  "Historic Core",
  "Markets & Culture",
  "Green & Scenic",
  "Modern Local Flow",
  "Food & Evening Atmosphere",
  "Neighborhood Discovery",
];

const STYLE_EXPERIENCE_RULES = {
  luxury: {
    tone: "Write like a concierge designing a polished premium day with comfort, privacy, and standout moments.",
    openingFocus: "Lead with premium stays, landmark heritage with a refined angle, private-feeling dining, designer retail, and elegant evening settings.",
    avoid: "Avoid basic parks, low-signal streets, generic museum filler, budget stops, and practical-only routes unless there is a premium lens.",
    foodHint: "Recommend refined dining, signature desserts, tasting menus, elegant courtyards, and premium coffee or tea rooms.",
  },
  cultural: {
    tone: "Write like a heritage curator connecting monuments, faith, craftsmanship, and local memory.",
    openingFocus: "Lead with temples, museums, old quarters, living craft, archives, markets with story value, and strong heritage landmarks.",
    avoid: "Avoid malls, generic cafes, modern filler, and places that do not deepen the destination's story.",
    foodHint: "Favor traditional dishes, classic local eateries, and food stops with historical or community value.",
  },
  adventure: {
    tone: "Write like an active route designer balancing movement, energy, and recovery.",
    openingFocus: "Lead with hikes, outdoor movement, ridgelines, viewpoints, water activity, walking circuits, and energetic exploration.",
    avoid: "Avoid static museum-heavy pacing, luxury lounging, generic shopping, and low-energy indoor filler.",
    foodHint: "Favor practical fuel-up stops, local protein-rich meals, quick scenic cafes, and recovery dinners after movement.",
  },
  cinematic: {
    tone: "Write like a location scout prioritizing light, composition, atmosphere, and memorable frames.",
    openingFocus: "Lead with viewpoints, architecture, scenic roads, waterfronts, textured streets, blue-hour locations, and photogenic transitions.",
    avoid: "Avoid visually weak interiors, utility stops, random malls, and unatmospheric filler.",
    foodHint: "Favor beautiful dining rooms, rooftop or window-seat moments, and cafes with visual character.",
  },
  urban: {
    tone: "Write like a city editor highlighting modern energy, neighborhoods, design, and social life.",
    openingFocus: "Lead with boulevards, shopping districts, modern landmarks, cafe culture, skyline stops, creative streets, and after-dark city rhythm.",
    avoid: "Avoid slow rural-feeling detours, repetitive heritage filler, and weak suburban stops.",
    foodHint: "Favor trend-forward cafes, standout city dining, late-evening food streets, and districts with local buzz.",
  },
  wellness: {
    tone: "Write like a restorative retreat planner protecting calm, spaciousness, and nervous-system ease.",
    openingFocus: "Lead with spas, gardens, quiet waterfronts, yoga-friendly spaces, tea rooms, calm heritage, and peaceful stays.",
    avoid: "Avoid noisy nightlife, overpacked routes, stressful transfers, and adrenaline-first activities.",
    foodHint: "Favor nourishing breakfasts, calm lunch rooms, lighter dinners, tea stops, and wellness-leaning cuisine.",
  },
  halal: {
    tone: "Write like a respectful family-friendly planner balancing halal access, comfort, and prayer-aware pacing.",
    openingFocus: "Lead with mosques, halal-certified dining, family-safe attractions, easy logistics, and modest comfortable routes.",
    avoid: "Avoid bars, clubs, alcohol-led nightlife, doubtful food stops, and anything inconvenient for prayer timing.",
    foodHint: "Favor halal restaurants, trusted Muslim-friendly cafes, biryani, grills, Middle Eastern, Turkish, or strong local halal options.",
  },
  coastal: {
    tone: "Write like a shoreline travel editor keeping the sea, breeze, and open-air rhythm at the center.",
    openingFocus: "Lead with beaches, promenades, harbours, sea-view cafes, waterfront sunsets, boats, and open coastal movement.",
    avoid: "Avoid inland-only filler, closed interiors, generic shopping, and routes that lose the water-led mood.",
    foodHint: "Favor sea-view dining, beachside cafes, open-air seafood or halal coastal grills where appropriate, and sunset dining.",
  },
  balanced: {
    tone: "Write like a sharp local planner balancing highlights, comfort, and variety.",
    openingFocus: "Blend culture, scenery, neighborhood texture, food, and one or two strong signature highlights each day.",
    avoid: "Avoid repetition, thin filler, and overloading the day with same-feeling stops.",
    foodHint: "Mix signature local dishes, comfortable cafes, and one memorable dinner moment.",
  },
};

const STYLE_CITY_PROFILES = {
  luxury: {
    aliases: ["luxury", "premium"],
    dayThemes: [
      "Arrival & Signature Comfort",
      "Private Heritage Flow",
      "Design, Dining & Refined Districts",
      "Scenic Leisure Chapter",
      "Boutique Culture & Shopping",
      "Soft Luxury & Local Details",
      "Waterfront Aperitif Rhythm",
      "Grand Finale & Night Ambience",
    ],
    slotCategories: {
      morning: ["stay", "landmark", "culture", "park", "beach"],
      afternoon: ["stay", "museum", "culture", "mall", "food", "market"],
      evening: ["waterfront", "beach", "park", "landmark"],
      night: ["stay", "mall", "food", "waterfront", "landmark"],
    },
    note: "Prioritize comfort, premium atmosphere, and one strong signature highlight over volume.",
  },
  cultural: {
    aliases: ["cultural", "history", "heritage"],
    dayThemes: [
      "Arrival & Historic Orientation",
      "Sacred Heritage Trail",
      "Museums & Story Layers",
      "Old Quarter Deep Dive",
      "Markets, Craft & Living Culture",
      "Traditions & Archive Moments",
      "Architecture & Quiet Details",
      "Farewell Through Heritage Streets",
    ],
    slotCategories: {
      morning: ["temple", "landmark", "culture", "museum"],
      afternoon: ["museum", "culture", "market", "neighborhood"],
      evening: ["landmark", "waterfront", "neighborhood", "culture"],
      night: ["culture", "landmark", "neighborhood", "market"],
    },
    note: "Use each day to deepen the destination's story instead of flattening it into generic sightseeing.",
  },
  adventure: {
    aliases: ["adventure", "active"],
    dayThemes: [
      "Arrival & Outdoor Orientation",
      "Active Morning Push",
      "Trail, Ridge & Scenic Movement",
      "Local Action & Recovery Balance",
      "Open-Air Discovery Day",
      "Challenge & Reward Circuit",
      "Waterfront or Peak Reset",
      "Finale Adventure Highlights",
    ],
    slotCategories: {
      morning: ["nature", "park", "waterfront", "landmark"],
      afternoon: ["nature", "park", "market", "neighborhood"],
      evening: ["waterfront", "park", "landmark", "beach"],
      night: ["neighborhood", "market", "culture", "waterfront"],
    },
    note: "Front-load movement and outdoor reward while protecting recovery later in the day.",
  },
  cinematic: {
    aliases: ["cinematic", "scenery", "photography"],
    dayThemes: [
      "Arrival & First Frames",
      "Panoramic Mornings",
      "Texture, Streets & Atmosphere",
      "Scenic Layers & Quiet Vistas",
      "Blue Hour Highlights",
      "Architecture & Light Study",
      "Golden-Hour Finale Build",
      "Farewell Through Best Views",
    ],
    slotCategories: {
      morning: ["beach", "park", "landmark", "nature"],
      afternoon: ["culture", "museum", "neighborhood", "market"],
      evening: ["waterfront", "beach", "landmark", "park"],
      night: ["landmark", "waterfront", "culture", "market"],
    },
    note: "Let light, scenery, and atmosphere decide the strongest moments of the day.",
  },
  urban: {
    aliases: ["urban", "city"],
    dayThemes: [
      "Arrival & City Pulse",
      "Boulevards & District Flow",
      "Markets, Cafes & Design",
      "Modern City Contrasts",
      "Street Culture & Food Energy",
      "Shopping, Skyline & Local Motion",
      "After-Dark Lifestyle Circuit",
      "Final City Highlights",
    ],
    slotCategories: {
      morning: ["landmark", "neighborhood", "park", "culture"],
      afternoon: ["market", "mall", "food", "culture", "museum"],
      evening: ["waterfront", "landmark", "neighborhood", "market"],
      night: ["market", "mall", "food", "neighborhood", "culture"],
    },
    note: "Favor walkable districts, modern local life, and layered city energy.",
  },
  wellness: {
    aliases: ["wellness", "relaxation"],
    dayThemes: [
      "Arrival & Nervous-System Reset",
      "Mindful Morning Flow",
      "Nature, Calm & Gentle Motion",
      "Spa, Tea & Quiet Corners",
      "Sacred Pause & Reflection",
      "Slow Coastal or Garden Day",
      "Deep Rest & Nourishing Meals",
      "Farewell Through Soft Rituals",
    ],
    slotCategories: {
      morning: ["wellness", "park", "nature", "temple", "beach"],
      afternoon: ["wellness", "stay", "park", "culture", "museum", "waterfront"],
      evening: ["waterfront", "beach", "park", "culture"],
      night: ["stay", "wellness", "culture", "food", "waterfront", "park", "neighborhood"],
    },
    note: "Protect calm, recovery, and low-friction pacing instead of maximizing stop count.",
  },
  halal: {
    aliases: ["halal", "halalfriendly"],
    dayThemes: [
      "Arrival & Prayer-Aware Orientation",
      "Mosques, Heritage & Halal Dining",
      "Family-Friendly City Flow",
      "Markets, Modest Comfort & Local Culture",
      "Sacred Architecture & Quiet Stops",
      "Halal Food Trail & Community Pacing",
      "Scenic Calm With Easy Access",
      "Farewell With Comfort & Reflection",
    ],
    slotCategories: {
      morning: ["temple", "culture", "landmark", "park"],
      afternoon: ["market", "food", "culture", "museum", "waterfront"],
      evening: ["waterfront", "park", "neighborhood", "culture"],
      night: ["food", "market", "culture", "neighborhood", "waterfront"],
    },
    note: "Keep the routing comfortable, respectful, and easy to navigate around practical needs.",
  },
  coastal: {
    aliases: ["coastal", "beach"],
    dayThemes: [
      "Arrival & Sea-Breeze Orientation",
      "Promenade & Beach Rhythm",
      "Harbourfront, Boats & Open Water",
      "Seafood, Sand & Slow Afternoons",
      "Clifftop or Island Views",
      "Coastal Culture & Boardwalk Life",
      "Golden-Hour Waterfront Finale",
      "Farewell Through the Shoreline",
    ],
    slotCategories: {
      morning: ["beach", "waterfront", "park", "nature"],
      afternoon: ["waterfront", "food", "market", "culture", "park"],
      evening: ["beach", "waterfront", "landmark", "park"],
      night: ["waterfront", "food", "market", "culture", "neighborhood"],
    },
    note: "Let the waterfront, promenade, and open-air rhythm shape the trip.",
  },
  balanced: {
    aliases: ["balanced"],
    dayThemes: CITY_ITINERARY_DAY_THEMES,
    slotCategories: {
      morning: ["landmark", "park", "temple", "beach"],
      afternoon: ["museum", "market", "food", "culture", "neighborhood"],
      evening: ["waterfront", "landmark", "park", "beach"],
      night: ["market", "food", "culture", "neighborhood", "waterfront"],
    },
    note: "Balance culture, scenery, food, and local atmosphere throughout the trip.",
  },
};

export async function createCityItinerary(destination, days, budget, travelStyle, interests) {
  try {
    const curatedCenter = getCuratedCityCenter(destination);
    const curatedPlaces = getCuratedCityPlaces(destination);
    const usingCurated = Array.isArray(curatedPlaces) && curatedPlaces.length > 0;
    const geo = usingCurated ? curatedCenter : await geocodeDestination(destination);
    const searchRadiusM = geo?.isCityLevel === false ? 40000 : 25000;
    const targetPoolSize = Math.min(140, Math.max(48, Number(days || 1) * 7));
    let places = [];

    if (usingCurated) {
      places = curatedPlaces;
    } else if (geo) {
      const [osmPlaces, wikiPlaces, nearbyRealPlaces] = await Promise.all([
        fetchOsmPlacesNear(destination, geo, travelStyle, targetPoolSize),
        fetchWikiPlacesNear(destination, geo.lat, geo.lng, searchRadiusM, Math.max(80, targetPoolSize)),
        getTopPlaces(geo.lat, geo.lng, destination).catch(() => null),
      ]);
      const supplementalPlaces = [
        ...(nearbyRealPlaces?.attractions || []),
        ...(nearbyRealPlaces?.restaurants || []),
        ...(nearbyRealPlaces?.hotels || []),
      ]
        .map((entry) => normalizeSupplementalPlace(entry, destination))
        .filter(Boolean);
      places = uniqueBy([...osmPlaces, ...wikiPlaces, ...supplementalPlaces], (p) => normalizeToken(p.title));
    }
    
    if (geo && !usingCurated) {
      if (geo.boundingBox) places = places.filter((p) => isInsideBoundingBox(p, geo.boundingBox));
      places = places.filter((p) => haversineKm(geo.lat, geo.lng, p.lat, p.lng) <= 60);
    }

    places = places.filter((place) => !isPlaceExcludedForStyle(place, travelStyle));
    places = uniqueBy(places, (p) => normalizeToken(p.title));

    const fallbackBase = geo ? { lat: geo.lat, lng: geo.lng } : { lat: 0, lng: 0 };
    if (places.length < 8) {
      places = uniqueBy(
        [...places, ...buildSyntheticPlacePool(destination, days, travelStyle, fallbackBase)],
        (p) => normalizeToken(p.title)
      );
    }

    const placeImageCache = new Map();
    const globalUsage = new Map();
    const lastDayUsed = new Map();

    if (usingCurated || places.some((p) => !p.imageUrl)) {
      const wikiThumbs = await fetchWikipediaBulkThumbnails(places.filter((p) => shouldAttachExternalImage(p, destination)).map((p) => p.title));
      for (const p of places) {
        const key = normalizeToken(p.title);
        let images = [];
        if (shouldAttachExternalImage(p, destination)) {
          const wikiThumb = shouldUseWikipediaThumb(p) ? wikiThumbs.get(key) : null;
          images = await buildVerifiedImageSet(destination, p.title, p.imageUrl || wikiThumb || null, Math.abs(key.length));
        }
        placeImageCache.set(key, uniqueBy(images.filter(Boolean), (url) => String(url).toLowerCase()));
      }
    } else {
      for (const p of places) {
        const key = normalizeToken(p.title);
        const images = shouldAttachExternalImage(p, destination)
          ? await buildVerifiedImageSet(destination, p.title, p.imageUrl || null, Math.abs(key.length))
          : [];
        placeImageCache.set(normalizeToken(p.title), uniqueBy(images.filter(Boolean), (url) => String(url).toLowerCase()));
      }
    }

    const dayPlans = [];
    const styleProfile = getStyleProfile(travelStyle);
    const slotNames = ["morning", "morning", "afternoon", "afternoon", "evening", "evening", "night", "night"];
    const usedImageUrls = new Set();
    for (let day = 1; day <= days; day++) {
      const activities = [];
      const dayTheme = buildStyleDayTheme(travelStyle, day, days);
      const rotatedPlaces = rotateUnique(places, day * 7 + destination.length, Math.max(places.length, 8));
      const dayUsedKeys = new Map();
      const realDayPlaces = rotatedPlaces.filter((candidate) => !candidate.synthetic);
      const syntheticDayPlaces = rotatedPlaces.filter((candidate) => candidate.synthetic && candidate.syntheticDay === day);
      const eligiblePlaces = uniqueBy(
        [
          ...realDayPlaces.filter((candidate) => !isPlaceExcludedForStyle(candidate, travelStyle)),
          ...syntheticDayPlaces.filter((candidate) => !isPlaceExcludedForStyle(candidate, travelStyle)),
        ],
        (candidate) => normalizeToken(candidate.title)
      );
      for (let slot = 0; slot < 8; slot++) {
        const slotName = slotNames[slot] || "morning";
        const slotScopedPlaces = uniqueBy(
          [
            ...eligiblePlaces.filter((candidate) => !candidate.synthetic),
            ...eligiblePlaces.filter((candidate) => candidate.synthetic && candidate.syntheticSlot === slot),
          ],
          (candidate) => normalizeToken(candidate.title)
        );
        const slotBasePlaces = slotScopedPlaces.length ? slotScopedPlaces : eligiblePlaces;
        const preferredPool = slotBasePlaces.filter((candidate) =>
          (styleProfile.slotCategories?.[slotName] || []).includes(inferPlaceKind(candidate))
        );
        const sourcePool = filterSlotPoolByQuality(buildSlotCandidatePool(
          preferredPool,
          slotBasePlaces.length ? slotBasePlaces : rotatedPlaces,
          globalUsage
        ), travelStyle, slotName, day, days, slot);
        const relaxedPool = sourcePool.length
          ? sourcePool
          : filterSlotPoolByQuality(slotBasePlaces.length ? slotBasePlaces : rotatedPlaces, travelStyle, slotName, day, days, slot);
        const realRelaxedPool = relaxedPool.filter((candidate) => !candidate.synthetic);
        const place = pickPlaceForSlot(
          realRelaxedPool.length ? realRelaxedPool : relaxedPool,
          dayUsedKeys,
          globalUsage,
          lastDayUsed,
          travelStyle,
          slotName,
          day,
          days,
          slot
        ) || makeSyntheticPlace(destination, day, slot, fallbackBase, travelStyle);
        const key = normalizeToken(place.title);
        let images = placeImageCache.get(key) || [];
        if (!images.length && shouldAttachExternalImage(place, destination)) {
          images = await buildVerifiedImageSet(destination, place.title, place.imageUrl || null, day * 10 + slot);
          placeImageCache.set(key, uniqueBy(images.filter(Boolean), (url) => String(url).toLowerCase()));
        }
        const selectedImages = pickUniqueCardImages(images, usedImageUrls, day * 17 + slot * 5 + key.length);
        activities.push(makePlaceActivity({
          ...place,
          title: formatDisplayName(place.title),
          description: `${normalizePlaceDescription(place.description, destination)} This stop supports the day's ${dayTheme.toLowerCase()} rhythm.`,
          imageUrl: selectedImages[0] || null,
          imageAlternatives: selectedImages.slice(1)
        }, destination, budget, slot, travelStyle, interests, day, days, dayTheme));
      }
      dayPlans.push({ day, title: `Day ${day} in ${destination}`, theme: dayTheme, activities });
    }

    const validatedDayPlans = validateItineraryOutput(dayPlans, destination, travelStyle);
    const total = (budget === "luxury" ? 340 : budget === "moderate" ? 180 : 95) * days;
    return {
      itinerary: validatedDayPlans,
      costBreakdown: { total, currency: "USD", source: usingCurated ? "curated" : "verified" }
    };
  } catch (err) {
    logDebug(`ERROR in createCityItinerary: ${err.message}`);
    return null;
  }
}
