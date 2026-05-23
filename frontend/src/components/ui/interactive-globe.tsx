"use client";

import { cn } from "@/lib/utils";
import { useRef, useEffect, useCallback, useState } from "react";

export interface Marker {
  lat: number;
  lng: number;
  label: string;
  region: string;
  description: string;
  images: string[];
  weather: string;
  temp: string;
  humidity: string;
  windSpeed: string;
  climateAnalysis: string;
  distance?: string;
}

interface GlobeProps {
  className?: string;
  size?: number;
  onMarkerClick?: (marker: Marker) => void;
  selectedMarker?: Marker | null;
}

export const TRAVEL_DESTINATIONS: Marker[] = [
  // ── Europe ──
  { lat: 48.8566, lng: 2.3522, label: "Paris", region: "France",
    description: "The city of light — timeless convergence of art, haute couture, and architectural grandeur.",
    images: ["https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200"],
    weather: "Partly Cloudy", temp: "16°C", humidity: "68%", windSpeed: "14km/h",
    climateAnalysis: "Temperate oceanic. Spring is mild with occasional showers.", distance: "7,759 km from Dubai" },
  { lat: 41.9028, lng: 12.4964, label: "Rome", region: "Italy",
    description: "Eternal city where millennia of civilization meet contemporary passion for life.",
    images: ["https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&q=80&w=1200"],
    weather: "Sunny", temp: "22°C", humidity: "45%", windSpeed: "10km/h",
    climateAnalysis: "Mediterranean. Warm, dry summers perfect for exploration.", distance: "5,483 km from Dubai" },
  { lat: 51.5074, lng: -0.1278, label: "London", region: "UK",
    description: "A global hub where history, finance and culture meet avant-garde innovation.",
    images: ["https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&q=80&w=1200"],
    weather: "Overcast", temp: "13°C", humidity: "75%", windSpeed: "18km/h",
    climateAnalysis: "Maritime temperate. Overcast skies with frequent drizzle.", distance: "5,488 km from Dubai" },
  { lat: 41.3851, lng: 2.1734, label: "Barcelona", region: "Spain",
    description: "Gaudí's living canvas — where Gothic architecture dissolves into sun-drenched beach culture.",
    images: ["https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1464790719320-516ecd75af6c?auto=format&fit=crop&q=80&w=1200"],
    weather: "Sunny", temp: "24°C", humidity: "55%", windSpeed: "12km/h",
    climateAnalysis: "Mediterranean. Warm summers, mild winters. Spring is ideal.", distance: "5,826 km from Dubai" },
  { lat: 52.3676, lng: 4.9041, label: "Amsterdam", region: "Netherlands",
    description: "City of canals, Vermeer, and liberal spirit — 90 islands linked by 1,000 bridges.",
    images: ["https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&q=80&w=1200"],
    weather: "Cloudy", temp: "12°C", humidity: "80%", windSpeed: "19km/h",
    climateAnalysis: "Oceanic. Cool, wet climate. May–Sept most pleasant.", distance: "5,225 km from Dubai" },
  { lat: 48.2082, lng: 16.3738, label: "Vienna", region: "Austria",
    description: "Imperial grandeur where Beethoven, Mozart and Klimt shaped an entire civilisation.",
    images: ["https://images.unsplash.com/photo-1516550135131-fe3dcdd94b0b?auto=format&fit=crop&q=80&w=1200"],
    weather: "Partly Cloudy", temp: "14°C", humidity: "65%", windSpeed: "11km/h",
    climateAnalysis: "Oceanic continental. Warm summers, cold snowy winters.", distance: "4,614 km from Dubai" },
  { lat: 50.0755, lng: 14.4378, label: "Prague", region: "Czech Republic",
    description: "City of a hundred spires — Gothic and baroque architecture frozen in amber.",
    images: ["https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&q=80&w=1200"],
    weather: "Overcast", temp: "11°C", humidity: "72%", windSpeed: "13km/h",
    climateAnalysis: "Continental. Warm summers, harsh winters. Apr–Jun best.", distance: "4,498 km from Dubai" },
  { lat: 37.9838, lng: 23.7275, label: "Athens", region: "Greece",
    description: "Birthplace of democracy — the Acropolis watches over 3,000 years of human history.",
    images: ["https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&q=80&w=1200"],
    weather: "Sunny", temp: "27°C", humidity: "40%", windSpeed: "14km/h",
    climateAnalysis: "Mediterranean. Hot dry summers, mild winters. Oct–May ideal.", distance: "3,041 km from Dubai" },
  { lat: 38.7223, lng: -9.1393, label: "Lisbon", region: "Portugal",
    description: "The city of Fado — hilltop castles, azulejo tiles, and Atlantic sea breeze.",
    images: ["https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&q=80&w=1200"],
    weather: "Sunny", temp: "22°C", humidity: "68%", windSpeed: "15km/h",
    climateAnalysis: "Mediterranean. Mild, sunny. Perfect Oct–May shoulder season.", distance: "6,398 km from Dubai" },
  // ── Americas ──
  { lat: 40.7128, lng: -74.0060, label: "New York", region: "USA",
    description: "The city that never sleeps — infinite energy compressed into an island of steel and ambition.",
    images: ["https://images.unsplash.com/photo-1524769762778-1b6b2de50b74?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&q=80&w=1200"],
    weather: "Variable", temp: "18°C", humidity: "60%", windSpeed: "19km/h",
    climateAnalysis: "Humid continental. Four seasons. Spring and fall ideal.", distance: "11,019 km from Dubai" },
  { lat: -22.9068, lng: -43.1729, label: "Rio de Janeiro", region: "Brazil",
    description: "City of Carnival — where samba and Christ the Redeemer overlook Copacabana.",
    images: ["https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=1200"],
    weather: "Warm", temp: "28°C", humidity: "74%", windSpeed: "13km/h",
    climateAnalysis: "Tropical. December–March summer, occasional heavy rains.", distance: "10,953 km from Dubai" },
  { lat: -34.6037, lng: -58.3816, label: "Buenos Aires", region: "Argentina",
    description: "Paris of South America — tango, steak and the world's best leather goods.",
    images: ["https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&q=80&w=1200"],
    weather: "Partly Cloudy", temp: "20°C", humidity: "65%", windSpeed: "16km/h",
    climateAnalysis: "Humid subtropical. Oct–Apr is summer. Mar is ideal with festivals.", distance: "12,403 km from Dubai" },
  { lat: 19.4326, lng: -99.1332, label: "Mexico City", region: "Mexico",
    description: "One of the world's largest metropolises with Aztec ruins beneath every street.",
    images: ["https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&q=80&w=1200"],
    weather: "Clear", temp: "22°C", humidity: "40%", windSpeed: "10km/h",
    climateAnalysis: "Subtropical highland. March–May dry season with mild warmth.", distance: "13,362 km from Dubai" },
  { lat: 49.2827, lng: -123.1207, label: "Vancouver", region: "Canada",
    description: "Where mountains plunge into the Pacific — mountains, ocean and urban life in harmony.",
    images: ["https://images.unsplash.com/photo-1559511260-66a654ae982a?auto=format&fit=crop&q=80&w=1200"],
    weather: "Rainy", temp: "12°C", humidity: "82%", windSpeed: "20km/h",
    climateAnalysis: "Oceanic. Wet winters, warm dry summers. Jun–Aug peak season.", distance: "11,961 km from Dubai" },
  // ── Asia Pacific ──
  { lat: 35.6762, lng: 139.6503, label: "Tokyo", region: "Japan",
    description: "World's most populous metropolis — where tradition collides with hyper-modernity.",
    images: ["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&q=80&w=1200"],
    weather: "Clear", temp: "21°C", humidity: "58%", windSpeed: "11km/h",
    climateAnalysis: "Humid subtropical. Spring cherry blossoms and autumn colors are peak.", distance: "6,014 km from Dubai" },
  { lat: 37.5665, lng: 126.9780, label: "Seoul", region: "South Korea",
    description: "K-culture capital — palaces, K-Pop, and the world's fastest internet.",
    images: ["https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&q=80&w=1200"],
    weather: "Clear", temp: "18°C", humidity: "55%", windSpeed: "13km/h",
    climateAnalysis: "Continental. Beautiful spring (Apr–May) and fall (Sep–Oct) foliage.", distance: "5,820 km from Dubai" },
  { lat: -8.4095, lng: 115.1889, label: "Bali", region: "Indonesia",
    description: "Island of the Gods — terraced rice paddies, ancient temples and surf culture coexist.",
    images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=1200"],
    weather: "Tropical", temp: "29°C", humidity: "80%", windSpeed: "9km/h",
    climateAnalysis: "Tropical wet/dry. Dry season May–Sep is peak travel.", distance: "4,673 km from Dubai" },
  { lat: 1.3521, lng: 103.8198, label: "Singapore", region: "Singapore",
    description: "City-state of precision — rainforest meets futurist urban architecture.",
    images: ["https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&q=80&w=1200"],
    weather: "Humid", temp: "31°C", humidity: "82%", windSpeed: "12km/h",
    climateAnalysis: "Equatorial. Consistent warmth year-round with afternoon showers.", distance: "3,857 km from Dubai" },
  { lat: 13.7563, lng: 100.5018, label: "Bangkok", region: "Thailand",
    description: "City of angels — frenetic energy, gilded temples and world-class street food.",
    images: ["https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&q=80&w=1200"],
    weather: "Hot", temp: "33°C", humidity: "72%", windSpeed: "8km/h",
    climateAnalysis: "Tropical savanna. November–February ideal cool window.", distance: "4,891 km from Dubai" },
  { lat: 3.1390, lng: 101.6869, label: "Kuala Lumpur", region: "Malaysia",
    description: "Petronas Towers pierce the clouds above the rainforest — gleaming Islamic modernity.",
    images: ["https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=1200"],
    weather: "Humid", temp: "32°C", humidity: "78%", windSpeed: "9km/h",
    climateAnalysis: "Equatorial. Warm year-round. March–April and October–November drier.", distance: "3,584 km from Dubai" },
  { lat: 19.0760, lng: 72.8777, label: "Mumbai", region: "India",
    description: "Maximum city — Bollywood dreams, colonial architecture and unrelenting ambition.",
    images: ["https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&q=80&w=1200"],
    weather: "Warm", temp: "30°C", humidity: "78%", windSpeed: "15km/h",
    climateAnalysis: "Tropical monsoon. Oct–Feb is the dry pleasant season.", distance: "1,923 km from Dubai" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney", region: "Australia",
    description: "Harbour city of iconic beauty — where Opera House meets the infinite Pacific.",
    images: ["https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=1200"],
    weather: "Sunny", temp: "24°C", humidity: "55%", windSpeed: "16km/h",
    climateAnalysis: "Humid subtropical. Dec–Feb summer, peak beach season.", distance: "12,048 km from Dubai" },
  // ── Middle East / Gulf ──
  { lat: 25.2048, lng: 55.2708, label: "Dubai", region: "UAE",
    description: "Architectural fever dream in the desert — futurism and opulence create a singular reality.",
    images: ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?auto=format&fit=crop&q=80&w=1200"],
    weather: "Sunny", temp: "38°C", humidity: "15%", windSpeed: "22km/h",
    climateAnalysis: "Extreme arid desert. Winter (Nov–Mar) ideal for outdoor activities.", distance: "0 km — You are here" },
  { lat: 21.3891, lng: 39.8579, label: "Mecca", region: "Saudi Arabia",
    description: "The holiest city in Islam — destination of the annual Hajj pilgrimage for 2 billion Muslims.",
    images: ["https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=1200"],
    weather: "Arid", temp: "42°C", humidity: "10%", windSpeed: "18km/h",
    climateAnalysis: "Hot desert. Cooler in Dhul-Hijja pilgrimage season.", distance: "1,096 km from Dubai" },
  { lat: 24.5247, lng: 39.5692, label: "Medina", region: "Saudi Arabia",
    description: "The city of the Prophet — Al-Masjid an-Nabawi holds profound spiritual significance.",
    images: ["https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&q=80&w=1200"],
    weather: "Sunny", temp: "38°C", humidity: "12%", windSpeed: "14km/h",
    climateAnalysis: "Hot desert. Oct–Mar offers more comfortable temperatures.", distance: "1,209 km from Dubai" },
  { lat: 31.7683, lng: 35.2137, label: "Jerusalem", region: "Palestine",
    description: "Sacred to three Abrahamic faiths — Al-Aqsa, the Church of the Holy Sepulchre, and the Western Wall.",
    images: ["https://images.unsplash.com/photo-1548232641-ff28b89b83e2?auto=format&fit=crop&q=80&w=1200"],
    weather: "Partly Cloudy", temp: "20°C", humidity: "50%", windSpeed: "10km/h",
    climateAnalysis: "Mediterranean highland. Spring and autumn most comfortable.", distance: "2,106 km from Dubai" },
  { lat: 30.3285, lng: 35.4444, label: "Petra", region: "Jordan",
    description: "Rose-red city carved into sandstone cliffs — one of the New Seven Wonders.",
    images: ["https://images.unsplash.com/photo-1552917073-71b126f649ce?auto=format&fit=crop&q=80&w=1200"],
    weather: "Clear", temp: "25°C", humidity: "25%", windSpeed: "11km/h",
    climateAnalysis: "Arid. March–May and Sep–Nov perfect for exploration.", distance: "1,893 km from Dubai" },
  { lat: 33.5138, lng: 36.2765, label: "Damascus", region: "Syria",
    description: "Oldest continuously inhabited city — souk Al-Hamidiyah and the Umayyad Mosque.",
    images: ["https://images.unsplash.com/photo-1628694521700-9c91c6a97ead?auto=format&fit=crop&q=80&w=1200"],
    weather: "Clear", temp: "24°C", humidity: "30%", windSpeed: "10km/h",
    climateAnalysis: "Mediterranean semi-arid. Spring and autumn most comfortable.", distance: "2,013 km from Dubai" },
  // ── Central Asia / Silk Road ──
  { lat: 39.6542, lng: 66.9597, label: "Samarkand", region: "Uzbekistan",
    description: "Timur's jewel of the Silk Road — Registan Square stuns with turquoise mosaics.",
    images: ["https://images.unsplash.com/photo-1590490359683-5cdb0bce5e13?auto=format&fit=crop&q=80&w=1200"],
    weather: "Clear", temp: "22°C", humidity: "30%", windSpeed: "10km/h",
    climateAnalysis: "Semi-arid continental. Spring (Apr–May) is the golden season.", distance: "3,111 km from Dubai" },
  // ── Africa ──
  { lat: 30.0444, lng: 31.2357, label: "Cairo", region: "Egypt",
    description: "5,000 years of civilization pulse at the foot of the Great Pyramids of Giza.",
    images: ["https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&q=80&w=1200"],
    weather: "Arid", temp: "36°C", humidity: "18%", windSpeed: "20km/h",
    climateAnalysis: "Hot desert. November–March provides ideal conditions.", distance: "2,400 km from Dubai" },
  { lat: -33.9249, lng: 18.4241, label: "Cape Town", region: "South Africa",
    description: "Where the Atlantic meets the Table Mountain — one of Earth's most dramatic cities.",
    images: ["https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&q=80&w=1200"],
    weather: "Sunny", temp: "20°C", humidity: "50%", windSpeed: "22km/h",
    climateAnalysis: "Mediterranean. Dry summer (Nov–Mar). Perfect climate Oct–Apr.", distance: "7,959 km from Dubai" },
  { lat: -1.2921, lng: 36.8219, label: "Nairobi", region: "Kenya",
    description: "Safari gateway and 'Green City in the Sun' — wildlife meets urban sophistication.",
    images: ["https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=1200"],
    weather: "Partly Cloudy", temp: "22°C", humidity: "55%", windSpeed: "14km/h",
    climateAnalysis: "Tropical highland. Dry seasons Jun–Oct and Jan–Feb ideal.", distance: "3,457 km from Dubai" },
  { lat: 33.5731, lng: -7.5898, label: "Casablanca", region: "Morocco",
    description: "Morocco's economic heart — Rick's Café and Hassan II Mosque by the Atlantic.",
    images: ["https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80&w=1200"],
    weather: "Clear", temp: "23°C", humidity: "65%", windSpeed: "18km/h",
    climateAnalysis: "Mediterranean. Mild year-round. Spring and autumn optimal.", distance: "5,428 km from Dubai" },
  { lat: 33.9391, lng: -6.3548, label: "Marrakech", region: "Morocco",
    description: "Labyrinthine medinas, rose-hued kasbahs, and aromatic souks of the Saharan gateway.",
    images: ["https://images.unsplash.com/photo-1489493887464-892be6d1daae?auto=format&fit=crop&q=80&w=1200"],
    weather: "Sunny", temp: "26°C", humidity: "28%", windSpeed: "16km/h",
    climateAnalysis: "Semi-arid. Spring and autumn most comfortable.", distance: "5,337 km from Dubai" },
  { lat: -26.2041, lng: 28.0473, label: "Johannesburg", region: "South Africa",
    description: "City of gold — Africa's economic heartbeat with world-class art, food and history.",
    images: ["https://images.unsplash.com/photo-1577948000111-9c970dfe3743?auto=format&fit=crop&q=80&w=1200"],
    weather: "Partly Cloudy", temp: "22°C", humidity: "40%", windSpeed: "18km/h",
    climateAnalysis: "Subtropical highland. Dry winter (May–Aug) most comfortable.", distance: "6,400 km from Dubai" },
  // ── Russia / Europe East ──
  { lat: 55.7558, lng: 37.6173, label: "Moscow", region: "Russia",
    description: "Capital of contrasts — Red Square grandeur meets avant-garde contemporary art.",
    images: ["https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&q=80&w=1200"],
    weather: "Snowy", temp: "-5°C", humidity: "80%", windSpeed: "14km/h",
    climateAnalysis: "Humid continental. Winters harsh. May–Sept ideal for culture.", distance: "3,323 km from Dubai" },
  { lat: 41.0082, lng: 28.9784, label: "Istanbul", region: "Turkey",
    description: "Where East meets West — minarets, bazaars, and the vast Bosphorus strait.",
    images: ["https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=1200"],
    weather: "Partly Cloudy", temp: "19°C", humidity: "62%", windSpeed: "16km/h",
    climateAnalysis: "Mediterranean continental. April–June and Sept–Oct ideal.", distance: "3,584 km from Dubai" },
  // ── Indian Subcontinent ──
  { lat: 27.1751, lng: 78.0421, label: "Agra", region: "India",
    description: "Home of the Taj Mahal — a monument to eternal love set against the Yamuna.",
    images: ["https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=1200"],
    weather: "Hot", temp: "34°C", humidity: "45%", windSpeed: "12km/h",
    climateAnalysis: "Semi-arid. October–March clearest views of the Taj.", distance: "2,198 km from Dubai" },
  { lat: 7.8731, lng: 80.7718, label: "Colombo", region: "Sri Lanka",
    description: "Pearl of the Indian Ocean — spice gardens, colonial forts and pristine beaches.",
    images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80&w=1200"],
    weather: "Tropical", temp: "30°C", humidity: "80%", windSpeed: "12km/h",
    climateAnalysis: "Tropical monsoon. December–March west coast dry season.", distance: "2,578 km from Dubai" },
  // ── Nordic ──
  { lat: 64.9631, lng: -19.0208, label: "Reykjavik", region: "Iceland",
    description: "Gateway to volcanic landscapes, midnight sun, and the aurora borealis.",
    images: ["https://images.unsplash.com/photo-1474690870753-1b92efa1f2d8?auto=format&fit=crop&q=80&w=1200"],
    weather: "Cloudy", temp: "5°C", humidity: "78%", windSpeed: "25km/h",
    climateAnalysis: "Sub-arctic. Northern lights winter, midnight sun summer.", distance: "6,238 km from Dubai" },
  { lat: 59.9139, lng: 10.7522, label: "Oslo", region: "Norway",
    description: "Fjord city of Vikings — museums, fjords and Nordic design excellence.",
    images: ["https://images.unsplash.com/photo-1546274396-6c8ce05c8f7c?auto=format&fit=crop&q=80&w=1200"],
    weather: "Cloudy", temp: "8°C", humidity: "72%", windSpeed: "16km/h",
    climateAnalysis: "Oceanic. Jun–Aug warm and bright. Jan best for northern lights.", distance: "5,398 km from Dubai" },
  // ── Americas cont. ──
  { lat: -13.1631, lng: -72.545, label: "Machu Picchu", region: "Peru",
    description: "Lost city of the Incas at 2,430m — one of humanity's most breathtaking achievements.",
    images: ["https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=1200"],
    weather: "Cool & Misty", temp: "15°C", humidity: "72%", windSpeed: "7km/h",
    climateAnalysis: "Highland subtropical. Dry season May–Oct for clearest views.", distance: "13,741 km from Dubai" },
  { lat: 20.8783, lng: -156.6825, label: "Maui", region: "Hawaii, USA",
    description: "Valley Isle where active volcanoes, bamboo forests and turquoise reefs coexist.",
    images: ["https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&q=80&w=1200"],
    weather: "Tropical", temp: "27°C", humidity: "65%", windSpeed: "19km/h",
    climateAnalysis: "Tropical. Dry leeward coast Apr–Oct. North shore surfing Nov–Feb.", distance: "13,834 km from Dubai" },
  // ── Southeast Asia ──
  { lat: 10.8231, lng: 106.6297, label: "Ho Chi Minh", region: "Vietnam",
    description: "Saigon reborn — French colonial boulevards alongside motorbike chaos and pho.",
    images: ["https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=1200"],
    weather: "Warm", temp: "32°C", humidity: "78%", windSpeed: "10km/h",
    climateAnalysis: "Tropical monsoon. Dry season Dec–Apr ideal for travel.", distance: "5,024 km from Dubai" },
  { lat: 11.5625, lng: 104.9160, label: "Phnom Penh", region: "Cambodia",
    description: "Royal Palace and Killing Fields — a city processing memory and modernity together.",
    images: ["https://images.unsplash.com/photo-1601371689-e0213f07a78b?auto=format&fit=crop&q=80&w=1200"],
    weather: "Hot", temp: "34°C", humidity: "75%", windSpeed: "9km/h",
    climateAnalysis: "Tropical. Dry season Nov–Apr. Avoid Jun–Oct monsoon.", distance: "5,218 km from Dubai" },
];

const CONNECTIONS: Array<[number, number]> = [
  [0,1],[0,2],[0,3],[0,4],[1,7],[2,5],[3,8],[4,5],[6,7],
  [9,10],[9,13],[10,11],[11,12],[14,15],[15,16],[16,17],[17,18],[18,19],[19,20],[20,21],[14,22],
  [23,24],[23,25],[24,26],[25,27],[26,28],[27,29],[28,30],[29,31],[30,32],[31,23],
  [33,34],[34,35],[35,36],[36,33],[37,38],[38,39],[39,40],[40,41],[42,43],[43,44],
  [0,9],[2,9],[14,23],[16,9],[19,23],[21,34],[22,37],[23,9],[3,37],
];


function latLngToXYZ(lat: number, lng: number, r: number): [number,number,number] {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return [
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  ];
}

function rotY(x: number, y: number, z: number, a: number): [number,number,number] {
  return [x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)];
}

function rotX(x: number, y: number, z: number, a: number): [number,number,number] {
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}

function project(x: number, y: number, z: number, cx: number, cy: number, fov: number) {
  const s = fov / (fov + z);
  return { px: x * s + cx, py: y * s + cy, depth: z };
}

export function InteractiveGlobe({ className, size = 500, onMarkerClick, selectedMarker }: GlobeProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rotYRef    = useRef(0.3);
  const rotXRef    = useRef(0.1);
  const autoRotRef = useRef(true);
  const dragRef    = useRef({ active: false, startX: 0, startY: 0, startRotY: 0, startRotX: 0, moved: false });
  const hoveredRef = useRef<Marker | null>(null);
  const timeRef    = useRef(0);
  const animRef    = useRef<number>(0);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const radius = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;
  const fov = size * 2;

  // Fibonacci globe dots
  const dotsRef = useRef<Array<[number,number,number]>>([]);
  useEffect(() => {
    const dots: Array<[number,number,number]> = [];
    const N = 1800;
    const golden = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < N; i++) {
      const theta = 2 * Math.PI * i / golden;
      const phi   = Math.acos(1 - 2 * (i + 0.5) / N);
      dots.push([Math.sin(phi)*Math.cos(theta), Math.cos(phi), Math.sin(phi)*Math.sin(theta)]);
    }
    dotsRef.current = dots;
  }, []);

  // Helper: find closest marker to a pointer event
  const findClosestMarker = useCallback((ex: number, ey: number): Marker | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    const mx = (ex - rect.left) * scaleX;
    const my = (ey - rect.top)  * scaleY;

    let best: Marker | null = null;
    let bestDist = 32; // hit radius in canvas pixels
    const ry = rotYRef.current;
    const rx = rotXRef.current;

    TRAVEL_DESTINATIONS.forEach(m => {
      const [x, y, z]        = latLngToXYZ(m.lat, m.lng, radius);
      const [x1, y1, z1]     = rotY(x, y, z, ry);
      const [x2, y2, z2]     = rotX(x1, y1, z1, rx);
      if (z2 > radius * 0.5) return; // back face cull
      const proj              = project(x2, y2, z2, cx, cy, fov);
      const d                 = Math.hypot(mx - proj.px, my - proj.py);
      if (d < bestDist) { bestDist = d; best = m; }
    });
    return best;
  }, [radius, cx, cy, fov, size]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    const ry = rotYRef.current;
    const rx = rotXRef.current;
    timeRef.current += 0.018;
    const t = timeRef.current;

    // Auto-rotate — continuous visible revolution
    if (autoRotRef.current) rotYRef.current += 0.003;

    // ── Globe base sphere
    const bg = ctx.createRadialGradient(cx - radius*0.2, cy - radius*0.2, 1, cx, cy, radius);
    bg.addColorStop(0, "rgba(8,16,40,0.98)");
    bg.addColorStop(0.6, "rgba(4,8,24,0.99)");
    bg.addColorStop(1, "rgba(1,2,8,1)");
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2);
    ctx.fillStyle = bg; ctx.fill();

    // ── Grid lines
    for (let lat = -75; lat <= 75; lat += 15) {
      ctx.beginPath(); let pd = false;
      for (let lng = -180; lng <= 180; lng += 3) {
        const [x, y, z]    = latLngToXYZ(lat, lng, radius);
        const [x1, y1, z1] = rotY(x, y, z, ry);
        const [x2, y2, z2] = rotX(x1, y1, z1, rx);
        if (z2 > 0) { pd = false; continue; }
        const p = project(x2, y2, z2, cx, cy, fov);
        if (!pd) { ctx.moveTo(p.px, p.py); pd = true; } else ctx.lineTo(p.px, p.py);
      }
      ctx.strokeStyle = "rgba(100,140,255,0.08)"; ctx.lineWidth = 0.4; ctx.stroke();
    }
    for (let lng = -180; lng < 180; lng += 15) {
      ctx.beginPath(); let pd = false;
      for (let lat = -90; lat <= 90; lat += 3) {
        const [x, y, z]    = latLngToXYZ(lat, lng, radius);
        const [x1, y1, z1] = rotY(x, y, z, ry);
        const [x2, y2, z2] = rotX(x1, y1, z1, rx);
        if (z2 > 0) { pd = false; continue; }
        const p = project(x2, y2, z2, cx, cy, fov);
        if (!pd) { ctx.moveTo(p.px, p.py); pd = true; } else ctx.lineTo(p.px, p.py);
      }
      ctx.strokeStyle = "rgba(100,140,255,0.06)"; ctx.lineWidth = 0.3; ctx.stroke();
    }

    // ── Fibonacci dots
    dotsRef.current.forEach(([dx, dy, dz]) => {
      const [x, y, z]       = rotY(dx*radius, dy*radius, dz*radius, ry);
      const [x2, y2, z2]    = rotX(x, y, z, rx);
      if (z2 > 0) return;
      const p     = project(x2, y2, z2, cx, cy, fov);
      const depth = Math.max(0.1, 1 - (z2 + radius) / (2 * radius));
      ctx.beginPath(); ctx.arc(p.px, p.py, 0.9 + depth * 0.7, 0, Math.PI*2);
      ctx.fillStyle = `rgba(120,180,255,${(depth * 0.4).toFixed(2)})`; ctx.fill();
    });

    // ── Arc connections with traveling light
    const projM = TRAVEL_DESTINATIONS.map((m, idx) => {
      const [x, y, z]    = latLngToXYZ(m.lat, m.lng, radius);
      const [x1, y1, z1] = rotY(x, y, z, ry);
      const [x2, y2, z2] = rotX(x1, y1, z1, rx);
      const proj         = project(x2, y2, z2, cx, cy, fov);
      return { m, idx, px: proj.px, py: proj.py, z: z2, vis: z2 < radius * 0.3 };
    });

    CONNECTIONS.forEach(([ai, bi]) => {
      const a = projM[ai], b = projM[bi];
      if (!a?.vis || !b?.vis) return;
      const isSel = selectedMarker?.label === a.m.label || selectedMarker?.label === b.m.label;
      const emx = (a.px + b.px) / 2, emy = (a.py + b.py) / 2;
      const dist = Math.hypot(a.px - b.px, a.py - b.py);
      const cpx = emx, cpy = emy - dist * 0.2;

      ctx.beginPath(); ctx.moveTo(a.px, a.py);
      ctx.quadraticCurveTo(cpx, cpy, b.px, b.py);
      ctx.strokeStyle = isSel ? "rgba(212,175,55,0.6)" : "rgba(100,160,255,0.12)";
      ctx.lineWidth   = isSel ? 1.5 : 0.7; ctx.stroke();

      const ph = (t * 0.7 + ai * 0.3 + bi * 0.2) % 1;
      const lx = (1-ph)*(1-ph)*a.px + 2*(1-ph)*ph*cpx + ph*ph*b.px;
      const ly = (1-ph)*(1-ph)*a.py + 2*(1-ph)*ph*cpy + ph*ph*b.py;
      const grd = ctx.createRadialGradient(lx, ly, 0, lx, ly, 6);
      grd.addColorStop(0, isSel ? "rgba(212,175,55,1)" : "rgba(120,200,255,0.9)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(lx, ly, 2, 0, Math.PI*2);
      ctx.fillStyle = isSel ? "#D4AF37" : "#88CCFF"; ctx.fill();
    });

    // ── Markers
    const hov = hoveredRef.current;
    const sel = selectedMarker;
    projM.filter(p => p.vis).sort((a, b) => b.z - a.z).forEach(({ m, px, py, z }) => {
      const isSel  = sel?.label === m.label;
      const isHov  = hov?.label === m.label;
      const depth  = Math.max(0.4, 1 - (z + radius) / (2 * radius));
      const r      = (isSel ? 8 : isHov ? 6.5 : 4.5) * depth;
      const pulse  = Math.sin(t * 2.2 + m.lat * 0.18) * 0.5 + 0.5;

      if (isSel || isHov) {
        ctx.beginPath(); ctx.arc(px, py, r + 8 + pulse * 4, 0, Math.PI*2);
        ctx.strokeStyle = isSel ? "rgba(212,175,55,0.12)" : "rgba(100,160,255,0.12)";
        ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(px, py, r + 3.5, 0, Math.PI*2);
        ctx.strokeStyle = isSel ? "rgba(212,175,55,0.8)" : "rgba(100,160,255,0.5)";
        ctx.lineWidth = isSel ? 2 : 1.4; ctx.stroke();
      }

      const g = ctx.createRadialGradient(px - r*0.3, py - r*0.3, 0, px, py, r);
      if (isSel)      { g.addColorStop(0, "#FFE566"); g.addColorStop(1, "#C8960C"); }
      else if (isHov) { g.addColorStop(0, "#88DDFF"); g.addColorStop(1, "#3399CC"); }
      else            { g.addColorStop(0, "rgba(140,200,255,0.98)"); g.addColorStop(1, "rgba(60,130,200,0.7)"); }
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2);
      ctx.fillStyle = g; ctx.fill();

      if (depth > 0.65 || isSel || isHov) {
        const fs = Math.round((isSel ? 12 : 10) * depth);
        ctx.font      = `${isSel ? "700 " : "500 "}${fs}px Inter, sans-serif`;
        ctx.fillStyle = isSel ? "#D4AF37" : isHov ? "#88CCFF" : "rgba(160,210,255,0.75)";
        ctx.fillText(m.label, px + r + 4, py + 4);
      }
    });

    // ── Rim glow
    const rim = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius);
    rim.addColorStop(0, "rgba(60,100,200,0)");
    rim.addColorStop(1, "rgba(60,120,255,0.18)");
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2);
    ctx.strokeStyle = rim; ctx.lineWidth = 2; ctx.stroke();

    animRef.current = requestAnimationFrame(draw);
  }, [size, cx, cy, radius, fov, selectedMarker]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startRotY: rotYRef.current, startRotX: rotXRef.current, moved: false };
    autoRotRef.current = false;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
      rotYRef.current = dragRef.current.startRotY + dx * 0.005;
      rotXRef.current = Math.max(-Math.PI/2, Math.min(Math.PI/2, dragRef.current.startRotX + dy * 0.005));
      return;
    }
    const m = findClosestMarker(e.clientX, e.clientY);
    hoveredRef.current = m;
    setHoveredLabel(m?.label ?? null);
    const c = canvasRef.current;
    if (c) c.style.cursor = m ? "pointer" : "grab";
  }, [findClosestMarker]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.moved) {
      const hit = findClosestMarker(e.clientX, e.clientY);
      if (hit && onMarkerClick) onMarkerClick(hit);
    }
    dragRef.current.active = false;
    dragRef.current.moved  = false;
    setTimeout(() => { autoRotRef.current = true; }, 2500);
  }, [findClosestMarker, onMarkerClick]);

  return (
    <div className={cn("relative select-none", className)}>
      {hoveredLabel && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest pointer-events-none z-20"
          style={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(100,160,255,0.3)", color: "#88CCFF", backdropFilter: "blur(10px)" }}>
          {hoveredLabel}
        </div>
      )}
      <canvas ref={canvasRef} width={size} height={size}
        style={{ cursor: "grab", width: size, height: size, display: "block" }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onPointerLeave={() => {
          dragRef.current.active = false;
          hoveredRef.current = null;
          setHoveredLabel(null);
          setTimeout(() => { autoRotRef.current = true; }, 2500);
        }} />
    </div>
  );
}
