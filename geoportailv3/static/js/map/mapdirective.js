/**
 * @fileoverview This file provides the "map" directive.
 *
 * Example:
 *
 * <app-map app-map-map="::mainCtrl.map"><app-map>
 */
goog.provide('app.mapDirective');

goog.require('app');
goog.require('app.StateManager');
goog.require('app.infobarDirective');
goog.require('app.projections');
goog.require('goog.asserts');
goog.require('ngeo.Debounce');
goog.require('ngeo.mapDirective');
goog.require('ol.proj');


/**
 * @param {string} appMapTemplateUrl URL to map template.
 * @return {angular.Directive} The Directive Definition Object.
 * @ngInject
 */
app.mapDirective = function(appMapTemplateUrl) {
  return {
    scope: {
      'map': '=appMapMap'
    },
    bindToController: true,
    controller: 'AppMapController',
    controllerAs: 'ctrl',
    templateUrl: appMapTemplateUrl
  };
};


app.module.directive('appMap', app.mapDirective);



/**
 * @param {app.StateManager} appStateManager State manager service.
 * @param {ngeo.Debounce} ngeoDebounce ngeo debounce service.
 * @constructor
 * @ngInject
 */
app.MapController = function(appStateManager, ngeoDebounce) {
  var lurefToWebMercatorFn = ol.proj.getTransform('EPSG:2169', 'EPSG:3857');

  /** @type {ol.Map} */
  var map = this['map'];
  var view = map.getView();

  /** @type {number} */
  var version = appStateManager.getVersion();

  var zoom = appStateManager.getInitialValue('zoom');

  /** @type {number} */
  var viewZoom;
  if (goog.isDef(zoom)) {
    viewZoom = version === 3 ? +zoom :
        app.MapController.V2_ZOOM_TO_V3_ZOOM_[zoom];
  } else {
    viewZoom = 8;
  }

  var x = appStateManager.getInitialValue('X');
  var y = appStateManager.getInitialValue('Y');

  /** @type {ol.Coordinate} */
  var viewCenter;
  if (goog.isDef(x) && goog.isDef(y)) {
    viewCenter = version === 3 ?
        [+x, +y] : lurefToWebMercatorFn([+y, +x], undefined, 2);
  } else {
    viewCenter = ol.proj.transform([6, 49.7], 'EPSG:4326', 'EPSG:3857');
  }

  view.setCenter(viewCenter);
  view.setZoom(viewZoom);

  app.MapController.updateState_(appStateManager, view);

  view.on('propertychange',
      ngeoDebounce(
          /**
           * @param {ol.ObjectEvent} e Object event.
           */
          function(e) {
            app.MapController.updateState_(appStateManager, view);
          }, 300, /* invokeApply */ true));
};


/**
 * FIXME we don't have a view zoom for url zoom 11.
 * @const
 * @private
 */
app.MapController.V2_ZOOM_TO_V3_ZOOM_ = {
  '0': 9,
  '1': 10,
  '2': 11,
  '3': 12,
  '4': 13,
  '5': 14,
  '6': 15,
  '7': 16,
  '8': 17,
  '9': 18,
  '10': 19,
  '11': 19
};


/**
 * @param {app.StateManager} appStateManager Application state manager.
 * @param {ol.View} view Map view.
 * @private
 */
app.MapController.updateState_ = function(appStateManager, view) {
  var viewZoom = view.getZoom();
  var viewCenter = view.getCenter();
  goog.asserts.assert(goog.isDef(viewCenter));
  goog.asserts.assert(goog.isDef(viewZoom));
  appStateManager.updateState({
    'zoom': viewZoom,
    'X': Math.round(viewCenter[0]),
    'Y': Math.round(viewCenter[1])
  });
};


app.module.controller('AppMapController', app.MapController);