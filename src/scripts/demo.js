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
    this.addAmbientLight();
    this.addSpotLight(new THREE.SpotLight(0xffffff), 0, 200, 0);
    this.addCameraControls();
    this.addFloor();

    this.playSound(file);
    this.addEventListener();

    this.addGrid();

    this.shape = this.createShape();
    this.createGround(this.shape);

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

    this.createHoles(shape, size);

    return shape;
  }

  createHoles(shape, size) {
    const total = 3;
    const radius = .5;
    const positions = [0, 1, 2];

    const cols = 10;
    const rows = cols / 2;
    const space = radius + .5;
    const finalPos = (i, space) => {
      return (-i * space);
    }

    const sphereGap = 5;

    for (let i = -4; i < 5; i++) {
      for (let j = -5; j < 0; j++) {
        const holePath = new THREE.Path();
        const x = finalPos(i, space);
        const y = finalPos(j, space);

        holePath.moveTo(x, y);
        holePath.ellipse(x, y, radius, radius, 0, Math.PI * 2);
        holePath.autoClose = true;
        shape.holes.push(holePath);

        const sphere = this.createSphere(this.objectsColor);

        sphere.position.set(x - (i * 1), 0, y - (j * 1));

        this.groupSpheres.add(sphere);

        this.tiles.push(sphere);
      }
    }

    this.scene.add(this.groupSpheres);

    for (let i = -4; i < 5; i++) {
      for (let j = 1; j < 6; j++) {
        const holePath = new THREE.Path();
        const x = finalPos(i, space);
        const y = finalPos(j, space);

        holePath.moveTo(finalPos(i, space), finalPos(j, space));
        holePath.ellipse(finalPos(i, space), finalPos(j, space), radius, radius, 0, Math.PI * 2);
        holePath.autoClose = true;
        shape.holes.push(holePath);

        const cones = this.create3DObj(this.objectsColor);
        cones.notSphere = true;

        cones.position.set(x - (i * 1), -10, y - (j * 1));

        this.groupCones.add(cones);

        this.tiles.push(cones);
      }
    }

    this.scene.add(this.groupCones);
  }

  createGround(shape) {
    var materials = [
      // top
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1,
        metalness: 0.1,
        flatShading: THREE.FlatShading
      }),
      // inside
      new THREE.MeshStandardMaterial({
        color: 0xf9f9f9,
        roughness: 0,
        metalness: 0.6,
        flatShading: THREE.FlatShading
      })
    ];

    const props = {
      steps: 1,
      amount: 5,
      bevelEnabled: false
    }

    const geometry = new THREE.ExtrudeGeometry(
      shape,
      props
    );

    const bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.receiveShadow = true;
    mesh.rotation.set(Math.PI * 0.5, 0, 0);
    this.scene.add(mesh);
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
    this.camera.position.set(0, 40, 0);
    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.controls = new OrbitControls(this.camera);
  }

  drawWave() {
    let velocity = 0;
    let freq = 0;
    let scale = 0;

    if (this.playing) {
      this.analyser.getByteFrequencyData(this.frequencyData);

      for (let i = 0; i < this.tiles.length; i++) {
        freq = this.frequencyData[i];

        if (this.tiles[i] && !this.tiles[i].notSphere && !this.tiles[i].falling) {

          velocity = this.map(freq, 0, 255, -50, 80);
          this.tiles[i].gravity
            .set(Math.min(0, this.tiles[i].ballY.get()))
            .setVelocity(-(velocity));

          this.tiles[i].falling = true;
        }

        if(this.tiles[i] && this.tiles[i].notSphere) {
          scale = this.map(freq, 0, 255, 0.001, 2);
          TweenMax.to(this.tiles[i].scale, .3, {
              y: scale
          });
        }
      }
    }
  }

  createSphere(color) {
    const geometry = new THREE.SphereGeometry(.5, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x8b05f5,
      specular: 0x8c0df0,
      emissive: 0x0,
      flatShading: THREE.FlatShading,
      side: THREE.DoubleSide
    });


    let sphere = new THREE.Mesh(geometry, material);
    sphere.position.y = 0;
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    const ballY = value(10, (v) => {
      sphere.position.y = -Math.min(10, v);
    });
    sphere.ballY = ballY;
    sphere.falling = false;

    const gravity = physics({
      acceleration: 250,
      restSpeed: false
    }).start((v) => {
      if (sphere.falling) {
        if (v < 10) {
          ballY.update(v);
        } else {
          sphere.falling = false;
        }
      }
    });

    sphere.gravity = gravity;

    return sphere;
  }

  create3DObj(color) {
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

  onResize() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    this.camera.aspect = ww / wh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(ww, wh);
  }

  addFloor() {
    const planeGeometry = new THREE.PlaneGeometry(250, 250);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: .05 });

    this.floor = new THREE.Mesh(planeGeometry, planeMaterial);

    planeGeometry.rotateX(- Math.PI / 2);

    this.floor.position.y = 0;
    this.floor.receiveShadow = true;

    this.scene.add(this.floor);
  }

  addSpotLight(spotLight, x, y, z) {
    this.spotLight = spotLight;
    this.spotLight.position.set(x, y, z);
    this.spotLight.castShadow = true;

    this.scene.add(this.spotLight);
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight(0xffffff, .5);
    this.scene.add(light);
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
