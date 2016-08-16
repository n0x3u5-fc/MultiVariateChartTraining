;(function() {
	'use strict';
	/**
	 * @constructor
	 */
	Chart.MappedChart = function(index, xTitle, yTitle, xData, yData, yTicks, xTicks) {
	    this.index  = index;
	    this.xTitle = xTitle;
	    this.yTitle = yTitle;
	    this.xData  = xData;
	    this.yData  = yData;
	    this.yTicks = yTicks;
	    this.xTicks = xTicks;
	};
})();