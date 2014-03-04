var editor3;
if (typeof require !== "undefined") {
  editor3 = require("../editor3.js");
} else {
  editor3 = window.editor3;
}

var ok = function(a, msg) { if (!a) throw new Error(msg || "not ok"); };
var eq = function(a, b) { if (a!==b) throw new Error(a + " !== " + b); };

describe('editor3', function() {
  describe('#', function() {
    it('', function() {
      
    });
  });
});
