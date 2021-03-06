goog.provide('app.MeasureLength');

goog.require('app.Measure');
goog.require('ol.geom.LineString');
goog.require('ol.interaction.Draw');


/**
 * @classdesc
 * Interaction dedicated to measure length.
 *
 * @constructor
 * @extends {app.Measure}
 * @param {ngeox.interaction.MeasureOptions=} opt_options Options
 */
app.MeasureLength = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, options);


  /**
   * Message to show after the first point is clicked.
   * @type {Element}
   */
  this.continueMsg = goog.isDef(options.continueMsg) ? options.continueMsg :
      goog.dom.createDom(goog.dom.TagName.SPAN, {},
          'Click to continue drawing the line.',
          goog.dom.createDom(goog.dom.TagName.BR),
          'Double-click or click last point to finish.');

};
goog.inherits(app.MeasureLength, app.Measure);


/**
 * @inheritDoc
 */
app.MeasureLength.prototype.getDrawInteraction = function(style,
    source) {

  return new ol.interaction.Draw(
      /** @type {olx.interaction.DrawOptions} */ ({
        type: 'LineString',
        source: source,
        style: style
      }));

};


/**
 * @inheritDoc
 */
app.MeasureLength.prototype.handleMeasure = function(callback) {
  var geom = /** @type {ol.geom.LineString} */
      (this.sketchFeature.getGeometry());
  var proj = this.getMap().getView().getProjection();
  var output = app.Measure.getFormattedLength(geom, proj);
  var coord = geom.getLastCoordinate();
  callback(output, coord);
};


/**
 * Continue to draw an existing line.
 * @param {!ol.Feature} feature The feature to continue.
 */
app.MeasureLength.prototype.continueLine = function(feature) {
  this.modifyMode = true;
  this.getCurrentDrawInteraction().extend(feature);
  this.setActive(true);
};
