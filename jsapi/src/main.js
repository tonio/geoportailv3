goog.provide('lux');
goog.provide('lux.Map');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.source.WMTSRequestEncoding');

/**
 * @classdesc
 * The map is the core component of the Geoportail V3 API.
 *
 * @constructor
 * @extends {ol.Map}
 * @param {olx.MapOptions} options Map options.
 * @export
 */
lux.Map = function(options) {
  var viewOptions = {
    center : ol.proj.fromLonLat([6.215, 49.845]),
    zoom   : 9
  };
  var bgLayers = {
    'basemap_2015_global' : 'png',
    'topo_bw_jpeg'        : 'jpeg',
    'topogr_global'       : 'png',
    'orthogr_2013_global' : 'jpeg',
    'streets_jpeg'        : 'png'
  };
  var defaultBg  = 'basemap_2015_global';
  var layers     = options.layers;
  options.layers = [];
  var addLayer   = function(layer) {
    if (!layer in bgLayers) {
      layer = defaultBg;
    }
    options.layers.push(
      lux.WMTSLayerFactory_(layer, bgLayers[layer])
    );
  };

  if (layers) {
    addLayer(layers[0]);
  } else {
    addLayer(defaultBg);
  }

  if (options.lon && options.lat) {
    viewOptions.center = ol.proj.fromLonLat([options.lon, options.lat]);
    delete options.lon;
    delete options.lat;
  }
  if (options.zoom) {
    viewOptions.zoom = options.zoom;
    delete options.zoom;
  }

  options.view = new ol.View(viewOptions);
  console.log(options)

  goog.base(this, options);
};

goog.inherits(lux.Map, ol.Map);

/**
 * @param {string} name WMTS layer name.
 * @param {string} imageExt Image extension (e.g. "png").
 * @return {ol.layer.Tile} The layer.
 */
lux.WMTSLayerFactory_ = function(name, imageExt) {

  var url = '//wmts{1-2}.geoportail.lu/mapproxy_4_v3/wmts/{Layer}/' +
  '{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.' + imageExt;

  var layer = new ol.layer.Tile({
    source: new ol.source.WMTS({
      url             : url,
      layer           : name,
      matrixSet       : 'GLOBAL_WEBMERCATOR_4_V3',
      format          : 'image/' + imageExt,
      requestEncoding : ol.source.WMTSRequestEncoding.REST,
      projection      : ol.proj.get('EPSG:3857'),
      tileGrid        : new ol.tilegrid.WMTS({
        origin: [
          -20037508.3428, 20037508.3428
        ],
        resolutions: [
          156543.033928, 78271.516964, 39135.758482, 19567.879241,
          9783.9396205, 4891.96981025, 2445.98490513, 1222.99245256,
          611.496226281, 305.748113141, 152.87405657, 76.4370282852,
          38.2185141426, 19.1092570713, 9.55462853565, 4.77731426782,
          2.38865713391, 1.19432856696, 0.597164283478, 0.298582141739,
          0.1492910708695, 0.07464553543475
        ],
        matrixIds: [
          '00', '01', '02', '03', '04', '05', '06', '07', '08', '09',
          '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
          '20', '21'
        ]
      }),
      style: 'default',
      crossOrigin: 'anonymous'
    })
  });

  return layer;
}
