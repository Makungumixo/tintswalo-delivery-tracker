const farmCoords = [-23.359055, 30.501417]; // Tintswalo’s Poultry Farm

let map = L.map("map").setView(farmCoords, 12);
let tileLayer = L.tileLayer.provider("OpenStreetMap.Mapnik").addTo(map);
let satelliteTile = L.tileLayer.provider("Esri.WorldImagery");

let markers = [];
let routingControl = null;

const adminToggle = document.getElementById("admin-toggle");
const sidebar = document.getElementById("sidebar");
const addBtn = document.getElementById("add-location");
const calcBtn = document.getElementById("calculate-route");
const clearBtn = document.getElementById("clear-route");
const satelliteToggle = document.getElementById("satellite-toggle");

let isAdding = false;

// Fixed Farm Marker
L.marker(farmCoords, { title: "Farm", icon: L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 34]
})}).addTo(map).bindPopup("Tintswalo’s Poultry Farm");

// Admin toggle
adminToggle.onclick = () => sidebar.classList.toggle("hidden");

// Enable click to add delivery points
addBtn.onclick = () => {
  isAdding = true;
  alert("Click on the map to add a delivery point.");
};

map.on("click", (e) => {
  if (isAdding) {
    const idx = markers.length + 1;
    const marker = L.marker(e.latlng, {
      title: `Stop ${idx}`,
      icon: L.divIcon({
        className: "custom-marker",
        html: `<div class="stop-icon">${idx}</div>`,
        iconSize: [30, 30]
      })
    }).addTo(map).bindPopup(`Stop ${idx}`);
    markers.push(marker);
    isAdding = false;
  }
});

// Toggle satellite mode
satelliteToggle.onchange = function () {
  if (this.checked) {
    map.removeLayer(tileLayer);
    satelliteTile.addTo(map);
  } else {
    map.removeLayer(satelliteTile);
    tileLayer.addTo(map);
  }
};

// Calculate optimized delivery route
calcBtn.onclick = async () => {
  if (markers.length === 0) {
    alert("Add at least one stop before calculating.");
    return;
  }

  const allCoords = [farmCoords, ...markers.map(m => [m.getLatLng().lat, m.getLatLng().lng])];
  const jobs = markers.map((m, i) => ({
    id: i + 1,
    location: [m.getLatLng().lng, m.getLatLng().lat],
  }));

  const body = {
    jobs,
    vehicles: [{
      id: 1,
      start: [farmCoords[1], farmCoords[0]],
      end: [farmCoords[1], farmCoords[0]]
    }]
  };

  const response = await fetch("https://api.openrouteservice.org/optimization", {
    method: "POST",
    headers: {
      "Authorization": "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  const steps = data.routes[0].steps;

  const waypoints = [
    farmCoords,
    ...steps.map(s => {
      const job = jobs.find(j => j.id === s.job);
      return [job.location[1], job.location[0]];
    }),
    farmCoords
  ];

  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: waypoints.map(([lat, lng]) => L.latLng(lat, lng)),
    createMarker: function (i, wp) {
      if (i === 0) {
        return L.marker(wp.latLng).bindPopup("Start: Farm");
      } else if (i === waypoints.length - 1) {
        return L.marker(wp.latLng).bindPopup("Return to Farm");
      } else {
        return L.marker(wp.latLng, {
          icon: L.divIcon({
            className: "custom-marker",
            html: `<div class="stop-icon">${i}</div>`,
            iconSize: [30, 30]
          })
        }).bindPopup(`Stop ${i}`);
      }
    },
    routeWhileDragging: false,
    show: true
  }).addTo(map);
};

// Clear route + markers
clearBtn.onclick = () => {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
};

