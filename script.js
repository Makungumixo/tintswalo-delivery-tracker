const farmCoords = [-23.359056, 30.501417]; // Fixed farm location
const apiKey = "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf";
let markers = [];
let routeLine;
let map;
let satelliteView = false;

// Map Initialization
window.onload = () => {
  const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  });

  const satellite = L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    subdomains: ['mt0','mt1','mt2','mt3'],
    attribution: "© Google Satellite",
  });

  map = L.map("map", {
    center: farmCoords,
    zoom: 13,
    layers: [streets]
  });

  const farmIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });

  // Add fixed farm marker
  L.marker(farmCoords, { icon: farmIcon }).addTo(map).bindPopup("Tintswalo’s Poultry Farm");

  // Add delivery marker on map click
  map.on("click", (e) => {
    const stopNumber = markers.length + 1;
    const marker = L.marker(e.latlng)
      .addTo(map)
      .bindPopup(`Stop ${stopNumber}`)
      .openPopup();
    markers.push(marker);
    calculateOptimizedRoute();
  });

  // Clear Route
  document.getElementById("clearBtn").onclick = () => {
    if (routeLine) map.removeLayer(routeLine);
    markers.forEach((m) => map.removeLayer(m));
    markers = [];
    document.getElementById("distance").innerText = "";
    document.getElementById("cost").innerText = "";
  };

  // Toggle Admin Panel
  document.getElementById("toggleAdmin").onclick = () => {
    document.getElementById("admin-panel").classList.toggle("collapsed");
  };

  // Toggle Satellite View
  document.getElementById("toggleView").onclick = () => {
    if (satelliteView) {
      map.eachLayer(layer => map.removeLayer(layer));
      streets.addTo(map);
      L.marker(farmCoords, { icon: farmIcon }).addTo(map).bindPopup("Tintswalo’s Poultry Farm");
      markers.forEach(m => m.addTo(map));
      if (routeLine) routeLine.addTo(map);
    } else {
      map.eachLayer(layer => map.removeLayer(layer));
      satellite.addTo(map);
      L.marker(farmCoords, { icon: farmIcon }).addTo(map).bindPopup("Tintswalo’s Poultry Farm");
      markers.forEach(m => m.addTo(map));
      if (routeLine) routeLine.addTo(map);
    }
    satelliteView = !satelliteView;
  };
};

// Calculate Optimized Route via OpenRouteService
async function calculateOptimizedRoute() {
  if (markers.length < 1) return;

  const locations = [
    [farmCoords[1], farmCoords[0]], // [lng, lat]
    ...markers.map((m) => [m.getLatLng().lng, m.getLatLng().lat])
  ];

  const body = {
    jobs: locations.slice(1).map((loc, i) => ({
      id: i + 1,
      location: loc
    })),
    vehicles: [
      {
        id: 1,
        start: locations[0],
        end: locations[0]
      }
    ]
  };

  try {
    const res = await fetch("https://api.openrouteservice.org/optimization", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    const ordered = [data.routes[0].steps[0].location]; // farm start
    data.routes[0].steps.slice(1).forEach(step => {
      ordered.push(step.location);
    });

    const coordsQuery = ordered.map(p => p.join(",")).join("|");
    const geoRes = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car/geojson?api_key=${apiKey}&start=${coordsQuery}`
    );

    const geo = await geoRes.json();

    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.geoJSON(geo, {
      style: {
        color: "blue",
        weight: 4
      }
    }).addTo(map);

    const totalMeters = data.routes[0].distance;
    const km = (totalMeters / 1000).toFixed(2);
    const costPerKm = 5; // Change this rate as needed
    const totalCost = (km * costPerKm).toFixed(2);

    document.getElementById("distance").innerText = `Total Distance: ${km} km`;
    document.getElementById("cost").innerText = `Estimated Cost: R${totalCost}`;

  } catch (error) {
    console.error("Route calculation failed:", error);
    alert("Failed to calculate route.");
  }
}


