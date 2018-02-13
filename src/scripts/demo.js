import Loader from './loader';
import OrbitControls from 'threejs-controls/OrbitControls';
import Reflector from './reflector';
import { TweenMax, Power2 } from 'gsap';
import { easing, physics, spring, tween, styler, listen, value, transform } from 'popmotion';

class App {
  constructor() {
    this.songFile = 'ready_player_one.mp3';
    this.percent = 0;
    this.playing = false;
    this.volume = 1;
    this.sceneBackGroundColor = 0x0;
    this.objectsColor = 0x0;
    this.spotLightColor = 0xffffff;
    this.ambientLightColor = 0xffffff;

    this.groupSpheres = new THREE.Object3D();
    this.groupCones = new THREE.Object3D();

    this.tiles = [];

    this.loader = new Loader();
    this.loader.progress((percent) => { this.progress(percent); });
    this.loaderBar = document.querySelector('.loader');
    this.loader.load(this.songFile);
    this.playIntro = document.querySelector('.play-intro');
    this.loader.complete = this.complete.bind(this);

  }

  progress(percent) {
    this.loaderBar.style.transform = `scale(${(percent / 100) + .1}, 1.1)`;
    if (percent === 100) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          this.playIntro.classList.add('control-show');
          this.loaderBar.classList.add('removeLoader');
          this.loaderBar.style.transform = 'scale(1, 0)';
        })
      }, 800);
    }
  }

  complete(file) {
    this.setupAudio();
    this.addSoundControls();
    this.createScene();
    this.createCamera();
    this.addAmbientLight(this.ambientLightColor);
    this.addSpotLight(new THREE.SpotLight(this.spotLightColor), 50, 400, 50);
    this.addCameraControls();

    this.playSound(file);
    this.addEventListener();

    this.addGrid();

    this.floorShape = this.createShape();
    this.createGround(this.floorShape);

    this.animate();
  }

  createShape() {
    const size = 200;
    const vectors = [
      new THREE.Vector2(-size, size),
      new THREE.Vector2(-size, -size),
      new THREE.Vector2(size, -size),
      new THREE.Vector2(size, size)
    ];
    const shape = new THREE.Shape(vectors);
    shape.autoClose = true;

    this.createHoles(shape, {
      cols: {
        start: -4,
        end: 5
      },
      rows: {
        start: -5,
        end: 0
      },
      elementCreate: this.createSphere,
      onAdd: (element, x, y, i, j) => {
        this.addPhysics(element);

        element.position.set(x - (i * 1), -.5, y - (j * 1));

        this.groupSpheres.add(element);

        this.tiles.push(element);
      }
    });

    this.createHoles(shape, {
      cols: {
        start: -4,
        end: 5
      },
      rows: {
        start: 1,
        end: 6
      },
      elementCreate: this.createCone,
      onAdd: (element, x, y, i, j) => {
        element.position.set(x - (i * 1), -10, y - (j * 1));

        this.groupCones.add(element);

        this.tiles.push(element);
      }
    });

    this.scene.add(this.groupSpheres);
    this.scene.add(this.groupCones);

    return shape;
  }

  createHoles(shape, props) {
    const radius = .5;
    const finalPos = (i) => {
      return (-i * 1);
    }

    for (let i = props.cols.start; i < props.cols.end; i++) {
      for (let j = props.rows.start; j < props.rows.end; j++) {
        const holePath = new THREE.Path();
        const x = finalPos(i);
        const y = finalPos(j);

        holePath.moveTo(x, y);
        holePath.ellipse(x, y, radius, radius, 0, Math.PI * 2);
        holePath.autoClose = true;
        shape.holes.push(holePath);

        props.onAdd(props.elementCreate(), x, y, i, j);
      }
    }

    //this.scene.add(this.groupSpheres);

    // for (let i = -4; i < 5; i++) {
    //   for (let j = 1; j < 6; j++) {
    //     const holePath = new THREE.Path();
    //     const x = finalPos(i);
    //     const y = finalPos(j);

    //     holePath.moveTo(finalPos(i), finalPos(j));
    //     holePath.ellipse(finalPos(i), finalPos(j), radius, radius, 0, Math.PI * 2);
    //     holePath.autoClose = true;
    //     shape.holes.push(holePath);

    //     const cones = this.createCone();
    //     cones.hasPhysics = true;

    //     cones.position.set(x - (i * 1), -10, y - (j * 1));

    //     this.groupCones.add(cones);

    //     this.tiles.push(cones);
    //   }
    // }

    // this.scene.add(this.groupCones);
  }

  createGround(shape) {
    var materials = [
      // top
      new THREE.MeshStandardMaterial({
        color: 0xff1876,
        roughness: 1,
        metalness: 0.1,
        flatShading: THREE.FlatShading
      }),
      // inside
      new THREE.MeshStandardMaterial({
        color: 0xf324ff,
        flatShading: THREE.FlatShading
      })
    ];

    const props = {
      steps: 1,
      amount: 4,
      bevelEnabled: false
    }

    const geometry = new THREE.ExtrudeGeometry(
      shape,
      props
    );

    const bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.rotation.set(Math.PI * 0.5, 0, 0);
    this.scene.add(mesh);
  }

  drawWave() {
    let velocity = 0;
    let freq = 0;
    let scale = 0;

    if (this.playing) {
      this.analyser.getByteFrequencyData(this.frequencyData);

      for (let i = 0; i < this.tiles.length; i++) {
        freq = this.frequencyData[i];

        if (this.tiles[i] && !this.tiles[i].hasPhysics) {
          scale = this.map(freq, 0, 255, 0.001, 2);
          TweenMax.to(this.tiles[i].scale, .4, {
            y: scale
          });
        }
      }
    }
  }

  createSphere() {
    const geometry = new THREE.SphereGeometry(.5, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x3a88ff,
      specular: 0xffffff,
      shininess: 2,
      emissive: 0x0b57b9,
      side: THREE.DoubleSide
    });


    let sphere = new THREE.Mesh(geometry, material);
    sphere.position.y = 0;
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    return sphere;
  }

  addPhysics(element) {
    const posY = value(10, (v) => {
      element.position.y = -Math.min(10, v);
    });
    element.posY = posY;
    element.falling = false;
    element.hasPhysics = true;

    const gravity = physics({
      acceleration: 250,
      restSpeed: false
    }).start((v) => {
      if (element.falling) {
        if (v < 10) {
          posY.update(v);
        } else {
          element.falling = false;
        }
      }
    });

    element.gravity = gravity;
  }

  createCone() {
    const geometry = new THREE.CylinderGeometry(.4, .4, 10, 59);
    const material = new THREE.MeshPhongMaterial({
      color: 0x12ff31,
      flatShading: THREE.FlatShading,
      side: THREE.DoubleSide
    });

    const obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;
    obj.receiveShadow = true;
    obj.position.y = 5;

    const pivot = new THREE.Object3D();
    pivot.add(obj);
    pivot.size = 2;
    return pivot;
  }

  addSpotLight(spotLight, x, y, z) {
    this.spotLight = spotLight;
    this.spotLight.position.set(x, y, z);
    this.spotLight.castShadow = true;

    this.scene.add(this.spotLight);
  }

  addAmbientLight(color) {
    const light = new THREE.AmbientLight(color, .5);
    this.scene.add(light);
  }

  addGrid() {
    const size = 25;
    const divisions = size;
    const gridHelper = new THREE.GridHelper(size, divisions);
    gridHelper.position.set(0, 0, 0);
    gridHelper.material.opacity = 0;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }

  playSound(file) {
    this.audioElement.src = file;
  }

  map(value, start1, stop1, start2, stop2) {
    return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2
  }

  addSoundControls() {
    this.btnPlay = document.querySelector('.play');
    this.btnPause = document.querySelector('.pause');

    this.btnPlay.addEventListener('click', () => {
      this.play();
    });

    this.btnPause.addEventListener('click', () => {
      this.pause();
    });
  }

  pause() {
    this.audioElement.pause();
    this.btnPause.classList.remove('control-show');
    this.btnPlay.classList.add('control-show');
  }

  play() {
    this.audioElement.play();
    this.btnPlay.classList.remove('control-show');
    this.btnPause.classList.add('control-show');
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.sceneBackGroundColor);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene1 = new THREE.Scene();

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);
  }

  addEventListener() {
    this.playIntro.addEventListener('click', (evt) => {
      evt.currentTarget.classList.remove('control-show');
      this.play();
    });

    document.body.addEventListener('mouseup', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grab';
        document.body.style.cursor = '-webkit-grab';
      });
    });

    document.body.addEventListener('mousedown', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grabbing';
        document.body.style.cursor = '-webkit-grabbing';
      });
    });

    document.body.addEventListener('keyup', (evt) => {
      if (evt.keyCode === 32 || evt.code === 'Space') {
        this.playIntro.classList.remove('control-show');
        this.playing ? this.pause() : this.play();
      }
    });
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(26, 23, -17);
    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.controls = new OrbitControls(this.camera);
  }

  animate() {
    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    this.drawWave();

    requestAnimationFrame(this.animate.bind(this));
  }

  radians(degrees) {
    return degrees * Math.PI / 180;
  }

  onResize() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    this.camera.aspect = ww / wh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(ww, wh);
  }

  setupAudio() {
    this.audioElement = document.getElementById('audio');
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.4;

    this.source = this.audioCtx.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.source.connect(this.audioCtx.destination);

    this.bufferLength = this.analyser.frequencyBinCount;

    this.waveform = new Uint8Array(this.analyser.fftSize);
    this.frequencyData = new Uint8Array(this.analyser.fftSize);
    this.audioElement.volume = this.volume;

    this.audioElement.addEventListener('playing', () => {
      this.playing = true;
    });
    this.audioElement.addEventListener('pause', () => {
      this.playing = false;
    });
    this.audioElement.addEventListener('ended', () => {
      this.playing = false;
      this.pause();
    });
  }
}

window.app = new App();

window.addEventListener('resize', app.onResize.bind(app));
