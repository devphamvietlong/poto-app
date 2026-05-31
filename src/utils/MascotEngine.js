/**
 * MascotEngine - A modular, high-fidelity SVG Mascot Animation Engine
 * Framework-agnostic, responsive, and handles JSON animation profiles.
 * Refactored to dynamically load individual parts from parts_svg/.
 */
export class MascotEngine {
  constructor(containerElement, metaData, options = {}) {
    if (!containerElement) {
      throw new Error("MascotEngine: Container element is required.");
    }
    if (!metaData) {
      throw new Error("MascotEngine: Metadata configuration is required.");
    }

    this.container = containerElement;
    this.meta = metaData;
    
    // Configurable options
    this.options = {
      enableIdle: true,
      enableBlink: true,
      enableLookAt: true,
      lookAtDamping: 0.1, // Smooth lag factor (0.1 = smooth gliding, 1.0 = instant)
      lookAtScale: 1.0,   // scale multiplier for head movement range
      blinkIntervalRange: [2000, 6000], // random blink frequency (ms)
      blinkDuration: 120, // blink duration (ms)
      transitionDuration: 300, // animation blending transition time (ms)
      particlesContainer: null, // Selector or element for particles
      ...options
    };

    this.parts = {};
    this.baseTransforms = {};
    this.animationStates = {}; // active target animation states
    this.idleTime = 0;
    this.isPlaying = false;
    this.currentAnimation = null;
    this.animationStartTime = 0;
    this.animationResolve = null;
    
    // Look-at (Mouse tracking) coordinates
    this.mouseTarget = { x: 0, y: 0 }; // Target looking ratios (-1 to 1)
    this.mouseCurrent = { x: 0, y: 0 }; // Smoothed looking ratios
    this.isMouseActive = false;

    // Blinking state
    this.isBlinking = false;
    this.blinkScaleY = 1.0;
    this.nextBlinkTime = 0;
    this.currentEmote = "normal";
    this.previousEmote = "normal";

    this.isStudioMode = false;

    // Animation transition blending properties
    this.transitionDuration = this.options.transitionDuration;
    this.isTransitioning = false;
    this.isTransitioningToNeutral = false;
    this.transitionStartTime = 0;
    this.transitionSourceStates = {};

    // Particles system state
    this.particleLastSpawnTime = {};
    this.particlesContainer = null;

    const pc = this.options.particlesContainer;
    if (pc) {
      if (typeof pc === "string") {
        this.particlesContainer = document.querySelector(pc);
      } else {
        this.particlesContainer = pc;
      }
    } else {
      this.particlesContainer = document.querySelector("#particles-container") || document.querySelector(".particles-container");
    }

    // Exposed promise for async loading and assembly
    this.ready = this.loadAndAssemble();
  }

  async loadAndAssemble() {
    // 1. Create the master SVG container
    const masterSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    masterSvg.setAttribute("viewBox", this.meta.viewBox || "0 0 210 297");
    masterSvg.setAttribute("width", "100%");
    masterSvg.setAttribute("height", "100%");
    this.svg = masterSvg;

    // Create defs element for holding gradients
    const masterDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    masterSvg.appendChild(masterDefs);

    // Create the layer2 container group
    const layer2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    layer2.setAttribute("id", "layer2");
    masterSvg.appendChild(layer2);

    // 2. Fetch and parse each individual SVG part
    const loadedSVGs = {};
    const promises = [];

    // Distinct SVG files to fetch
    const uniqueFiles = new Set();
    for (const partConfig of Object.values(this.meta.parts)) {
      if (partConfig.file) {
        uniqueFiles.add(partConfig.file);
      }
    }

    for (const file of uniqueFiles) {
      if (this.options.preloadedSVGs && this.options.preloadedSVGs[file]) {
        const svgContent = this.options.preloadedSVGs[file];
        if (typeof svgContent === "string") {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgContent, "image/svg+xml");
          loadedSVGs[file] = doc.documentElement;
        } else {
          loadedSVGs[file] = svgContent;
        }
        continue;
      }

      let path = file;
      if (!path.startsWith("./") && !path.startsWith("/") && !path.startsWith("http://") && !path.startsWith("https://")) {
        if (path.startsWith("parts/") || path.startsWith("parts_svg/")) {
          path = `core/${path}`;
        } else {
          path = `core/parts/${path}`;
        }
      }
      
      const isRaster = path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".webp") || path.endsWith(".gif");
      if (isRaster) {
        // Skip text-fetching for raster images
        continue;
      }

      promises.push(
        fetch(path)
          .then(r => r.text())
          .then(text => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "image/svg+xml");
            loadedSVGs[file] = doc.documentElement;
          })
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    // Extract gradients from all parsed SVGs defs and insert into master defs
    for (const svgNode of Object.values(loadedSVGs)) {
      const defs = svgNode.querySelector("defs");
      if (defs) {
        Array.from(defs.children).forEach(child => {
          masterDefs.appendChild(child.cloneNode(true));
        });
      }
    }

    // 3. Assemble parts in correct drawing/layer order!
    const layerOrder = [
      "right_leg", "left_leg", "right_arm", "left_arm", "torso",
      "torso_detail", "bamboo", "head", "face", "hat", "emote"
    ];

    // Static lookup mapping for original uncropped base transforms from mascot.svg
    const originalBaseTransforms = {
      "torso": "",
      "torso_detail": "",
      "left_leg": "",
      "right_leg": "matrix(-1,0,0,1,222.95995,-0.76843466)",
      "left_arm": "translate(-0.38421733,0.38421733)",
      "right_arm": "rotate(169.89795,107.75608,179.41957)",
      "bamboo": "",
      "head": "",
      "face": "",
      "hat": "translate(0.81504805,-0.27168268)",
      "emote": ""
    };

    for (const partName of layerOrder) {
      const partConfig = this.meta.parts[partName];
      if (!partConfig || !partConfig.file) continue;

      const file = partConfig.file;
      let path = file;
      if (!path.startsWith("./") && !path.startsWith("/") && !path.startsWith("http://") && !path.startsWith("https://")) {
        if (path.startsWith("parts/") || path.startsWith("parts_svg/")) {
          path = `core/${path}`;
        } else {
          path = `core/parts/${path}`;
        }
      }

      const isRaster = path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".webp") || path.endsWith(".gif");
      
      let elementClone = null;
      let layer2Transform = null;
      let isStandalone = false;

      if (isRaster) {
        // Create an SVG <image> tag
        elementClone = document.createElementNS("http://www.w3.org/2000/svg", "image");
        elementClone.setAttribute("href", path);
        
        // Size bounds: check metadata parameters, or estimate from local pivot offset
        const rPivot = partConfig.pivot || [0, 0];
        const w = partConfig.width || (Math.abs(rPivot[0]) * 2) || 100;
        const h = partConfig.height || (Math.abs(rPivot[1]) * 2) || 100;
        elementClone.setAttribute("width", w);
        elementClone.setAttribute("height", h);
        isStandalone = true;
      } else {
        const fileSvg = loadedSVGs[file];
        if (!fileSvg) continue;

        if (partConfig.selector) {
          // Absolute Coordinate Selector Mode (Legacy / Calibrated)
          const element = fileSvg.querySelector(partConfig.selector);
          if (element) {
            elementClone = element.cloneNode(true);
            const sourceLayer2 = fileSvg.querySelector("#layer2");
            layer2Transform = sourceLayer2 ? sourceLayer2.getAttribute("transform") : null;
          }
        } else {
          // PNG-like Standalone SVG Mode (Self-contained ViewBox)
          elementClone = fileSvg.cloneNode(true);
          elementClone.removeAttribute("x");
          elementClone.removeAttribute("y");
          
          const viewBoxAttr = fileSvg.getAttribute("viewBox");
          if (viewBoxAttr) {
            const vb = viewBoxAttr.split(/\s+/).map(Number);
            if (vb.length === 4) {
              elementClone.setAttribute("width", partConfig.width || vb[2]);
              elementClone.setAttribute("height", partConfig.height || vb[3]);
            }
          } else {
            elementClone.setAttribute("width", partConfig.width || 100);
            elementClone.setAttribute("height", partConfig.height || 100);
          }
          isStandalone = true;
        }
      }

      if (elementClone) {
        // Retrieve and apply the original base transform to the innermost element clone (uncropped)
        // Decoupling base transforms from parent groups keeps visual parts stable when moving joints!
        const baseTrans = originalBaseTransforms[partName] || "";
        if (baseTrans) {
          elementClone.setAttribute("transform", baseTrans);
        } else if (!isStandalone) {
          elementClone.removeAttribute("transform");
        }
        
        this.parts[partName] = elementClone;
        
        // Pivot/Pose assembly groups
        // Wrapper container group (positioned at global pivot coordinate)
        const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
        wrapper.setAttribute("id", `${partName}-container`);
        wrapper.setAttribute("data-part", partName);
        
        // Dynamic anim translation/rotation group
        const animGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        animGroup.setAttribute("id", `${partName}-anim`);
        
        // Local shift group translated by the local pivot negated to cancel offsets
        const shiftGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        shiftGroup.setAttribute("id", `${partName}-shift`);

        // Get global pos and relative pivot from config
        const gPos = partConfig.global_position || [0, 0];
        const rPivot = partConfig.pivot || [0, 0];

        // Apply wrapper base positioning
        if (isStandalone) {
          // PNG-like standalone mode: global_position is the joint center directly
          wrapper.setAttribute("transform", `translate(${gPos[0]}, ${gPos[1]})`);
        } else {
          // Legacy mode: global_position + pivot is the joint coordinate
          wrapper.setAttribute("transform", `translate(${gPos[0] + rPivot[0]}, ${gPos[1] + rPivot[1]})`);
        }
        
        // Shift content so that relative pivot is at (0, 0)
        const flip = partConfig.flip || "";
        const flipX = flip === "horizontal" || flip === "x" || partConfig.flipX === true;
        const flipY = flip === "vertical" || flip === "y" || partConfig.flipY === true;
        const baseRotate = partConfig.base_rotate || partConfig.base_rotation || 0;
        
        let shiftStr = `translate(${-rPivot[0]}, ${-rPivot[1]})`;
        if (flipX || flipY) {
          shiftStr = `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1}) ` + shiftStr;
        }
        if (baseRotate) {
          shiftStr = `rotate(${baseRotate}) ` + shiftStr;
        }
        shiftGroup.setAttribute("transform", shiftStr);

        // Wrap elementClone in a crop translation cancel group
        const cropCancelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        if (layer2Transform) {
          cropCancelGroup.setAttribute("transform", layer2Transform);
        }
        cropCancelGroup.appendChild(elementClone);

        // Assemble hierarchy
        shiftGroup.appendChild(cropCancelGroup);
        animGroup.appendChild(shiftGroup);
        wrapper.appendChild(animGroup);
        layer2.appendChild(wrapper);

        // Record wrapper and animation elements for MascotEngine transforms
        this.parts[partName] = animGroup; // The animated element is the animGroup!
        this.baseTransforms[partName] = ""; 
        this.animationStates[partName] = {
          x: 0, y: 0, rotate: 0, scaleX: 1.0, scaleY: 1.0, skewX: 0, skewY: 0
        };
      }
    }

    // Add root mapping
    this.parts["mascot_root"] = layer2;
    this.baseTransforms["mascot_root"] = "";
    this.animationStates["mascot_root"] = {
      x: 0, y: 0, rotate: 0, scaleX: 1.0, scaleY: 1.0, skewX: 0, skewY: 0
    };

    // 4. Inject master SVG into the DOM container
    this.container.innerHTML = "";
    this.container.appendChild(masterSvg);

    // 5. Compose Head and Torso composites
    this.composeHead();
    this.composeTorso();

    // 6. Cache eye & mouth elements for expressions
    this.cacheEyesAndMouth();

    // 7. Initialize and start the engine's animation tick loop
    this.lastFrameTime = performance.now();
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);

    return this;
  }

  composeHead() {
    const headPartNames = ["head", "face", "hat", "emote"];
    const headElements = headPartNames
      .map(name => this.svg.querySelector(`#${name}-container`))
      .filter(Boolean);

    if (headElements.length > 0) {
      const firstElement = headElements[0];
      const parent = firstElement.parentNode;

      // Composite group at neck pivot (105, 150)
      const compositeContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      compositeContainer.setAttribute("id", "head-composite-container");
      compositeContainer.setAttribute("transform", "translate(105, 150)");

      const compositeAnim = document.createElementNS("http://www.w3.org/2000/svg", "g");
      compositeAnim.setAttribute("id", "head-composite-anim");

      const compositeShift = document.createElementNS("http://www.w3.org/2000/svg", "g");
      compositeShift.setAttribute("id", "head-composite-shift");
      compositeShift.setAttribute("transform", "translate(-105, -150)");

      parent.insertBefore(compositeContainer, firstElement);
      compositeContainer.appendChild(compositeAnim);
      compositeAnim.appendChild(compositeShift);

      headElements.forEach(elem => {
        compositeShift.appendChild(elem);
      });

      // Direct head selector to the anim group
      this.parts["head"] = compositeAnim;
      this.baseTransforms["head"] = "";
      this.animationStates["head"] = {
        x: 0, y: 0, rotate: 0, scaleX: 1.0, scaleY: 1.0, skewX: 0, skewY: 0
      };
    }
  }

  composeTorso() {
    const torso = this.svg.querySelector("#torso-container");
    const detail = this.svg.querySelector("#torso_detail-container");

    if (torso && detail) {
      const parent = torso.parentNode;

      // Composite group at torso pivot (105, 240)
      const compositeContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      compositeContainer.setAttribute("id", "torso-composite-container");
      compositeContainer.setAttribute("transform", "translate(105, 240)");

      const compositeAnim = document.createElementNS("http://www.w3.org/2000/svg", "g");
      compositeAnim.setAttribute("id", "torso-composite-anim");

      const compositeShift = document.createElementNS("http://www.w3.org/2000/svg", "g");
      compositeShift.setAttribute("id", "torso-composite-shift");
      compositeShift.setAttribute("transform", "translate(-105, -240)");

      parent.insertBefore(compositeContainer, torso);
      compositeContainer.appendChild(compositeAnim);
      compositeAnim.appendChild(compositeShift);

      compositeShift.appendChild(torso);
      compositeShift.appendChild(detail);

      this.parts["torso"] = compositeAnim;
      this.baseTransforms["torso"] = "";
      this.animationStates["torso"] = {
        x: 0, y: 0, rotate: 0, scaleX: 1.0, scaleY: 1.0, skewX: 0, skewY: 0
      };
    }
  }

  cacheEyesAndMouth() {
    this.leftEye = this.svg.querySelector('#ellipse47');
    this.rightEye = this.svg.querySelector('#path47');
    if (this.leftEye && this.rightEye) {
      try {
        const lBox = this.leftEye.getBBox();
        const rBox = this.rightEye.getBBox();
        this.leftEyePivot = [lBox.x + lBox.width / 2, lBox.y + lBox.height / 2];
        this.rightEyePivot = [rBox.x + rBox.width / 2, rBox.y + rBox.height / 2];
        this.baseEyeTransforms = {
          left: this.leftEye.getAttribute("transform") || "",
          right: this.rightEye.getAttribute("transform") || ""
        };
      } catch (e) {
        // Fallback relative to face
        this.leftEyePivot = [105, 142];
        this.rightEyePivot = [105, 142];
        this.baseEyeTransforms = { left: "", right: "" };
      }
    }

    this.mouth = this.svg.querySelector("#path49");
    if (this.mouth) {
      this.originalMouthD = this.mouth.getAttribute("d") || "";
      // Extract original fill color from style or attribute
      const styleAttr = this.mouth.getAttribute("style") || "";
      const fillMatch = styleAttr.match(/fill:\s*(#[0-9a-fA-F]+|[a-zA-Z]+|\([0-9,\s]+\))/);
      this.mouthColor = fillMatch ? fillMatch[1] : (this.mouth.getAttribute("fill") || "#114908");
    } else {
      this.mouthColor = "#114908";
    }

    // Cache eyebrows
    this.leftEyebrow = this.svg.querySelector('#left_eyebrow');
    this.rightEyebrow = this.svg.querySelector('#right_eyebrow');
    this.originalLeftEyebrowD = this.leftEyebrow ? this.leftEyebrow.getAttribute("d") || "" : "";
    this.originalRightEyebrowD = this.rightEyebrow ? this.rightEyebrow.getAttribute("d") || "" : "";

    // Dynamic dizzy spirals and sad tears
    this.emoteGroup = this.svg.querySelector("#g49");
    if (this.emoteGroup) {
      const spiralD = "M0,0 C1.5,1.5 3,0 3,-2 C3,-4.5 -0.7,-4.5 -2,-3.3 C-4,-1.3 -3.3,2 0,2.7 C3.3,3.3 6,0.7 5.3,-2.7 C4.7,-6 0,-6.7 -3.3,-4.7 C-6.7,-2.7 -6,2.7 0,4 C6.7,5.3 10,1.3 9,-4 C8,-9.3 0,-10 -5,-7.3";
      
      this.leftSpiral = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.leftSpiral.setAttribute("id", "left-spiral-eye");
      this.leftSpiral.setAttribute("d", spiralD);
      this.leftSpiral.setAttribute("stroke", this.mouthColor);
      this.leftSpiral.setAttribute("stroke-width", "1.2");
      this.leftSpiral.setAttribute("fill", "none");
      this.leftSpiral.setAttribute("stroke-linecap", "round");
      this.leftSpiral.setAttribute("style", "display: none;");

      this.rightSpiral = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.rightSpiral.setAttribute("id", "right-spiral-eye");
      this.rightSpiral.setAttribute("d", spiralD);
      this.rightSpiral.setAttribute("stroke", this.mouthColor);
      this.rightSpiral.setAttribute("stroke-width", "1.2");
      this.rightSpiral.setAttribute("fill", "none");
      this.rightSpiral.setAttribute("stroke-linecap", "round");
      this.rightSpiral.setAttribute("style", "display: none;");

      const tearD = "M 0,0 C -2,3 -2,5 0,5 C 2,5 2,3 0,0 Z";
      
      this.leftTear = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.leftTear.setAttribute("id", "left-sad-tear");
      this.leftTear.setAttribute("d", tearD);
      this.leftTear.setAttribute("fill", "#60a5fa");
      this.leftTear.setAttribute("style", "display: none;");

      this.rightTear = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.rightTear.setAttribute("id", "right-sad-tear");
      this.rightTear.setAttribute("d", tearD);
      this.rightTear.setAttribute("fill", "#60a5fa");
      this.rightTear.setAttribute("style", "display: none;");

      this.emoteGroup.appendChild(this.leftSpiral);
      this.emoteGroup.appendChild(this.rightSpiral);
      this.emoteGroup.appendChild(this.leftTear);
      this.emoteGroup.appendChild(this.rightTear);
    }
  }

  scheduleNextBlink() {
    const [min, max] = this.options.blinkIntervalRange;
    const delay = min + Math.random() * (max - min);
    this.nextBlinkTime = performance.now() + delay;
  }

  setMousePosition(clientX, clientY) {
    if (!this.options.enableLookAt) return;
    
    // Get SVG layout boundaries
    const rect = this.svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3; // Neck level focus
    
    // Calculate angle and distance ratio (-1 to 1)
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxDist = Math.max(rect.width, rect.height) * 0.8;
    
    this.mouseTarget.x = Math.max(-1.0, Math.min(1.0, dx / maxDist));
    this.mouseTarget.y = Math.max(-1.0, Math.min(1.0, dy / maxDist));
    this.isMouseActive = true;
  }

  clearMousePosition() {
    this.mouseTarget.x = 0;
    this.mouseTarget.y = 0;
    this.isMouseActive = false;
  }

  setEmote(expression) {
    this.currentEmote = expression;
    const mouth = this.mouth;
    const leftCheek = this.svg.querySelector("#ellipse46");
    const rightCheek = this.svg.querySelector("#path46");
    
    if (!mouth) return;

    // Read declarative configuration if present
    const config = this.meta.expressions?.[expression];
    if (config) {
      // Eyebrows shape
      if (this.leftEyebrow) {
        if (config.left_eyebrow_d) {
          this.leftEyebrow.setAttribute("d", config.left_eyebrow_d);
        } else {
          this.leftEyebrow.setAttribute("d", this.originalLeftEyebrowD);
        }
      }
      if (this.rightEyebrow) {
        if (config.right_eyebrow_d) {
          this.rightEyebrow.setAttribute("d", config.right_eyebrow_d);
        } else {
          this.rightEyebrow.setAttribute("d", this.originalRightEyebrowD);
        }
      }
      // 1. Mouth shape
      if (config.mouth_d) {
        mouth.setAttribute("d", config.mouth_d);
      }

      // 2. Cheek opacities & colors
      const opacity = config.cheek_opacity !== undefined ? config.cheek_opacity : 0.5;
      const color = config.cheek_color || "#ff9ebb";
      if (opacity === 0.0) {
        leftCheek?.setAttribute("style", "opacity: 0.0;");
        rightCheek?.setAttribute("style", "opacity: 0.0;");
      } else {
        leftCheek?.setAttribute("style", `opacity: ${opacity}; fill: ${color};`);
        rightCheek?.setAttribute("style", `opacity: ${opacity}; fill: ${color};`);
      }

      // 3. Particle bursts
      if (config.particles_burst) {
        const burst = config.particles_burst;
        if (burst.type === "hearts") {
          this.triggerHeartsBurst();
        }
      }
      return;
    }

    // Fallback block to original behavior
    if (this.leftEyebrow) this.leftEyebrow.setAttribute("d", this.originalLeftEyebrowD);
    if (this.rightEyebrow) this.rightEyebrow.setAttribute("d", this.originalRightEyebrowD);

    leftCheek?.setAttribute("style", "opacity: 0.5; fill: #ff9ebb;");
    rightCheek?.setAttribute("style", "opacity: 0.5; fill: #ff9ebb;");
    
    if (expression === "happy") {
      mouth.setAttribute("d", "M 98,142 C 98,154 116,154 116,142 Z");
      leftCheek?.setAttribute("style", "opacity: 0.8; fill: #ff9ebb;");
      rightCheek?.setAttribute("style", "opacity: 0.8; fill: #ff9ebb;");
    } else if (expression === "wink") {
      mouth.setAttribute("d", "M 98,142 C 102,150 114,147 116,142 Z");
      leftCheek?.setAttribute("style", "opacity: 0.9; fill: #ff9ebb;");
      rightCheek?.setAttribute("style", "opacity: 0.9; fill: #ff9ebb;");
    } else if (expression === "dizzy") {
      mouth.setAttribute("d", "M 103,147 A 3,3 0 1,1 109,147 A 3,3 0 1,1 103,147 Z");
      leftCheek?.setAttribute("style", "opacity: 0.3; fill: #ff9ebb;");
      rightCheek?.setAttribute("style", "opacity: 0.3; fill: #ff9ebb;");
    } else if (expression === "sleepy") {
      mouth.setAttribute("d", "M 101,144 H 109");
      leftCheek?.setAttribute("style", "opacity: 0.0;");
      rightCheek?.setAttribute("style", "opacity: 0.0;");
    } else if (expression === "sad") {
      mouth.setAttribute("d", "M 98,148 C 98,140 116,140 116,148 Z");
      leftCheek?.setAttribute("style", "opacity: 0.4; fill: #ff9ebb;");
      rightCheek?.setAttribute("style", "opacity: 0.4; fill: #ff9ebb;");
    } else if (expression === "crying") {
      mouth.setAttribute("d", "M 98,148 C 98,140 116,140 116,148 C 112,153 102,153 98,148 Z");
      leftCheek?.setAttribute("style", "opacity: 0.7; fill: #ff9ebb;");
      rightCheek?.setAttribute("style", "opacity: 0.7; fill: #ff9ebb;");
    } else if (expression === "super_happy") {
      mouth.setAttribute("d", "M 95,142 C 95,158 119,158 119,142 Z");
      leftCheek?.setAttribute("style", "opacity: 0.9; fill: #ff9ebb;");
      rightCheek?.setAttribute("style", "opacity: 0.9; fill: #ff9ebb;");
    } else {
      mouth.setAttribute("d", this.originalMouthD || "m 108.32527,142.80877 c 2.54544,0.06 9.17319,-0.98455 9.98965,0.98457 0.81647,1.96911 0.5283,4.03428 -1.10462,5.45108 -1.63292,1.4168 -7.39618,2.08918 -8.59686,2.16122 -1.20068,0.072 -5.8104,-0.50642 -7.4202,-1.17666 -2.593761,-1.0799 -3.159781,-4.30386 -2.905645,-6.0034 0.384218,-2.56946 7.492235,-1.47684 10.037675,-1.41681 z");
    }
  }

  playAnimation(animationData) {
    if (this.isPlaying && this.animationResolve) {
      this.animationResolve(false);
    }

    // Capture current snapshot before playing the new animation
    this.transitionSourceStates = {};
    for (const partName of Object.keys(this.parts)) {
      this.transitionSourceStates[partName] = { ...this.animationStates[partName] };
    }
    this.isTransitioning = true;
    this.isTransitioningToNeutral = false; // abort any returning to neutral transition
    this.transitionStartTime = performance.now();

    this.isPlaying = true;
    this.currentAnimation = animationData;
    this.animationStartTime = performance.now();

    // Handle animation-level emote trigger
    this.previousEmote = this.currentEmote || "normal";
    if (animationData && animationData.emote) {
      this.setEmote(animationData.emote);
    }

    return new Promise((resolve) => {
      this.animationResolve = resolve;
    });
  }

  stopAnimation() {
    if (!this.isPlaying && !this.isTransitioningToNeutral) return;

    // Capture current pose snapshot
    this.transitionSourceStates = {};
    for (const partName of Object.keys(this.parts)) {
      this.transitionSourceStates[partName] = { ...this.animationStates[partName] };
    }
    
    this.isPlaying = false;
    this.currentAnimation = null;

    // Restore previous emote
    if (this.previousEmote) {
      this.setEmote(this.previousEmote);
      this.previousEmote = "normal";
    } else {
      this.setEmote("normal");
    }

    if (this.animationResolve) {
      this.animationResolve(true);
      this.animationResolve = null;
    }

    this.isTransitioningToNeutral = true;
    this.transitionStartTime = performance.now();
  }

  tick(now) {
    if (this.isStudioMode) {
      this.lastFrameTime = now;
      requestAnimationFrame(this.tick);
      return;
    }

    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Reset all part states to baseline before calculating the current frame offsets
    for (const partName of Object.keys(this.parts)) {
      const state = this.animationStates[partName];
      state.x = 0;
      state.y = 0;
      state.rotate = 0;
      state.scaleX = 1.0;
      state.scaleY = 1.0;
      state.skewX = 0;
      state.skewY = 0;
    }

    // 1. Process standard animations or fade back to neutral
    this.updateAnimations(now);

    // 2. Process Idle sway & breath blending (when not playing non-looping animations)
    if (this.options.enableIdle && (!this.isPlaying || this.currentAnimation.loop)) {
      this.idleTime += delta * 0.001;
      this.updateIdle(this.idleTime);
    }

    // 3. Process mouse tracking adjustments
    this.updateLookAt(delta);

    // Process expression shake/tremble wiggles
    const exprConfig = this.meta.expressions?.[this.currentEmote];
    if (exprConfig && exprConfig.shake) {
      const amt = exprConfig.shake_amount || 1.0;
      const headState = this.animationStates["head"];
      if (headState) {
        headState.x += (Math.random() - 0.5) * amt * 2.0;
        headState.y += (Math.random() - 0.5) * amt * 2.0;
        headState.rotate += (Math.random() - 0.5) * amt * 3.0;
      }
      const faceState = this.animationStates["face"];
      if (faceState) {
        faceState.x += (Math.random() - 0.5) * amt * 1.5;
        faceState.y += (Math.random() - 0.5) * amt * 1.5;
      }
    }

    // Apply smooth cross-fade interpolation if transitioning
    if (this.isTransitioning || this.isTransitioningToNeutral) {
      const elapsed = now - this.transitionStartTime;
      if (elapsed >= this.transitionDuration) {
        this.isTransitioning = false;
        this.isTransitioningToNeutral = false;
      } else {
        const progress = Math.max(0, Math.min(1, elapsed / this.transitionDuration));
        const blendFactor = (1 - Math.cos(progress * Math.PI)) / 2;
        
        for (const partName of Object.keys(this.parts)) {
          const source = this.transitionSourceStates[partName];
          if (!source) continue;
          
          const target = this.animationStates[partName];
          target.x = this.lerp(source.x ?? 0, target.x, blendFactor);
          target.y = this.lerp(source.y ?? 0, target.y, blendFactor);
          target.rotate = this.lerp(source.rotate ?? 0, target.rotate, blendFactor);
          target.scaleX = this.lerp(source.scaleX ?? 1.0, target.scaleX, blendFactor);
          target.scaleY = this.lerp(source.scaleY ?? 1.0, target.scaleY, blendFactor);
          target.skewX = this.lerp(source.skewX ?? 0, target.skewX, blendFactor);
          target.skewY = this.lerp(source.skewY ?? 0, target.skewY, blendFactor);
        }
      }
    }

    // 4. Process blink cycle
    this.updateBlink(now);

    // Update dynamic particles
    this.updateParticles(now);

    // 5. Build and commit combined transform matrices to the DOM
    this.render();

    requestAnimationFrame(this.tick);
  }

  updateAnimations(now) {
    if (!this.isPlaying || !this.currentAnimation) return;

    const anim = this.currentAnimation;
    const elapsed = Math.max(0, now - this.animationStartTime);
    let t = elapsed;

    if (anim.loop) {
      t = elapsed % anim.duration;
    } else if (elapsed >= anim.duration) {
      // Capture last pose snapshot before clearing
      this.transitionSourceStates = {};
      for (const partName of Object.keys(this.parts)) {
        this.transitionSourceStates[partName] = { ...this.animationStates[partName] };
      }
      this.isPlaying = false;
      this.currentAnimation = null;
      this.isTransitioningToNeutral = true;
      this.isTransitioning = false;
      this.transitionStartTime = now;

      // Restore previous emote
      if (this.previousEmote) {
        this.setEmote(this.previousEmote);
        this.previousEmote = "normal";
      } else {
        this.setEmote("normal");
      }

      if (this.animationResolve) {
        this.animationResolve(true);
        this.animationResolve = null;
      }
      return;
    }

    // Find bounding keyframes
    const keyframes = anim.keyframes;
    let k1 = keyframes[0];
    let k2 = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i].time <= t && keyframes[i+1].time >= t) {
        k1 = keyframes[i];
        k2 = keyframes[i+1];
        break;
      }
    }

    const range = k2.time - k1.time;
    const rawProgress = range === 0 ? 1 : (t - k1.time) / range;
    const easedProgress = (1 - Math.cos(rawProgress * Math.PI)) / 2;

    // Interpolate animated properties
    for (const partName of Object.keys(this.parts)) {
      const p1 = k1.targets[partName] || {};
      const p2 = k2.targets[partName] || {};
      
      const state = this.animationStates[partName];
      state.x = this.lerp(p1.x ?? 0, p2.x ?? 0, easedProgress);
      state.y = this.lerp(p1.y ?? 0, p2.y ?? 0, easedProgress);
      state.rotate = this.lerp(p1.rotate ?? 0, p2.rotate ?? 0, easedProgress);
      state.scaleX = this.lerp(p1.scaleX ?? 1.0, p2.scaleX ?? 1.0, easedProgress);
      state.scaleY = this.lerp(p1.scaleY ?? 1.0, p2.scaleY ?? 1.0, easedProgress);
      state.skewX = this.lerp(p1.skewX ?? 0, p2.skewX ?? 0, easedProgress);
      state.skewY = this.lerp(p1.skewY ?? 0, p2.skewY ?? 0, easedProgress);
    }
  }

  updateIdle(time) {
    for (const [partName, partConfig] of Object.entries(this.meta.parts)) {
      if (!partConfig.idle) continue;
      const idle = partConfig.idle;
      const speed = idle.speed || 1.0;
      const state = this.animationStates[partName];

      if (idle.rotate) {
        state.rotate += Math.sin(time * speed) * idle.rotate;
      }
      if (idle.y) {
        state.y += Math.sin(time * speed) * idle.y;
      }
      if (idle.scaleY) {
        state.scaleY += Math.sin(time * speed) * idle.scaleY;
        state.scaleX -= Math.sin(time * speed) * (idle.scaleY * 0.5);
      }
    }
  }

  updateLookAt(delta) {
    if (!this.options.enableLookAt) return;
    
    const factor = Math.min(1.0, this.options.lookAtDamping * (delta / 16.67));
    this.mouseCurrent.x = this.lerp(this.mouseCurrent.x, this.mouseTarget.x, factor);
    this.mouseCurrent.y = this.lerp(this.mouseCurrent.y, this.mouseTarget.y, factor);

    const scale = this.options.lookAtScale || 1.0;
    const mx = this.mouseCurrent.x * scale;
    const my = this.mouseCurrent.y * scale;

    const headState = this.animationStates["head"];
    if (headState) {
      headState.x += mx * 6.0;
      headState.y += my * 4.5;
      headState.rotate += mx * 8.0;

      const now = performance.now();
      if (this.currentEmote === "crying") {
        headState.y += Math.sin(now * 0.035) * 5.0;
      } else if (this.currentEmote === "super_happy") {
        headState.x += Math.sin(now * 0.02) * 6.0;
        headState.y += Math.cos(now * 0.03) * 4.5;
        headState.rotate += Math.sin(now * 0.015) * 5.0;
      }
    }

    const outlineState = this.animationStates["head_outline"];
    if (outlineState) {
      outlineState.x += mx * -6.5;
      outlineState.y += my * -3.0;
    }

    const hatState = this.animationStates["hat"];
    if (hatState) {
      hatState.x += mx * 2.0;
      hatState.y += my * 1.5;
    }

    const faceState = this.animationStates["face"];
    if (faceState) {
      faceState.x += mx * 5.0;
      faceState.y += my * 3.0;
    }

    const emoteState = this.animationStates["emote"];
    if (emoteState) {
      emoteState.x += mx * 15.0;
      emoteState.y += my * 9.0;
    }

    const torsoState = this.animationStates["torso"];
    if (torsoState) {
      torsoState.x += mx * 2.0;
      torsoState.y += my * 1.0;
    }
    const detailState = this.animationStates["torso_detail"];
    if (detailState) {
      detailState.x += mx * 4.5;
      detailState.y += my * 2.5;
    }
  }

  updateBlink(now) {
    if (!this.options.enableBlink || !this.leftEye || !this.rightEye) return;

    if (this.isBlinking) {
      const elapsed = now - this.blinkStartTime;
      if (elapsed >= this.options.blinkDuration) {
        this.isBlinking = false;
        this.blinkScaleY = 1.0;
        this.scheduleNextBlink();
      } else {
        const progress = elapsed / this.options.blinkDuration;
        this.blinkScaleY = 0.5 - 0.5 * Math.cos(progress * 2 * Math.PI);
      }
    } else if (now >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkStartTime = now;
      this.blinkScaleY = 0.0;
    }
  }

  render() {
    for (const [partName, element] of Object.entries(this.parts)) {
      const state = this.animationStates[partName];
      const base = this.baseTransforms[partName] || "";
      
      // Relative pivots: wrapped parts rotate around local (0, 0), mascot_root rotates globally
      const pivot = partName === "mascot_root" ? [105.0, 240.0] : [0, 0];

      const animTransform = `translate(${state.x}, ${state.y}) ` +
                            `translate(${pivot[0]}, ${pivot[1]}) ` +
                            `rotate(${state.rotate}) ` +
                            `scale(${state.scaleX}, ${state.scaleY}) ` +
                            `skewX(${state.skewX}) ` +
                            `skewY(${state.skewY}) ` +
                            `translate(${-pivot[0]}, ${-pivot[1]})`;
      
      element.setAttribute("transform", `${base} ${animTransform}`.trim());
    }

    // eye-blinking & expressions
    if (this.leftEye && this.rightEye) {
      const leftBase = this.baseEyeTransforms.left;
      const rightBase = this.baseEyeTransforms.right;
      
      const lp = this.leftEyePivot;
      const rp = this.rightEyePivot;

      let lScaleX = 1.0, lScaleY = this.blinkScaleY, lRot = 0;
      let rScaleX = 1.0, rScaleY = this.blinkScaleY, rRot = 0;
      let showSpirals = false;
      let showSadTears = false;

      const now = performance.now();
      const emote = this.currentEmote || "normal";
      const config = this.meta.expressions?.[emote];
      
      if (config) {
        if (config.eye_scale_x !== undefined) {
          lScaleX *= config.eye_scale_x;
          rScaleX *= config.eye_scale_x;
        }
        if (config.left_eye_scale_x !== undefined) {
          lScaleX = config.left_eye_scale_x;
        }
        if (config.right_eye_scale_x !== undefined) {
          rScaleX = config.right_eye_scale_x;
        }
        if (config.eye_scale_y !== undefined) {
          lScaleY *= config.eye_scale_y;
          rScaleY *= config.eye_scale_y;
        }
        if (config.left_eye_scale_y !== undefined) {
          lScaleY = config.left_eye_scale_y * this.blinkScaleY;
        }
        if (config.right_eye_scale_y !== undefined) {
          rScaleY = config.right_eye_scale_y * this.blinkScaleY;
        }
        if (config.left_eye_rotate !== undefined) {
          lRot = config.left_eye_rotate;
        }
        if (config.right_eye_rotate !== undefined) {
          rRot = config.right_eye_rotate;
        }
        if (config.dizzy_spirals) {
          showSpirals = true;
        }
        if (config.sad_tears) {
          showSadTears = true;
        }
      } else {
        // Fallback block to original behavior
        if (emote === "happy" || emote === "super_happy") {
          lScaleY *= 0.65;
          rScaleY *= 0.65;
        } else if (emote === "wink") {
          rScaleY = 0.15;
        } else if (emote === "sleepy" || emote === "sad") {
          lScaleY = 0.15;
          rScaleY = 0.15;
        } else if (emote === "crying") {
          lScaleY = 0.1; lRot = 15;
          rScaleY = 0.1; rRot = -15;
        }
        if (emote === "dizzy") showSpirals = true;
        if (emote === "sad") showSadTears = true;
      }

      // Keep eye & eyebrow color synchronized with mouth color dynamically
      const currentMouthColor = (this.mouth && this.mouth.style.fill) ? this.mouth.style.fill : (this.mouthColor || "#114908");

      if (this.leftEyebrow) this.leftEyebrow.style.stroke = currentMouthColor;
      if (this.rightEyebrow) this.rightEyebrow.style.stroke = currentMouthColor;

      const scale = this.options.lookAtScale || 1.0;
      const eyeShiftX = this.mouseCurrent.x * 2.5 * scale;
      const eyeShiftY = this.mouseCurrent.y * 1.8 * scale;

      if (showSpirals) {
        this.leftEye.style.opacity = "0";
        this.rightEye.style.opacity = "0";
        
        if (this.leftSpiral && this.rightSpiral) {
          this.leftSpiral.style.display = "inline";
          this.rightSpiral.style.display = "inline";
          this.leftSpiral.setAttribute("stroke", currentMouthColor);
          this.rightSpiral.setAttribute("stroke", currentMouthColor);
          
          const spinAngleL = (now * 0.4) % 360;
          const spinAngleR = -(now * 0.4) % 360;
          
          this.leftSpiral.setAttribute("transform", `translate(${lp[0] + eyeShiftX}, ${lp[1] + eyeShiftY}) rotate(${spinAngleL}) scale(1.15)`);
          this.rightSpiral.setAttribute("transform", `translate(${rp[0] + eyeShiftX}, ${rp[1] + eyeShiftY}) rotate(${spinAngleR}) scale(1.15)`);
        }
      } else {
        this.leftEye.style.opacity = "1";
        this.rightEye.style.opacity = "1";
        
        // Synchronize fill color of eyes with the mouth color
        this.leftEye.style.fill = currentMouthColor;
        this.rightEye.style.fill = currentMouthColor;
        
        if (this.leftSpiral) this.leftSpiral.style.display = "none";
        if (this.rightSpiral) this.rightSpiral.style.display = "none";

        const leftBlink = `translate(${lp[0] + eyeShiftX}, ${lp[1] + eyeShiftY}) rotate(${lRot}) scale(${lScaleX}, ${lScaleY}) translate(${-lp[0]}, ${-lp[1]})`;
        const rightBlink = `translate(${rp[0] + eyeShiftX}, ${rp[1] + eyeShiftY}) rotate(${rRot}) scale(${rScaleX}, ${rScaleY}) translate(${-rp[0]}, ${-rp[1]})`;

        this.leftEye.setAttribute("transform", `${leftBase} ${leftBlink}`.trim());
        this.rightEye.setAttribute("transform", `${rightBase} ${rightBlink}`.trim());
      }

      if (showSadTears) {
        if (this.leftTear && this.rightTear) {
          this.leftTear.setAttribute("style", "display: inline;");
          this.rightTear.setAttribute("style", "display: inline;");
          const wiggleY = Math.sin(now * 0.005) * 1.5;
          this.leftTear.setAttribute("transform", `translate(${lp[0] - 2}, ${lp[1] + 6}) scale(1.2) translate(0, ${wiggleY})`);
          this.rightTear.setAttribute("transform", `translate(${rp[0] + 2}, ${rp[1] + 6}) scale(1.2) translate(0, ${wiggleY})`);
        }
      } else {
        if (this.leftTear) this.leftTear.setAttribute("style", "display: none;");
        if (this.rightTear) this.rightTear.setAttribute("style", "display: none;");
      }
    }
  }

  spawnParticle(x, y, symbol) {
    if (!this.particlesContainer) return;
    
    const el = document.createElement("div");
    el.className = "particle";
    el.textContent = symbol;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const dx = -60 + Math.random() * 120;
    const dy = -100 - Math.random() * 100;
    const rot = -45 + Math.random() * 90;

    el.style.setProperty("--dx", `${dx}px`);
    el.style.setProperty("--dy", `${dy}px`);
    el.style.setProperty("--rot", `${rot}deg`);

    this.particlesContainer.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  triggerHeartsBurst() {
    const head = this.svg.querySelector("#head-composite-container") || this.parts["head"] || this.svg;
    if (!head || !this.particlesContainer) return;

    const box = head.getBoundingClientRect();
    const pBox = this.particlesContainer.getBoundingClientRect();

    const headX = (box.left + box.width / 2) - pBox.left;
    const headY = box.top - pBox.top;

    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.spawnParticle(headX, headY, "💚");
      }, i * 60);
    }
  }

  spawnCryingTears() {
    if (!this.leftEye || !this.rightEye || !this.particlesContainer) return;

    const pBox = this.particlesContainer.getBoundingClientRect();
    const tearSymbols = ["💧", "💦"];

    // Left eye tear
    const boxL = this.leftEye.getBoundingClientRect();
    const xL = (boxL.left + boxL.width / 2) - pBox.left;
    const yL = (boxL.top + boxL.height / 2) - pBox.top;
    
    const tearL = document.createElement("div");
    tearL.className = "crying-tear";
    tearL.textContent = tearSymbols[Math.floor(Math.random() * tearSymbols.length)];
    tearL.style.left = `${xL - 8 + Math.random() * 16}px`;
    tearL.style.top = `${yL + 5}px`;
    this.particlesContainer.appendChild(tearL);
    setTimeout(() => tearL.remove(), 800);

    // Right eye tear
    const boxR = this.rightEye.getBoundingClientRect();
    const xR = (boxR.left + boxR.width / 2) - pBox.left;
    const yR = (boxR.top + boxR.height / 2) - pBox.top;

    const tearR = document.createElement("div");
    tearR.className = "crying-tear";
    tearR.textContent = tearSymbols[Math.floor(Math.random() * tearSymbols.length)];
    tearR.style.left = `${xR - 8 + Math.random() * 16}px`;
    tearR.style.top = `${yR + 5}px`;
    this.particlesContainer.appendChild(tearR);
    setTimeout(() => tearR.remove(), 800);
  }

  spawnSpeedLine() {
    if (!this.particlesContainer) return;
    const symbols = ["💨", "✨", "⚡", "▫️"];
    const el = document.createElement("div");
    el.className = "speed-line";
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.top = `${Math.random() * 80 + 10}%`;
    this.particlesContainer.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  spawnSleepingZzz() {
    if (!this.particlesContainer) return;
    
    // Spawn near the top-right of the head
    const head = this.svg.querySelector("#head-composite-container") || this.parts["head"] || this.svg;
    if (!head) return;

    const box = head.getBoundingClientRect();
    const pBox = this.particlesContainer.getBoundingClientRect();

    const x = (box.left + box.width * 0.75) - pBox.left;
    const y = box.top - pBox.top;

    const el = document.createElement("div");
    el.className = "sleeping-zzz";
    el.textContent = Math.random() > 0.5 ? "Z" : "z";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    // Drift up and right, and fade out
    const dx = 10 + Math.random() * 30;
    const dy = -35 - Math.random() * 30;
    const rot = -15 + Math.random() * 30;

    el.style.setProperty("--dx", `${dx}px`);
    el.style.setProperty("--dy", `${dy}px`);
    el.style.setProperty("--rot", `${rot}deg`);

    this.particlesContainer.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  spawnHitStars() {
    const head = this.svg.querySelector("#head-composite-container") || this.parts["head"] || this.svg;
    if (!head || !this.particlesContainer) return;

    const box = head.getBoundingClientRect();
    const pBox = this.particlesContainer.getBoundingClientRect();

    const headX = (box.left + box.width / 2) - pBox.left;
    const headY = (box.top + box.height / 2) - pBox.top;

    const symbols = ["💥", "⭐", "✨", "💫", "⚡"];
    
    // Spawn a burst of 4 particles
    for (let i = 0; i < 4; i++) {
      const el = document.createElement("div");
      el.className = "particle";
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      
      // Random offset centered around head
      const scatterX = (Math.random() - 0.5) * 50;
      const scatterY = (Math.random() - 0.5) * 50;
      el.style.left = `${headX + scatterX}px`;
      el.style.top = `${headY + scatterY}px`;

      const dx = -80 + Math.random() * 160;
      const dy = -120 - Math.random() * 80;
      const rot = -90 + Math.random() * 180;

      el.style.setProperty("--dx", `${dx}px`);
      el.style.setProperty("--dy", `${dy}px`);
      el.style.setProperty("--rot", `${rot}deg`);

      this.particlesContainer.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    }
  }

  updateParticles(now) {
    if (!this.particlesContainer) return;

    const triggers = [];

    // 1. From active animation
    if (this.isPlaying && this.currentAnimation && this.currentAnimation.particles) {
      const elapsed = now - this.animationStartTime;
      this.currentAnimation.particles.forEach(p => {
        const start = p.start ?? 0;
        const end = p.end ?? Infinity;
        if (elapsed >= start && elapsed <= end) {
          triggers.push(p);
        }
      });
    }

    // 2. From active expression
    const exprConfig = this.meta.expressions?.[this.currentEmote];
    if (exprConfig && exprConfig.particles) {
      exprConfig.particles.forEach(p => {
        triggers.push(p);
      });
    }

    // Process active triggers
    triggers.forEach(t => {
      const type = t.type;
      const interval = t.interval || 100;
      this.particleLastSpawnTime[type] = this.particleLastSpawnTime[type] || 0;

      if (now - this.particleLastSpawnTime[type] > interval) {
        this.particleLastSpawnTime[type] = now;
        if (type === "crying") {
          this.spawnCryingTears();
        } else if (type === "speed_lines") {
          this.spawnSpeedLine();
        } else if (type === "sleeping") {
          this.spawnSleepingZzz();
        } else if (type === "stars") {
          this.spawnHitStars();
        }
      }
    });
  }

  lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
  }

  renderAtTime(animationData, timeMs) {
    for (const partName of Object.keys(this.parts)) {
      const state = this.animationStates[partName];
      state.x = 0;
      state.y = 0;
      state.rotate = 0;
      state.scaleX = 1.0;
      state.scaleY = 1.0;
      state.skewX = 0;
      state.skewY = 0;
    }

    const keyframes = animationData.keyframes;
    if (keyframes && keyframes.length > 0) {
      let k1 = keyframes[0];
      let k2 = keyframes[keyframes.length - 1];

      for (let i = 0; i < keyframes.length - 1; i++) {
        if (keyframes[i].time <= timeMs && keyframes[i+1].time >= timeMs) {
          k1 = keyframes[i];
          k2 = keyframes[i+1];
          break;
        }
      }

      const range = k2.time - k1.time;
      const rawProgress = range === 0 ? 1 : (timeMs - k1.time) / range;
      const easedProgress = (1 - Math.cos(rawProgress * Math.PI)) / 2;

      for (const partName of Object.keys(this.parts)) {
        const p1 = k1.targets[partName] || {};
        const p2 = k2.targets[partName] || {};
        const state = this.animationStates[partName];

        state.x = this.lerp(p1.x ?? 0, p2.x ?? 0, easedProgress);
        state.y = this.lerp(p1.y ?? 0, p2.y ?? 0, easedProgress);
        state.rotate = this.lerp(p1.rotate ?? 0, p2.rotate ?? 0, easedProgress);
        state.scaleX = this.lerp(p1.scaleX ?? 1.0, p2.scaleX ?? 1.0, easedProgress);
        state.scaleY = this.lerp(p1.scaleY ?? 1.0, p2.scaleY ?? 1.0, easedProgress);
        state.skewX = this.lerp(p1.skewX ?? 0, p2.skewX ?? 0, easedProgress);
        state.skewY = this.lerp(p1.skewY ?? 0, p2.skewY ?? 0, easedProgress);
      }
    }

    this.render();
  }
}
