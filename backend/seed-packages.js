import "./env.js";
import { connectMongo } from "./mongo.js";
import { TourPackage } from "./models/TourPackage.js";

const samplePlaces = [
  { dest: "Kyoto, Japan", desc: "Golden Pavilion, Fushimi Inari Shrine, Arashiyama Bamboo Grove, Gion District, Kiyomizu-dera Temple", style: "cultural", prefs: ["Museums", "Historical Sites", "Local Cuisine"], budget: 3500 },
  { dest: "Santorini, Greece", desc: "Oia Sunsets, Black Sand Beaches, Akrotiri Archaeological Site, Mount Profitis Ilias, Caldera Views", style: "luxury", prefs: ["Luxury Dining", "Spa Rituals", "Private Yachts"], budget: 5200 },
  { dest: "London, UK", desc: "Tower of London, British Museum, Westminster Abbey, London Eye, Borough Market", style: "cultural", prefs: ["Museums", "Historical Sites", "Architecture"], budget: 2800 },
  { dest: "Maldives", desc: "Bioluminescent Beach, Manta Ray Diving, Underwater Hull Restaurant, Private Sandbanks, Coral Reefs", style: "relaxation", prefs: ["Beach Yoga", "Private Cabanas", "Meditation Nodes"], budget: 8500 },
  { dest: "Dubai, UAE", desc: "Burj Khalifa, Dubai Mall, Desert Safari, Palm Jumeirah, Dubai Frame, Museum of the Future", style: "luxury", prefs: ["High-End Retail", "Exclusive Access", "Supercar Rentals"], budget: 6000 },
  { dest: "Bali, Indonesia", desc: "Uluwatu Temple, Sacred Monkey Forest, Tegallalang Rice Terrace, Mount Batur Sunrise, Ubud Palace", style: "nature", prefs: ["Forest Bathing", "Wildlife Spotting", "Eco-Trails"], budget: 1800 },
  { dest: "Barcelona, Spain", desc: "Sagrada Familia, Park Güell, Casa Batlló, Gothic Quarter, La Boqueria, Camp Nou", style: "cultural", prefs: ["Art Galleries", "Architecture", "Local Cuisine"], budget: 2200 },
  { dest: "Swiss Alps, Switzerland", desc: "Matterhorn Peak, Jungfraujoch, Glacier Express, Lake Geneva, Interlaken, Grindelwald", style: "adventure", prefs: ["Mountaineering", "Extreme Sports", "Skiing"], budget: 7500 },
  { dest: "Tokyo, Japan", desc: "Shibuya Crossing, Senso-ji Temple, Meiji Shrine, Tsukiji Fish Market, Akihabara, Shinjuku", style: "cultural", prefs: ["Technology Hubs", "Local Cuisine", "Architecture"], budget: 4000 },
  { dest: "Rome, Italy", desc: "Colosseum, Vatican Museums, Pantheon, Trevi Fountain, Roman Forum, Borghese Gallery", style: "cultural", prefs: ["Historical Sites", "Architecture", "Museums"], budget: 3100 },
  { dest: "Paris, France", desc: "Eiffel Tower, Louvre Museum, Notre-Dame, Palace of Versailles, Seine River Cruise, Musée d'Orsay", style: "luxury", prefs: ["Luxury Dining", "Art Galleries", "Private Concierge"], budget: 4800 },
  { dest: "Sydney, Australia", desc: "Sydney Opera House, Bondi Beach, Harbour Bridge Climb, Blue Mountains, Taronga Zoo, Manly Beach", style: "adventure", prefs: ["Water Sports", "Extreme Sports", "Coastal Hikes"], budget: 5500 },
  { dest: "Machu Picchu, Peru", desc: "Inca Trail, Sacred Valley, Cusco City, Sun Gate, Temple of the Sun, Rainbow Mountain", style: "adventure", prefs: ["Mountaineering", "Historical Sites", "Off-road Safari"], budget: 3200 },
  { dest: "Reykjavik, Iceland", desc: "Blue Lagoon, Golden Circle, Northern Lights, Skógafoss Waterfall, Geysir Hot Springs, Black Sand Beach", style: "nature", prefs: ["Glacier Hikes", "Eco-Trails", "Wildlife Spotting"], budget: 4500 },
  { dest: "Cairo, Egypt", desc: "Giza Pyramids, Great Sphinx, Egyptian Museum, Khan el-Khalili, Nile River Cruise, Abu Simbel", style: "cultural", prefs: ["Historical Sites", "Museums", "Local Markets"], budget: 1900 },
  { dest: "Cape Town, South Africa", desc: "Table Mountain, Cape of Good Hope, Robben Island, Kirstenbosch Gardens, Boulders Beach Penguins", style: "nature", prefs: ["Wildlife Safari", "Coastal Hikes", "Eco-Trails"], budget: 3400 },
  { dest: "Rio de Janeiro, Brazil", desc: "Christ the Redeemer, Sugarloaf Mountain, Copacabana Beach, Tijuca National Park, Lapa Arches", style: "adventure", prefs: ["Water Sports", "Mountaineering", "Local Cuisine"], budget: 2600 },
  { dest: "Singapore", desc: "Gardens by the Bay, Marina Bay Sands, Universal Studios, Sentosa Island, Night Safari, Hawker Centres", style: "luxury", prefs: ["High-End Retail", "Luxury Dining", "Spa Rituals"], budget: 3900 },
  { dest: "New York, USA", desc: "Statue of Liberty, Central Park, Times Square, Empire State Building, Metropolitan Museum of Art", style: "cultural", prefs: ["Museums", "Architecture", "Art Galleries"], budget: 4200 },
  { dest: "Banff, Canada", desc: "Lake Louise, Moraine Lake, Icefields Parkway, Johnston Canyon, Banff Gondola, Bow Lake", style: "nature", prefs: ["Wildlife Spotting", "Eco-Trails", "Forest Bathing"], budget: 2800 },
  { dest: "Bora Bora, French Polynesia", desc: "Mount Otemanu, Matira Beach, Coral Gardens, Lagoonarium, Leopard Rays Snorkeling, Overwater Bungalows", style: "relaxation", prefs: ["Private Cabanas", "Meditation Nodes", "Beach Yoga"], budget: 9500 },
  { dest: "Istanbul, Turkey", desc: "Hagia Sophia, Blue Mosque, Topkapi Palace, Grand Bazaar, Bosporus Cruise, Cappadocia", style: "cultural", prefs: ["Historical Sites", "Architecture", "Local Markets"], budget: 2100 },
  { dest: "Amsterdam, Netherlands", desc: "Rijksmuseum, Van Gogh Museum, Anne Frank House, Vondelpark, Jordaan District, Canal Tours", style: "cultural", prefs: ["Art Galleries", "Museums", "Canal Cruises"], budget: 2900 },
  { dest: "Seoul, South Korea", desc: "Gyeongbokgung Palace, N Seoul Tower, Bukchon Hanok Village, Myeong-dong, DMZ Tour, Namsangol", style: "cultural", prefs: ["Historical Sites", "Local Cuisine", "Architecture"], budget: 3300 },
  { dest: "Queenstown, New Zealand", desc: "Milford Sound, Lake Wakatipu, Skyline Gondola, Shotover Jet, Remarkables Ski Field, Bungee Jumping", style: "adventure", prefs: ["Extreme Sports", "Skydiving", "Water Sports"], budget: 4600 },
  { dest: "Amalfi Coast, Italy", desc: "Positano, Ravello, Villa Rufolo, Path of the Gods, Emerald Grotto, Capri Island", style: "luxury", prefs: ["Luxury Dining", "Private Yachts", "Spa Rituals"], budget: 6800 },
  { dest: "Petra, Jordan", desc: "The Treasury, Monastery, Siq Canyon, Royal Tombs, High Place of Sacrifice, Little Petra", style: "cultural", prefs: ["Historical Sites", "Architecture", "Desert Camping"], budget: 2500 },
  { dest: "Phuket, Thailand", desc: "Phi Phi Islands, Big Buddha, Patong Beach, Phang Nga Bay, Wat Chalong, James Bond Island", style: "relaxation", prefs: ["Beach Yoga", "Spa Rituals", "Private Cabanas"], budget: 1700 },
  { dest: "Venice, Italy", desc: "St Mark's Basilica, Doge's Palace, Grand Canal, Rialto Bridge, Bridge of Sighs, Burano Island", style: "cultural", prefs: ["Architecture", "Museums", "Historical Sites"], budget: 3800 },
  { dest: "Marrakech, Morocco", desc: "Jemaa el-Fnaa, Majorelle Garden, Bahia Palace, Koutoubia Mosque, Saadian Tombs, Medina Souks", style: "cultural", prefs: ["Local Markets", "Historical Sites", "Architecture"], budget: 1500 },
  { dest: "Chennai, India", desc: "Marina Beach, Kapaleeshwarar Temple, San Thome Basilica, Fort St. George, Guindy National Park, DakshinaChitra", style: "cultural", prefs: ["Historical Sites", "Local Cuisine", "Museums"], budget: 800 },
  { dest: "Kanyakumari, India", desc: "Vivekananda Rock Memorial, Thiruvalluvar Statue, Kanyakumari Beach, Padmanabhapuram Palace, Gandhi Memorial", style: "nature", prefs: ["Eco-Trails", "Coastal Hikes", "Historical Sites"], budget: 600 },
  { dest: "Pondicherry, India", desc: "French Quarter, Auroville, Matrimandir, Rock Beach, Sri Aurobindo Ashram, Promenade Walk", style: "relaxation", prefs: ["Beach Yoga", "Meditation Nodes", "Historical Sites"], budget: 700 },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await connectMongo();
    console.log("Connected! Clearing existing packages...");
    await TourPackage.deleteMany({});
    
    console.log(`Inserting ${samplePlaces.length} premium tour packages...`);

    const today = new Date();
    const packagesToInsert = samplePlaces.map((place) => {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + Math.floor(Math.random() * 60) + 15);
      const duration = Math.floor(Math.random() * 7) + 3;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + duration);

      return {
        destination: place.dest,
        startDate,
        endDate,
        budget: place.budget,
        budgetBreakdown: {
          stay: Math.round(place.budget * 0.35),
          travel: Math.round(place.budget * 0.25),
          food: Math.round(place.budget * 0.30),
          misc: Math.round(place.budget * 0.10),
        },
        description: place.desc,
        travelStyle: place.style,
        preferences: place.prefs,
        status: "active"
      };
    });

    await TourPackage.insertMany(packagesToInsert);
    console.log(`✅ ${packagesToInsert.length} packages seeded successfully!`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding:", err.message);
    process.exit(1);
  }
}

seed();
