const apiKey = "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf";

let map = L.map("map").setView([-23.359056, 30.501417], 12); // Farm center

// Base maps
const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const satellite = L.tileLayer(
  "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"]
  }
);

// Satellite toggle
document.getElementById("toggle-sat").addEventListener("change", function () {
  if (this.checked) {
    map.removeLayer(street);
    map.addLayer(satellite);
  } else {
    map.removeLayer(satellite);
    map.addLayer(street);
  }
});

// Farm marker
const farm = L.marker([-23.359056, 30.501417], {
  icon: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [30, 30] })
}).addTo(map).bindPopup("Farm Location").openPopup();

let markers = [];
let coordinates = [[30.501417, -23.359056]]; // Start with farm
let routeLine;

// Toggle admin panel
document.getElementById("admin-toggle").onclick = () => {
  const panel = document.getElementById("sidebar");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
};

// Add delivery stops
map.on("click", function (e) {
  const marker = L.marker(e.latlng).addTo(map);
  markers.push(marker);
  coordinates.push([e.latlng.lng, e.latlng.lat]);
});

// Clear all
function clearRoute() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  coordinates = [[30.501417, -23.359056]];
  if (routeLine) map.removeLayer(routeLine);
  document.getElementById("cost-display").innerHTML = "";
}

// Route calculation using ORS Optimization
function calculateRoute() {
  if (coordinates.length <= 1) {
    alert("Add at least one delivery location.");
    return;
  }

  const rate = parseFloat(document.getElementById("rate").value);
  const body = {
    jobs: coordinates.slice(1).map((coord, i) => ({
      id: i + 1,
      location: coord
    })),
    vehicles: [{
      id: 1,
      start: coordinates[0],
      end: coordinates[0]
    }]
  };

  fetch("https://api.openrouteservice.org/optimization", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      const orderedCoords = [coordinates[0]];
      data.routes[0].steps.forEach(step => {
        const jobId = step.job;
        if (jobId) orderedCoords.push(body.jobs[jobId - 1].location);
      });
      orderedCoords.push(coordinates[0]); // return to farm

      // Draw route line
      if (routeLine) map.removeLayer(routeLine);
      routeLine = L.polyline(
        orderedCoords.map(c => [c[1], c[0]]),
        { color: "blue", weight: 5 }
      ).addTo(map);

      // Add markers with labels
      markers.forEach(m => map.removeLayer(m));
      markers = [];
      orderedCoords.slice(1, -1).forEach((coord, i) => {
        const marker = L.marker([coord[1], coord[0]], {
          icon: L.divIcon({
            className: 'custom-icon',
            html: `<div style="background:#007bff;color:white;border-radius:50%;width:24px;height:24px;text-align:center;font-size:12px;line-height:24px;">${i + 1}</div>`,
          })
        }).addTo(map);
        markers.push(marker);
      });

      // Distance + Cost
      const distanceMeters = data.routes[0].distance;
      const distanceKm = (distanceMeters / 1000).toFixed(2);
      const cost = (distanceKm * rate).toFixed(2);

      document.getElementById("cost-display").innerHTML =
        `<strong>Distance:</strong> ${distanceKm} km<br><strong>Estimated Cost:</strong> R${cost}`;
    })
    .catch(err => {
      console.error(err);
      alert("Failed to calculate route.");
    });
}



