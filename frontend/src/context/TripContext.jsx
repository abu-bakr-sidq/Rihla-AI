import React, { createContext, useContext, useState } from 'react';

const TripContext = createContext(null);

export const TripProvider = ({ children }) => {
    const [currentTrip, setCurrentTrip] = useState(null);
    const [trips, setTrips] = useState([]);

    return (
        <TripContext.Provider value={{ currentTrip, setCurrentTrip, trips, setTrips }}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = () => useContext(TripContext);
