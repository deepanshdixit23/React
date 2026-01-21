import { useState, useContext } from "react";
import locations from "../data/indiaLocations";
import { LocationContext } from "../context/LocationContext";

function LocationSelector() {
  const { saveLocation } = useContext(LocationContext);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const selectedState = locations.find((l) => l.state === state);

  return (
    <div className="container">
      <h2>Select Your Location</h2>

      <select value={state} onChange={(e) => setState(e.target.value)}>
        <option value="">Select State</option>
        {locations.map((l) => (
          <option key={l.state} value={l.state}>
            {l.state}
          </option>
        ))}
      </select>

      <br />
      <br />

      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        disabled={!selectedState}
      >
        <option value="">Select City / Village</option>
        {selectedState?.cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <br />
      <br />

      <button
        disabled={!state || !city}
        onClick={() => saveLocation(state, city)}
      >
        Continue
      </button>
    </div>
  );
}

export default LocationSelector;
