var Axis = function() {
	'use strict';
};
Axis.prototype.startX        = 0;
Axis.prototype.startY        = 0;
Axis.prototype.endX          = 0;
Axis.prototype.endY          = 0;
Axis.prototype.className	 = "";
Axis.prototype.render = function(svgHelper) {
	'use strict';
	svgHelper.drawLine(this.startX, this.startY, this.endX, this.endY, this.className);
};