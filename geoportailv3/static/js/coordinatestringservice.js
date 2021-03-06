/**
 * @fileoverview Provides a coordinate string output service, useful for
 * correctly formatted coordinate strings in different projections.
 */

goog.provide('app.CoordinateString');

goog.require('app.projections');
goog.require('goog.math');
goog.require('goog.string');
goog.require('ol.coordinate');
goog.require('ol.proj');


/**
 * @typedef {function(ol.Coordinate, string, string, boolean=):string}
 */
app.CoordinateString;


/**
 * @private
 * @return {app.CoordinateString} The coordinate string.
 * @ngInject
 */
app.coordinateString_ = function() {
  return coordinateString;

  /**
   * @param {ol.Coordinate} coordinate The coordinate.
   * @param {string} sourceEpsgCode The source epsg.
   * @param {string} targetEpsgCode The target epsg.
   * @param {boolean=} opt_DMS True if DMS.
   * @return {string} The coordinate string.
   */
  function coordinateString(coordinate, sourceEpsgCode,
      targetEpsgCode, opt_DMS) {
    var str = '';
    if (targetEpsgCode === 'EPSG:3263*') {
      var lonlat = /** @type {ol.Coordinate} */
          (ol.proj.transform(coordinate, sourceEpsgCode, 'EPSG:4326'));
      targetEpsgCode = Math.floor(lonlat[0]) >= 6 ? 'EPSG:32632' : 'EPSG:32631';
    }

    coordinate = ol.proj.transform(coordinate, sourceEpsgCode, targetEpsgCode);

    switch (targetEpsgCode) {
      default:
      case 'EPSG:2169':
        str = ol.coordinate.format(coordinate, '{x} E | {y} N', 0);
        break;
      case 'EPSG:4326':
        if (goog.isDef(opt_DMS) && opt_DMS === true) {
          var hdms = toStringHDMS_(coordinate);
          var yhdms = hdms.split(' ').slice(0, 4).join(' ');
          var xhdms = hdms.split(' ').slice(4, 8).join(' ');
          str = xhdms + ' | ' + yhdms;
        } else {
          str = ol.coordinate.format(coordinate, ' {x} E | {y} N', 5);
        }
        break;
      case 'EPSG:32632':
        str = ol.coordinate.format(coordinate, '{x} | {y} (UTM32N)', 0);
        break;
      case 'EPSG:32631':
        str = ol.coordinate.format(coordinate, '{x} | {y} (UTM31N)', 0);
        break;
    }
    return str;
  }

  /**
   * @private
   * @param {ol.Coordinate|undefined} coordinate Coordinate.
   * @return {string} Hemisphere, degrees, minutes and seconds.
   */
  function toStringHDMS_(coordinate) {
    if (goog.isDef(coordinate)) {
      return degreesToStringHDMS_(coordinate[1], 'NS') + ' ' +
          degreesToStringHDMS_(coordinate[0], 'EW');
    } else {
      return '';
    }
  }

  /**
   * @private
   * @param {number} degrees Degrees.
   * @param {string} hemispheres Hemispheres.
   * @return {string} String.
   */
  function degreesToStringHDMS_(degrees, hemispheres) {
    var normalizedDegrees = goog.math.modulo(degrees + 180, 360) - 180;
    var x = Math.abs(3600 * normalizedDegrees);
    return Math.floor(x / 3600) + '\u00b0 ' +
        goog.string.padNumber(Math.floor((x / 60) % 60), 2) + '\u2032 ' +
        goog.string.padNumber(Math.floor(x % 60), 2) + ',' +
        Math.floor((x - (x < 0 ? Math.ceil(x) : Math.floor(x))) * 10) +
        '\u2033 ' + hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0);
  }
};

app.module.service('appCoordinateString', app.coordinateString_);
