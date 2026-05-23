import { api } from "./api";

export const tripService = {
  // Fetch user's trips
  getUserTrips: async () => {
    const response = await api.get("/trips");
    return response.data;
  },
  
  // Create a new trip (save AI trip physically)
  createTrip: async (tripData) => {
    const response = await api.post("/trips", tripData);
    return response.data;
  },
  
  // Generate an AI trip payload without saving
  generateAITrip: async (tripRequest) => {
    const response = await api.post("/trips/generate", tripRequest);
    return response.data;
  }
};
