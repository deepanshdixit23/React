import { createContext, useState } from "react";

export const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);

  const saveLocation = (state, city) => {
    const data = { state, city };
    setLocation(data);
    localStorage.setItem("location", JSON.stringify(data));
  };

  return (
    <LocationContext.Provider value={{ location, saveLocation }}>
      {children}
    </LocationContext.Provider>
  );
}
