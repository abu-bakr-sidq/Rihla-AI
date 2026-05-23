import { User } from "../models/User.js";

export async function calculateTripBudget(tripData) {
    // Advanced calculation logic or AI fallback based on trip length and preferences.
    // E.g., baseline flight, hotel cost, food, and activities.
    let baseMultiplier = 1;
    if (tripData.travelStyle === 'luxury') baseMultiplier = 3;
    if (tripData.travelStyle === 'budget') baseMultiplier = 0.5;
    
    const days = tripData.days || 3;
    const travelers = tripData.travelers || 1;
    
    return {
        flights: 300 * travelers,
        hotel: 150 * days * baseMultiplier,
        food: 50 * days * travelers * baseMultiplier,
        activities: 100 * days * travelers * baseMultiplier
    };
}
