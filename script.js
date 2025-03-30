const map = L.map("map").setView([-23.3591, 30.5014], 10);

// Tile layer (satellite optional)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Add geocoder (search bar)
const geocoder = L.Control.geocoder({
  defaultMarkGeocode: false
})
.on('markgeocode', function(e) {
  const latlng = e.geocode.center;
  waypoints.push(latlng);
  updateRoute();
})
.addTo(map);

let waypoints = [L.latLng(-23.3591, 30.5014)]; // Farm

let routingControl = null;

map.on("click", function (e) {
  waypoints.push(e.latlng);
  updateRoute();
});

function updateRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
  }

  routingControl = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false,
    show: false,
    addWaypoints: false,
    createMarker: function (i, wp) {
      return L.marker(wp, { draggable: true }).on("dragend", function (e) {
        waypoints[i] = e.target.getLatLng();
        updateRoute();
      });
    },
  })
  .on("routesfound", function (e) {
    const total = e.routes[0].summary.totalDistance / 1000;
    document.getElementById("distance").textContent = total.toFixed(2);
    const rate = parseFloat(document.getElementById("rate").value);
    document.getElementById("cost").textContent = (rate * total).toFixed(2);
  })
  .addTo(map);
}

window.clearRoute = function () {
  waypoints = [L.latLng(-23.3591, 30.5014)];
  updateRoute();
};

updateRoute();


