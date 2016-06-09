goog.provide('index');

goog.require('lux');

var map = new lux.Map({
  target: 'mapContainer'
  ,lon: 6.13
  ,lat: 49.61
  ,zoom: 14
  ,layers: [ 'streets_jpeg' ]
});
