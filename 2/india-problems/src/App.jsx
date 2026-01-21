import { useContext } from "react";
import { LocationContext } from "./context/LocationContext";
import LocationSelector from "./components/LocationSelector";

function App() {
  const context = useContext(LocationContext);

  if (!context) {
    return <h1>Context not available</h1>;
  }

  const { location } = context;

  if (!location) {
    return <LocationSelector />;
  }

  return (
    <div className="container">
      <h2>
        Problems in {location.city}, {location.state}
      </h2>
    </div>
  );
}

export default App;
