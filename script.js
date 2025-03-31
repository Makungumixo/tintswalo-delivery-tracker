const map = L.map('map').setView([-23.3591, 30.5014], 12);

let satellite = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

let isSatellite = true;
document.getElementById("satellite-toggle").onclick = () => {
  if (isSatellite) {
    map.removeLayer(satellite);
    street.addTo(map);
  } else {
    map.removeLayer(street);
    satellite.addTo(map);
  }
  isSatellite = !isSatellite;
};

// Farm marker
const farmLatLng = L.latLng(-23.3591, 30.5014);
L.marker(farmLatLng, { title: "Farm", icon: L.icon({
  iconUrl: 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png',
  iconSize: [30, 40],
})}).addTo(map).bindPopup("Tintswalo’s Poultry Farm").openPopup();

let markers = [];
let control = null;

// Click to add stop
map.on("click", function (e) {
  const marker = L.marker(e.latlng, {
    icon: L.icon({
      iconUrl: "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png",
      iconSize: [30, 40],
    })
  }).addTo(map);
  markers.push(marker);
});

// Toggle Admin Panel
document.getElementById("admin-toggle").onclick = () => {
  const panel = document.getElementById("admin-panel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
};

// Clear route and markers
document.getElementById("clear-route").onclick = () => {
  if (control) {
    map.removeControl(control);
    control = null;
  }
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  document.getElementById("cost-display").textContent = "Cost: R0.00";
};

// Calculate optimal route
document.getElementById("calculate-route").onclick = async () => {
  if (markers.length === 0) return alert("Please add at least one stop.");

  const stops = [farmLatLng, ...markers.map(m => m.getLatLng())];

  try {
    const coordinates = stops.map(p => `${p.lng},${p.lat}`).join("|");

    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
      {
        method: "POST",
        headers: {
          "Authorization": "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coordinates: stops.map(p => [p.lng, p.lat]) }),
      }
    );

    const data = await response.json();

    if (control) {
      map.removeControl(control);
    }

    control = L.Routing.control({
      plan: L.Routing.plan(stops, {
        createMarker: (i, wp) => {
          return L.marker(wp.latLng, {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background:#1f6feb;color:#fff;border-radius:50%;padding:6px">${i + 1}</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          });
        },
        draggableWaypoints: false,
      }),
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      show: false,
    }).addTo(map);

    const totalDistance = data.features[0].properties.summary.distance / 1000;
    const cost = totalDistance * 5; // R5/km
    document.getElementById("cost-display").textContent = `Cost: R${cost.toFixed(2)}`;
  } catch (err) {
    alert("Failed to calculate route.");
    console.error(err);
  }
};




