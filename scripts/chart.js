;(function(window){
    'use strict';
    var httpRequest;
    var makeRequest = function(url) { 
        httpRequest = new XMLHttpRequest();
        if(!httpRequest) {
            console.log("Unable to create XMLHTTP instance.");
            return false;
        }
        httpRequest.onreadystatechange = alertContents;
        httpRequest.open('POST', url, true);
        httpRequest.send();
    };
    var alertContents = function() {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if(httpRequest.status === 200) {
                parseData(httpRequest.responseText);
            } else {
                console.log("There was a problem with the request");
            }
        }
    };
    makeRequest('res/data/user_data.json');
})(window);