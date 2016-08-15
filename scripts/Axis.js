goog.require("Chart");
goog.require("chartUtilities");
;(function() {
	'use strict';
	/**
	 * @constructor
	 */
	Chart.Axis = function(startX, startY, endX, endY, className, columnsAreComplete) {
		this.startX    = startX;
		this.startY    = startY;
		this.endX      = endX;
		this.endY      = endY;
		this.className = className;
		this.svgHelper = new SvgHelper();
		this.columnsAreComplete = columnsAreComplete;
	};
	Chart.Axis.prototype.render = function(svg) {
		var yLine = this.svgHelper.drawLineByClass(this.startX, this.startY, this.endX,
												   this.endY, this.className);
		svg.appendChild(yLine);
	};
})();
