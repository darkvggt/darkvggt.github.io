import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';

const BASE_URL = 'https://huggingface.co/datasets/mskweon/3d_ply/resolve/main/';

const PRESET_SCENES = [
  { sceneKey: 'vivid:indoor_aggresive_dark', chunkArrayIdx: 0, thumbFile: 'chunk_000/thumbs/frame_06.jpg', label: 'Indoor Dark 1', pullBack: 2.0, heightFactor: 0.45, upVec: [0, 1, 0], coordConv: 'yflip' },
  { sceneKey: 'vivid:indoor_aggresive_dark', chunkArrayIdx: 1, thumbFile: 'chunk_003/thumbs/frame_07.jpg', label: 'Indoor Dark 2', pullBack: 2.0, heightFactor: 0.45, upVec: [0, 1, 0], coordConv: 'yflip' },
  { sceneKey: 'vivid:outdoor_robust_night2', chunkArrayIdx: 0, thumbFile: 'chunk_007/thumbs/frame_07.jpg', label: 'Outdoor Night 1', pullBack: 2.0, heightFactor: 0.45, upVec: [0, 1, 0], coordConv: 'yflip' },
  { sceneKey: 'sthereo:kaist_evening', chunkArrayIdx: 2, thumbFile: 'chunk_023/thumbs/frame_06.jpg', label: 'Outdoor Night 2', useFirstFrame: true, pullBack: 16.0, heightLift: 14.0, upVec: [0, 1, 0], coordConv: 'zup' },
  { sceneKey: 'eth3d:welllit', chunkArrayIdx: 0, thumbFile: 'chunk_000/thumbs/frame_06.jpg', label: 'ETH3D', initFromBbox: true, bboxFactor: [1.4, 0.5, 0.3], upVec: [0, 1, 0], coordConv: 'yflip_xrot' },
  { sceneKey: 'scannetpp:welllit', chunkArrayIdx: 0, thumbFile: 'chunk_000/thumbs/frame_06.jpg', label: 'ScanNet++', initFromBbox: true, bboxFactor: [1.4, 0.5, 0.3], upVec: [0, 1, 0], coordConv: 'yflip_xrot' },
];

const STYLES = `
#viewer3d-root {
  font-family: 'Inter', sans-serif;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.10);
}
#viewer3d-canvas-wrap {
  position: relative;
  width: 100%;
  height: 500px;
  background: #ffffff;
}
#viewer3d-canvas-wrap canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
#viewer3d-overlay {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 5;
  padding: 4px 0;
}
#viewer3d-model-dropdown {
  position: relative;
  user-select: none;
}
#viewer3d-model-trigger {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  color: #1e293b;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  transition: border-color 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}
#viewer3d-model-trigger:hover {
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139,92,246,0.12);
}
#viewer3d-model-trigger svg {
  transition: transform 0.2s;
  flex-shrink: 0;
}
#viewer3d-model-trigger.open svg {
  transform: rotate(180deg);
}
#viewer3d-model-menu {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  overflow: hidden;
  z-index: 20;
  min-width: 140px;
}
#viewer3d-model-menu.open {
  display: block;
}
.viewer3d-menu-item {
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}
.viewer3d-menu-item:hover {
  background: #f5f3ff;
  color: #7c3aed;
}
.viewer3d-menu-item.selected {
  color: #8b5cf6;
  font-weight: 700;
  background: #faf5ff;
}
.viewer3d-radio-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.viewer3d-radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  user-select: none;
}
.viewer3d-radio-label input[type=radio] {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s;
  flex-shrink: 0;
}
.viewer3d-radio-label input[type=radio]:checked {
  border-color: #8b5cf6;
  background: #8b5cf6;
  box-shadow: inset 0 0 0 3px #fff;
}
.viewer3d-radio-label input[type=radio].thermal-radio:checked {
  border-color: #ff6b35;
  background: #ff6b35;
  box-shadow: inset 0 0 0 3px #fff;
}
#viewer3d-thermal-group {
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 1px solid #e2e8f0;
  padding-left: 12px;
}
#viewer3d-spinner {
  display: none;
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,243,255,0.97) 100%);
  backdrop-filter: blur(8px);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
  z-index: 10;
}
#viewer3d-spinner.active {
  display: flex;
  animation: viewer3d-fadein 0.3s ease;
}
@keyframes viewer3d-fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.viewer3d-spin-orb {
  position: relative;
  width: 72px;
  height: 72px;
}
.viewer3d-spin-orb::before,
.viewer3d-spin-orb::after {
  content: '';
  position: absolute;
  border-radius: 50%;
}
.viewer3d-spin-orb::before {
  inset: 0;
  background: conic-gradient(from 0deg, #ff6b35, #c084fc, #8b5cf6, #ff6b35);
  animation: viewer3d-spin 1.2s linear infinite;
  mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
}
.viewer3d-spin-orb::after {
  inset: 16px;
  background: radial-gradient(circle, rgba(139,92,246,0.15), rgba(255,107,53,0.08));
  animation: viewer3d-pulse 1.8s ease-in-out infinite;
}
@keyframes viewer3d-spin {
  to { transform: rotate(360deg); }
}
@keyframes viewer3d-pulse {
  0%, 100% { transform: scale(0.85); opacity: 0.5; }
  50%       { transform: scale(1.1);  opacity: 1;   }
}
.viewer3d-spin-dots {
  display: flex;
  gap: 7px;
  align-items: center;
}
.viewer3d-spin-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b35, #8b5cf6);
  animation: viewer3d-dotpop 1.2s ease-in-out infinite;
}
.viewer3d-spin-dots span:nth-child(2) { animation-delay: 0.2s; }
.viewer3d-spin-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes viewer3d-dotpop {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1.2); opacity: 1;   }
}
.viewer3d-spin-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  background: linear-gradient(90deg, #ff6b35, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
#viewer3d-error {
  display: none;
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.9);
  align-items: center;
  justify-content: center;
  color: #ef4444;
  font-size: 14px;
  text-align: center;
  padding: 24px;
  z-index: 11;
}
#viewer3d-error.active {
  display: flex;
}
#viewer3d-scene-strip {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  padding: 10px 10px 12px;
  display: flex;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
  gap: 0;
}
.viewer3d-scene-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.viewer3d-scene-group-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1e3a5f;
  text-align: center;
}
.viewer3d-scene-group-label.orange {
  color: #fb923c;
}
.viewer3d-scene-thumbs-row {
  display: flex;
  width: 100%;
  gap: 6px;
  align-items: flex-start;
}
.viewer3d-scene-divider {
  width: 1px;
  background: #e2e8f0;
  margin: 0 10px;
  align-self: stretch;
}
.viewer3d-scene-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
  outline: none;
  flex: 1;
  min-width: 0;
}
.viewer3d-scene-thumb {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 9px;
  border: 2.5px solid transparent;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: block;
}
.viewer3d-scene-btn.active .viewer3d-scene-thumb {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139,92,246,0.2);
}
.viewer3d-scene-btn:hover .viewer3d-scene-thumb {
  border-color: #c4b5fd;
}
.viewer3d-scene-btn.orange.active .viewer3d-scene-thumb {
  border-color: #ff6b35;
  box-shadow: 0 0 0 2px rgba(255,107,53,0.2);
}
.viewer3d-scene-btn.orange:hover .viewer3d-scene-thumb {
  border-color: #fdba8c;
}
.viewer3d-scene-lbl {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-align: center;
}
.viewer3d-scene-btn.active .viewer3d-scene-lbl {
  color: #8b5cf6;
  font-weight: 600;
}
.viewer3d-scene-btn.orange.active .viewer3d-scene-lbl {
  color: #ff6b35;
  font-weight: 600;
}
`;

class DarkVGGTViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.manifest = null;
    this.currentPreset = 0;
    this.currentModel = 'Dark-VGGT';
    this.thermalMode = false;
    this.thermalBuffer = null;
    this.rgbBuffer = null;
    this.pointCloud = null;
    this.renderer = null;
    this.threeScene = null;
    this.camera = null;
    this.controls = null;
    this.pointSize = 0.012;
  }

  async init() {
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    let manifest;
    try {
      const res = await fetch(BASE_URL + 'manifest.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      manifest = await res.json();
    } catch (e) {
      this.container.innerHTML = '<div style="padding:24px;color:#ef4444;text-align:center;">Failed to load manifest: ' + e.message + '</div>';
      return;
    }
    this.manifest = manifest;
    this._buildUI();
    this._initThree();
    await this._loadCurrentPreset();
  }

  _buildUI() {
    const canvasWrap = document.createElement('div');
    canvasWrap.id = 'viewer3d-canvas-wrap';

    const overlay = document.createElement('div');
    overlay.id = 'viewer3d-overlay';


    const modelDropdown = document.createElement('div');
    modelDropdown.id = 'viewer3d-model-dropdown';

    const trigger = document.createElement('div');
    trigger.id = 'viewer3d-model-trigger';
    trigger.innerHTML = `<span id="viewer3d-model-label">${this.currentModel}</span><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const menu = document.createElement('div');
    menu.id = 'viewer3d-model-menu';

    ['Dark-VGGT', 'VGGT base'].forEach(m => {
      const item = document.createElement('div');
      item.className = 'viewer3d-menu-item' + (m === this.currentModel ? ' selected' : '');
      item.textContent = m;
      item.addEventListener('click', async () => {
        this.currentModel = m;
        this.thermalMode = false;
        document.getElementById('viewer3d-model-label').textContent = m;
        menu.querySelectorAll('.viewer3d-menu-item').forEach(el => {
          el.classList.toggle('selected', el.textContent === m);
        });
        trigger.classList.remove('open');
        menu.classList.remove('open');
        this._updateThermalGroup();
        await this._loadCurrentPreset();
      });
      menu.appendChild(item);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      trigger.classList.toggle('open');
      menu.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      trigger.classList.remove('open');
      menu.classList.remove('open');
    });

    modelDropdown.appendChild(trigger);
    modelDropdown.appendChild(menu);

    const thermalGroup = document.createElement('div');
    thermalGroup.id = 'viewer3d-thermal-group';

    const rgbLabel = document.createElement('label');
    rgbLabel.className = 'viewer3d-radio-label';
    const rgbRadio = document.createElement('input');
    rgbRadio.type = 'radio';
    rgbRadio.name = 'colormode';
    rgbRadio.value = 'rgb';
    rgbRadio.checked = true;
    rgbRadio.addEventListener('change', () => {
      if (this.thermalMode) this._applyRGB();
    });
    rgbLabel.appendChild(rgbRadio);
    rgbLabel.appendChild(document.createTextNode('RGB'));

    const thermalLabel = document.createElement('label');
    thermalLabel.className = 'viewer3d-radio-label';
    const thermalRadio = document.createElement('input');
    thermalRadio.type = 'radio';
    thermalRadio.name = 'colormode';
    thermalRadio.value = 'thermal';
    thermalRadio.className = 'thermal-radio';
    thermalRadio.addEventListener('change', () => {
      if (!this.thermalMode) this._applyThermal();
    });
    thermalLabel.appendChild(thermalRadio);
    thermalLabel.appendChild(document.createTextNode('Thermal'));

    thermalGroup.appendChild(rgbLabel);
    thermalGroup.appendChild(thermalLabel);

    overlay.appendChild(modelDropdown);
    overlay.appendChild(thermalGroup);

    const spinner = document.createElement('div');
    spinner.id = 'viewer3d-spinner';
    spinner.innerHTML = '<div class="viewer3d-spin-orb"></div><div class="viewer3d-spin-dots"><span></span><span></span><span></span></div><div class="viewer3d-spin-label">Loading point cloud</div>';

    const errDiv = document.createElement('div');
    errDiv.id = 'viewer3d-error';

    canvasWrap.appendChild(overlay);
    canvasWrap.appendChild(spinner);
    canvasWrap.appendChild(errDiv);

    const sceneStrip = document.createElement('div');
    sceneStrip.id = 'viewer3d-scene-strip';

    const makeBtn = (preset, i) => {
      const isOrange = preset.sceneKey === 'eth3d:welllit' || preset.sceneKey === 'scannetpp:welllit';
      const btn = document.createElement('button');
      btn.className = 'viewer3d-scene-btn' + (isOrange ? ' orange' : '') + (i === 0 ? ' active' : '');
      btn.dataset.idx = i;
      const sceneEntry = this._getSceneEntry(preset.sceneKey);
      const thumbUrl = sceneEntry ? BASE_URL + sceneEntry.dir + '/' + preset.thumbFile : '';
      const img = document.createElement('img');
      img.className = 'viewer3d-scene-thumb';
      img.src = thumbUrl;
      img.alt = preset.label;
      img.loading = 'lazy';
      const lbl = document.createElement('span');
      lbl.className = 'viewer3d-scene-lbl';
      lbl.textContent = preset.label;
      btn.appendChild(img);
      btn.appendChild(lbl);
      btn.addEventListener('click', async () => {
        if (this.currentPreset === i) return;
        this.currentPreset = i;
        this.thermalMode = false;
        document.querySelectorAll('.viewer3d-scene-btn').forEach((b, j) => {
          b.classList.toggle('active', j === i);
        });
        this._updateThermalGroup();
        await this._loadCurrentPreset();
      });
      return btn;
    };

    // Darkness group (indices 0-3)
    const darkGroup = document.createElement('div');
    darkGroup.className = 'viewer3d-scene-group';
    darkGroup.style.flex = '4';
    const darkLabel = document.createElement('div');
    darkLabel.className = 'viewer3d-scene-group-label';
    darkLabel.textContent = 'Darkness Scene';
    const darkRow = document.createElement('div');
    darkRow.className = 'viewer3d-scene-thumbs-row';
    PRESET_SCENES.slice(0, 4).forEach((p, i) => darkRow.appendChild(makeBtn(p, i)));
    darkGroup.appendChild(darkLabel);
    darkGroup.appendChild(darkRow);

    // Divider
    const divider = document.createElement('div');
    divider.className = 'viewer3d-scene-divider';

    // Well-lit group (indices 4-5)
    const litGroup = document.createElement('div');
    litGroup.className = 'viewer3d-scene-group';
    litGroup.style.flex = '2';
    const litLabel = document.createElement('div');
    litLabel.className = 'viewer3d-scene-group-label orange';
    litLabel.textContent = 'Well-lit Scene';
    const litRow = document.createElement('div');
    litRow.className = 'viewer3d-scene-thumbs-row';
    PRESET_SCENES.slice(4).forEach((p, i) => litRow.appendChild(makeBtn(p, i + 4)));
    litGroup.appendChild(litLabel);
    litGroup.appendChild(litRow);

    sceneStrip.appendChild(darkGroup);
    sceneStrip.appendChild(divider);
    sceneStrip.appendChild(litGroup);

    this.container.appendChild(canvasWrap);
    this.container.appendChild(sceneStrip);

    this._updateThermalGroup();
  }

  _getSceneEntry(sceneKey) {
    return this.manifest.scenes.find(s => s.scene === sceneKey) || null;
  }

  _updateThermalGroup() {
    const group = document.getElementById('viewer3d-thermal-group');
    if (!group) return;

    const preset = PRESET_SCENES[this.currentPreset];
    const sceneEntry = this._getSceneEntry(preset.sceneKey);
    const chunk = sceneEntry ? sceneEntry.chunks[preset.chunkArrayIdx] : null;
    const plyMeta = chunk ? chunk.ply['Dark-VGGT'] : null;
    const hasThermal = plyMeta && plyMeta.thermal_bin;

    const show = this.currentModel === 'Dark-VGGT' && hasThermal;
    group.style.display = show ? 'flex' : 'none';
    if (!show) return;
    const radios = group.querySelectorAll('input[type=radio]');
    radios[0].checked = !this.thermalMode;
    radios[1].checked = this.thermalMode;
  }

  _initThree() {
    const wrap = document.getElementById('viewer3d-canvas-wrap');
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    wrap.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    this.threeScene = scene;

    const camera = new THREE.PerspectiveCamera(60, wrap.clientWidth / wrap.clientHeight, 0.01, 1000);
    camera.position.set(0, 0, 3);
    this.camera = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    this.controls = controls;

    new ResizeObserver(() => {
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
    }).observe(wrap);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  }

  async _loadCurrentPreset() {
    const preset = PRESET_SCENES[this.currentPreset];
    const sceneEntry = this._getSceneEntry(preset.sceneKey);
    if (!sceneEntry) return;

    const chunk = sceneEntry.chunks[preset.chunkArrayIdx];
    if (!chunk) return;

    const plyMeta = chunk.ply[this.currentModel];
    if (!plyMeta) return;

    const plyUrl = BASE_URL + sceneEntry.dir + '/' + plyMeta.ply;
    const chunkFolder = 'chunk_' + String(chunk.chunk_id).padStart(3, '0');
    const posesUrl = BASE_URL + sceneEntry.dir + '/' + chunkFolder + '/poses.json';

    this._showSpinner(true);
    this._showError(null);
    this._clearCloud();
    this.thermalBuffer = null;
    this.rgbBuffer = null;

    try {
      const [, posesData] = await Promise.all([
        this._loadPLY(plyUrl),
        fetch(posesUrl).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (posesData) this._setCameraFromPose(posesData);

      if (this.currentModel === 'Dark-VGGT' && plyMeta.thermal_bin) {
        const thermalUrl = BASE_URL + sceneEntry.dir + '/' + plyMeta.thermal_bin;
        const res = await fetch(thermalUrl);
        if (res.ok) {
          this.thermalBuffer = new Uint8Array(await res.arrayBuffer());
        }
      }
      this._updateThermalGroup();
    } catch (e) {
      this._showError('Failed to load: ' + e.message);
    } finally {
      this._showSpinner(false);
    }
  }

  async _loadPLY(url) {
    return new Promise((resolve, reject) => {
      new PLYLoader().load(url, (geometry) => {
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        const bboxSize = new THREE.Vector3();
        geometry.boundingBox.getSize(bboxSize);
        geometry.translate(-center.x, -center.y, -center.z);
        this.plyCenter = center.clone();
        this.plyBboxSize = bboxSize.clone();

        const colorAttr = geometry.attributes.color;
        if (colorAttr) this.rgbBuffer = colorAttr.array.slice();

        const material = new THREE.PointsMaterial({
          size: this.pointSize,
          vertexColors: true,
          sizeAttenuation: true,
        });
        const points = new THREE.Points(geometry, material);

        const preset = PRESET_SCENES[this.currentPreset];
        const cc = preset.coordConv;
        if (cc === 'zup' || cc === 'yflip' || cc === 'yflip_xrot') {
          const group = new THREE.Group();
          if (cc === 'zup') group.rotation.x = -Math.PI / 2;
          if (cc === 'yflip') group.scale.set(1, -1, 1);
          if (cc === 'yflip_xrot') {
            group.scale.set(1, -1, 1);
            group.rotation.x = -Math.PI / 2;
          }
          group.add(points);
          this.threeScene.add(group);
          this.pointCloud = group;
        } else {
          this.threeScene.add(points);
          this.pointCloud = points;
        }

        resolve();
      }, undefined, reject);
    });
  }

  _setCameraFromPose(posesData) {
    const c2wList = posesData.pred_c2w || posesData.gt_c2w;
    if (!c2wList || c2wList.length === 0) return;

    const preset = PRESET_SCENES[this.currentPreset];
    const upVec = preset.upVec ?? [0, 1, 0];

    if (preset.initFromBbox && this.plyBboxSize) {
      const s = this.plyBboxSize;
      const maxDim = Math.max(s.x, s.y, s.z);
      const f = preset.bboxFactor ?? [2.0, 0.5, 0.5];
      const pos = new THREE.Vector3(maxDim * f[0], maxDim * f[1], maxDim * f[2]);
      this.camera.matrixAutoUpdate = true;
      this.camera.position.copy(pos);
      this.camera.up.set(upVec[0], upVec[1], upVec[2]);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      return;
    }

    const cx = this.plyCenter ? this.plyCenter.x : 0;
    const cy = this.plyCenter ? this.plyCenter.y : 0;
    const cz = this.plyCenter ? this.plyCenter.z : 0;

    let pos;

    if (preset.useFirstFrame) {
      const c2w = c2wList[0];
      const pullBack = preset.pullBack ?? 3.0;
      const heightLift = preset.heightLift ?? 1.0;
      const isZup = preset.coordConv === 'zup';

      // Camera position (centered, raw coords)
      let camX = c2w[0][3] - cx;
      let camY = c2w[1][3] - cy;
      let camZ = c2w[2][3] - cz;

      // Forward direction in raw coords (OpenCV: third column of rotation)
      let fwdX = c2w[0][2];
      let fwdY = c2w[1][2];
      let fwdZ = c2w[2][2];
      const fwdLen = Math.sqrt(fwdX*fwdX + fwdY*fwdY + fwdZ*fwdZ);
      fwdX /= fwdLen; fwdY /= fwdLen; fwdZ /= fwdLen;

      // Pull back along -forward
      camX -= fwdX * pullBack;
      camY -= fwdY * pullBack;
      camZ -= fwdZ * pullBack;

      if (isZup) {
        // z-up raw → y-up Three.js: (x, y, z) → (x, z, -y)
        camZ += heightLift;
        pos = new THREE.Vector3(camX, camZ, -camY);
      } else {
        // y-down raw → yflip Three.js: (x, y, z) → (x, -y, z)
        // lift in -y raw = +y scene
        camY -= heightLift;
        pos = new THREE.Vector3(camX, -camY, camZ);
      }

    } else {
      const pullBack = preset.pullBack ?? 2.5;
      const heightFactor = preset.heightFactor ?? 0.5;

      let ax = 0, ay = 0, az = 0;
      for (const c2w of c2wList) {
        ax += c2w[0][3] - cx;
        ay += c2w[1][3] - cy;
        az += c2w[2][3] - cz;
      }
      ax /= c2wList.length;
      ay /= c2wList.length;
      az /= c2wList.length;

      // Compute in raw coords, lift in physical up direction (y-down: subtract y)
      const rawPos = new THREE.Vector3(ax, ay, az).multiplyScalar(pullBack);
      rawPos.y -= rawPos.length() * heightFactor;

      // Convert to scene space
      if (preset.coordConv === 'yflip') {
        pos = new THREE.Vector3(rawPos.x, -rawPos.y, rawPos.z);
      } else {
        pos = rawPos;
      }
    }

    this.camera.matrixAutoUpdate = true;
    this.camera.position.copy(pos);
    this.camera.up.set(upVec[0], upVec[1], upVec[2]);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  _clearCloud() {
    if (this.pointCloud) {
      this.threeScene.remove(this.pointCloud);
      this.pointCloud.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.pointCloud = null;
    }
  }

  _getPointsGeometry() {
    if (!this.pointCloud) return null;
    if (this.pointCloud.geometry) return this.pointCloud.geometry;
    let geo = null;
    this.pointCloud.traverse(obj => { if (obj.geometry && !geo) geo = obj.geometry; });
    return geo;
  }

  _applyThermal() {
    if (!this.pointCloud || !this.thermalBuffer) return;
    const geo = this._getPointsGeometry();
    if (!geo) return;
    const colorAttr = geo.attributes.color;
    const n = colorAttr.array.length;
    for (let i = 0; i < n; i++) colorAttr.array[i] = this.thermalBuffer[i] / 255;
    colorAttr.needsUpdate = true;
    this.thermalMode = true;
  }

  _applyRGB() {
    if (!this.pointCloud || !this.rgbBuffer) return;
    const geo = this._getPointsGeometry();
    if (!geo) return;
    const colorAttr = geo.attributes.color;
    const n = colorAttr.array.length;
    for (let i = 0; i < n; i++) colorAttr.array[i] = this.rgbBuffer[i];
    colorAttr.needsUpdate = true;
    this.thermalMode = false;
  }

  _showSpinner(on) {
    const el = document.getElementById('viewer3d-spinner');
    if (el) el.classList.toggle('active', on);
  }

  _showError(msg) {
    const el = document.getElementById('viewer3d-error');
    if (!el) return;
    if (msg) { el.textContent = msg; el.classList.add('active'); }
    else el.classList.remove('active');
  }
}

new DarkVGGTViewer('viewer3d-root').init();
