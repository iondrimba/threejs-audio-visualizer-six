import Loader from './loader';
import OrbitControls from 'threejs-controls/OrbitControls';
import { TweenMax, Power2 } from 'gsap';

class App {
  constructor() {
    this.songFile = 'saved_by_the_bell.mp3';
    this.percent = 0;
    this.playing = false;
    this.volume = 1;
    this.sceneBackGroundColor = 0x1878de;
    this.objectsColor = 0xfff700;
    this.rowTiles = [];
    this.groupTiles = new THREE.Object3D();

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
      }, 300);
    }
  }

  complete(file) {
    this.firstRing = new THREE.Object3D();

    this.setupAudio();
    this.addSoundControls();
    this.createScene();
    this.createCamera();
    this.addAmbientLight();
    this.addSpotLight(new THREE.SpotLight(this.objectsColor), 0, 30, 0);
    this.addCameraControls();
    this.addFloor();
    this.animate();
    this.playSound(file);
    this.addEventListener();

    this.groupTiles = new THREE.Object3D();
    this.scene.add(this.groupTiles);
    var gutter = 2;

    var positions = [];
    var index = 0;
    this.rowTiles = [];
    this.tiles = [];

    let prevPos = 0;

    const hasPrev = this.rowTiles.length && this.rowTiles[this.rowTiles.length - 1][0].position;

    if (this.rowTiles.length) {
      prevPos = this.rowTiles[this.rowTiles.length - 1][0].position.x + gutter;
    }
    const cols = 10;
    const rows = 10;
    for (let col = 0; col < cols; col++) {
      positions[col] = [];
      this.rowTiles.push([]);

      for (let row = 0; row < rows; row++) {
        const pos = {
          z: row,
          y: 0,
          x: hasPrev ? prevPos : col
        }

        positions[col][row] = pos;
        const plane = this.createSphere(this.objectsColor);

        plane.scale.set(1, 0.001, 1);

        if (col > 0) {
          pos.x = (positions[col - 1][row].x * 1) + gutter;
        }

        if (row > 0) {
          pos.z = (positions[col][row - 1].z * 1) + gutter;
        }

        plane.position.set(pos.x, pos.y, pos.z);

        this.groupTiles.add(plane);

        this.tiles.push(plane);

        this.rowTiles[this.rowTiles.length - 1].push(plane);

        index++;
      }

      index++;
    }

    this.groupTiles.position.set(-(cols-1), 0, -(rows-1));

    this.addGrid();
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
    this.audioElement.load();
  }

  map(value, start1, stop1, start2, stop2) {
    return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2
  }

  drawWave() {
    if (this.playing) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      for (var i = 0; i < this.frequencyData.length; i++) {
        const freq = this.frequencyData[i];
        let scale = this.map(freq, 0, 255, 0.001, 1);

        if (this.tiles[i]) {
          TweenMax.to(this.tiles[i].scale, .3, {
            y: scale
          });
        }
      }
    }
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
    this.camera.position.set(20, 20, -20);
    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.controls = new OrbitControls(this.camera);
  }


  createSphere(color) {
    const geometry = new THREE.CylinderGeometry(.4, .4, 10, 59);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: 0x586300,
      roughness: 0.15,
      metalness: 0.64
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
    const light = new THREE.AmbientLight(0xffffff);
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
    //this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.3;

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
    });
  }
}

window.app = new App();

window.addEventListener('resize', app.onResize.bind(app));
