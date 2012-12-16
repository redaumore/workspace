
var directionDisplay;
var directionsService = new google.maps.DirectionsService();
var map;

  function initialize() {
    directionsDisplay = new google.maps.DirectionsRenderer();
    var myLocation = new google.maps.LatLng(_lat, _lng);
    var mapOptions = {
      zoom:7,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: myLocation
    }
    map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
    directionsDisplay.setMap(map);
  }

  function calcRoute() {
    var start = new google.maps.LatLng(_lat, _lng);
    var end = new google.maps.LatLng(_promo_lat, _promo_lng);
    var request = {
        origin:start,
        destination:end,
        travelMode: google.maps.DirectionsTravelMode.WALKING
    };
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
      }
    });
  }
