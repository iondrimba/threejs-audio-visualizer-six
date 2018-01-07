import Loader from './loader';
import OrbitControls from 'threejs-controls/OrbitControls';
import { TweenMax, Power2 } from 'gsap';

class App {
  constructor() {
    this.songFile = 'high-beams.mp3';
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
    this.addSpotLight();
    this.addCameraControls();
    this.addFloor();
    this.animate();
    this.playSound(file);
    this.addEventListener();
    //this.scene.add(this.createObj(this.objectsColor));


    //    this.scene.add(this.createSphere(this.objectsColor));
    const geo = new THREE.IcosahedronGeometry(5, 2);

    const mat = new THREE.MeshStandardMaterial({
      color: this.objectsColor,
      emissive: 0x0,
      flatShading: true
    });
    mat.transparent = true;
    mat.opacity = 0;
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(0,2,0);
    this.scene.add(this.mesh);
    this.helper = new THREE.FaceNormalsHelper(this.mesh, 2, 0x00ff00, 1);
    //this.scene.add( this.helper );

    let startAngle = 0;
    let radius = 1;
    let previous = 0;
    let total = 30;
    const l = 360 / total;
    var prev = [];

    // for (var i = 0; i < 4; i++) {
    //   startAngle = 1 * i;
    //   const sphere = this.createSphere(this.objectsColor);
    //   let x = (1 * startAngle) * Math.cos(startAngle);
    //   let y = (1 * startAngle) * Math.sin(startAngle);

    //   if (prev.length) {
    //     x = Math.sin((prev[i - 1].x + this.radians(360 / i)));
    //     y = Math.cos((prev[i - 1].y + this.radians(360 / i)));
    //     sphere.position.set(x, 0, y);
    //   } else {
    //     sphere.position.set(x, 0, y);
    //   }

    //   prev.push(sphere.position);

    //   this.scene.add(sphere);
    // }

    for (let index = 0; index < this.mesh.geometry.faces.length; index++) {
      const sphere = this.createSphere(this.objectsColor);
      const v = this.mesh.geometry.faces[index].normal;
      const diff = 5;
      sphere.position.set(v.x * diff, v.y * diff, v.z * diff);
      sphere.orig = {
        x: sphere.position.x,
        y: sphere.position.y,
        z: sphere.position.z
      };

      this.rowTiles.push(sphere);
      this.mesh.add(sphere);
    }

    this.addGrid();
  }

  addGrid() {
    const size = 25;
    const divisions = 25;

    const gridHelper = new THREE.GridHelper(size, divisions);
    gridHelper.position.set(0, 0, 0);
    gridHelper.material.opacity = 0;
    gridHelper.material.transparent = true;
    //console.log(gridHelper.geometry);
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
      let index = 0;
      const diff = 5;
      for (var i = 0; i < this.rowTiles.length; i++) {
        var pos = this.rowTiles[i].orig;
        const freq = this.frequencyData[i];
        let y = this.map(freq, 0, 255, pos.y/diff, pos.y * diff);
        let x = this.map(freq, 0, 255, pos.x/diff, pos.x * diff);
        let z = this.map(freq, 0, 255, pos.z/diff, pos.z * diff);

        TweenMax.to(this.rowTiles[i].position, .2, {
          x: x,
          y: y,
          z: z
        });
        index++;
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

    this.groupTiles.position.set(10, 0, -5);
    this.scene.add(this.groupTiles);

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

  createObj(color) {
    const radius = 1;
    const detail = 0;
    const geometry = new THREE.OctahedronBufferGeometry(radius, detail);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: 0x0,
      specular: 0x0,
      shininess: 1,
      flatShading: false
    });
    const obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;
    obj.receiveShadow = true;
    obj.position.set(0, 2, 0);
    //obj.position.z = -2.5;
    //obj.size = 1;
    // obj.material.opacity = 0;
    // obj.material.transparent = true;

    const pivot = new THREE.Object3D();
    pivot.add(obj);
    //pivot.size = 1;
    return pivot;
  }

  createSphere(color) {
    const radius = .3;
    const detail = 0;
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: 0x586300,
      roughness: 0.15,
      metalness: 0.64
    });
    const obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;
    obj.lookAt(this.scene.position)
    obj.receiveShadow = true;
    obj.position.set(0, 0, 0);
    //obj.position.z = -2.5;
    //obj.size = 1;
    // obj.material.opacity = 0;
    // obj.material.transparent = true;

    const pivot = new THREE.Object3D();
    pivot.add(obj);
    //pivot.size = 1;
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
    const planeMaterial = new THREE.ShadowMaterial({ opacity: .1 });

    this.floor = new THREE.Mesh(planeGeometry, planeMaterial);

    planeGeometry.rotateX(- Math.PI / 2);

    this.floor.position.y = 0;
    this.floor.receiveShadow = true;

    //console.log(this.floor.geometry);

    this.scene.add(this.floor);
  }

  addSpotLight() {
    this.spotLight = new THREE.SpotLight(this.objectsColor);
    this.spotLight.position.set(20, 60, 20);
    this.spotLight.castShadow = true;
    // this.spotLight.angle = Math.PI / 4;
    // this.spotLight.penumbra = 0;
    this.spotLight.decay = .5;
    // this.spotLight.distance = 100;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.spotLight.shadow.camera.near = 10;
    this.spotLight.shadow.camera.far = 100;

    this.scene.add(this.spotLight);

    // var lights = [];
    // lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    // lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    // lights[2] = new THREE.PointLight(0xffffff, 1, 0);

    // lights[0].position.set(10, 200, 110);
    // lights[1].position.set(-100, -200, 100);
    // lights[2].position.set(- 100, 200, - 100);

    // this.scene.add(lights[0]);
    // this.scene.add(lights[1]);
    // this.scene.add(lights[2]);
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight(0xffffff);
    this.scene.add(light);
  }

  animate() {


    this.controls.update();

    // if (this.rowTiles[this.rowTiles.length - 1]) {
    //   const x = -this.rowTiles[this.rowTiles.length - 1][0].position.x + 15;
    //   TweenMax.to(this.groupTiles.position, 1, {
    //     x: x,
    //     ease: Power2.easeOut
    //   });
    // }

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
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.source = this.audioCtx.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.source.connect(this.audioCtx.destination);

    this.bufferLength = this.analyser.frequencyBinCount;

    this.frequencyData = new Uint8Array(this.bufferLength);
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
