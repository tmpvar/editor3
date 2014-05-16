if (typeof require !== 'undefined') {
  var ModeManager = require('modemanager');
}

function Editor3(selector, parentSelector, scene, renderer, camera) {
  var modeManager = this.modeManager = new ModeManager();
  var editor = this, animationRequest = null, bound = [];
  this.container = document.querySelector(selector)
  this.parentElement = document.querySelector(parentSelector)

  modeManager.activate = function() {
    editor.renderer.domElement.focus();

    // Start rendering
    animationRequest = requestAnimationFrame(function tick(time) {
      editor.render(time);
      requestAnimationFrame(tick);
    });

    // bind events
    [
      'mousedown', 'mousemove', 'mouseup',
      'contextmenu', 'mousewheel', ['DOMMouseScroll', 'mousewheel'],
      'keydown', 'keyup'
    ].forEach(function(name) {

      var target = name;
      if (Array.isArray(name)) {
        target = name[1];
        name = name[0];
      }

      var handler = modeManager.handle.bind(modeManager, target);
      bound.push([name, handler]);

      document.addEventListener(name, handler);
    });
  };

  modeManager.deactivate = function() {
    animationRequest && cancelAnimationFrame(animationRequest)

    while (bound && bound.length) {
      var binding = bound.pop();
      document.removeEventListener(binding[0], binding[1]);
    }
  };

  this.updateSteps = [];

  this.scene = new THREE.Scene();

  this.camera = new THREE.PerspectiveCamera(70, 4/3, 1, 1000);
  this.camera.position.set( 0, 10, 40 );
  this.scene.add(this.camera);

  this.renderer = renderer || new THREE.WebGLRenderer({
    antialias : true,
    stencil: true,
    preserveDrawingBuffer: true
  });

  this.camera.canvas = this.renderer.domElement;

  var light = new THREE.HemisphereLight( 0xffffff, 0x222225, .6);
  light.position = this.camera.position;
  this.scene.add( light );


  this.container.appendChild( this.renderer.domElement );

  this.resize();
  window.addEventListener('resize', this.resize.bind(this), false);
  this.renderer.setClearColor(0x222225);
};

Editor3.prototype.resize = function() {
  var w = this.container.offsetWidth;
  var h = this.container.offsetHeight;

  this.renderer.setSize(w, h);
  this.camera.aspect = w/h;
  this.camera.updateProjectionMatrix();
}

Editor3.prototype.lastRender = 0;
Editor3.prototype.render = function(t) {

  var updateSteps = this.updateSteps;
  var d = t - this.lastRender;
  this.lastRender = t;

  this.renderer.render(this.scene, this.camera);

  for (var i = 0; i<updateSteps.length; i++) {
    if (typeof updateSteps[i].update === 'function') {
      updateSteps[i].update(d);
    } else if (typeof updateSteps[i] === 'function') {
      updateSteps[i](d);
    }
  }
};

Editor3.prototype.createMesh = function() {
  return new Editor3.Mesh();
};

Editor3.prototype.addMesh = function(mesh) {
  this.scene.add(mesh);
};

Editor3.prototype.removeMesh = function(mesh) {
  this.scene.remove(mesh);
};

function Editor3Mesh(geometry, material) {
  THREE.Mesh.call(this,
    geometry || new THREE.Geometry(),
    material || this.defaultMaterial
  );

  this.seenVerts = {};
};

THREE.Mesh.prototype.constructor = THREE.Mesh;
Editor3Mesh.prototype = Object.create(THREE.Mesh.prototype);
Editor3Mesh.prototype.constructor = THREE.Editor3Mesh;

Editor3Mesh.prototype.defaultMaterial = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  emissive: 0x020202,
  ambient: 0x111111,
  shading: THREE.SmoothShading,
  transparent: true,
  opacity: 1,
  shinyness: 100,
  wireframe: false
});

Editor3Mesh.prototype.restOnOrigin = function() {

  this.geometry.computeBoundingBox();

  var bounds = this.geometry.boundingBox;
  var d = -bounds.min.z;

  this.position.z += d;
  bounds.min.z += d;
  bounds.max.z += d;
};



Editor3Mesh.prototype.boundingBox = function(position) {
  var max = [-Infinity, -Infinity, -Infinity];
  var min = [Infinity, Infinity, Infinity];

  var verts = this.geometry.vertices;
  for (var i = 0; i<verts.length; i++) {
    var v = verts[i];

    if (v.x > max[0]) {
      max[0] = v.x
    }

    if (v.y > max[1]) {
      max[1] = v.y
    }

    if (v.z > max[2]) {
      max[2] = v.z
    }

    if (v.x < min[0]) {
      min[0] = v.x
    }

    if (v.y < min[1]) {
      min[1] = v.y
    }

    if (v.z < min[2]) {
      min[2] = v.z
    }
  }

  return [min, max];
};

Editor3Mesh.prototype.addFace = function(verts, normal) {
  if (!verts) {
    return;
  }
  var seen = this.seenVerts;
  var geometry = this.geometry;

  var faceIds = verts.map(function(vert) {
    var key = vert.join(',');

    if (!seen[key]) {
      seen[key] = geometry.vertices.length;
      geometry.vertices.push(new THREE.Vector3(
        vert[0],
        vert[1],
        vert[2]
      ));
    }

    return seen[key];
  });

  this.geometry.faces.push(new THREE.Face3(
    faceIds[0],
    faceIds[1],
    faceIds[2],
    new THREE.Vector3(
      normal[0],
      normal[1],
      normal[2]
    )
  ));

  return this;
};

Editor3Mesh.prototype.finalize = function() {
  this.geometry.mergeVertices();
  this.geometry.computeBoundingBox();
  this.geometry.computeFaceNormals();
  return this;
};

Editor3.Mesh = Editor3Mesh;


if (typeof module !== "undefined" && typeof module.exports == "object") {
  module.exports = Editor3;
}

if (typeof window !== "undefined") {
  window.Editor3 = window.Editor3 || Editor3;
}
