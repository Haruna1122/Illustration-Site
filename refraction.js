(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsWebGL = (() => {
    try {
      const canvas = document.createElement("canvas");
      return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch (error) {
      return false;
    }
  })();

  if (!supportsWebGL || prefersReducedMotion) {
    document.documentElement.classList.add("no-refraction");
    return;
  }

  const vertexShaderSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;

    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;

    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform vec2 uImageResolution;
    uniform vec2 uMouse;
    uniform float uTime;
    uniform float uHover;
    uniform float uIntensity;
    varying vec2 vUv;

    vec2 coverUv(vec2 uv) {
      float screenAspect = uResolution.x / max(uResolution.y, 1.0);
      float imageAspect = uImageResolution.x / max(uImageResolution.y, 1.0);
      vec2 scale = vec2(1.0);

      if (screenAspect > imageAspect) {
        scale.y = imageAspect / screenAspect;
      } else {
        scale.x = screenAspect / imageAspect;
      }

      return (uv - 0.5) * scale + 0.5;
    }

    float softMask(vec2 uv) {
      vec2 centered = uv - 0.5;
      float oval = length(centered * vec2(1.05, 0.78));
      return smoothstep(0.72, 0.22, oval);
    }

    void main() {
      vec2 aspectMouse = (vUv - uMouse) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
      float dist = length(aspectMouse);
      vec2 dir = normalize(aspectMouse + vec2(0.0001));

      float slowWaveA = sin(vUv.y * 17.0 + uTime * 0.75 + sin(vUv.x * 7.0));
      float slowWaveB = cos(vUv.x * 13.0 - uTime * 0.52 + sin(vUv.y * 9.0));
      vec2 surfaceFlow = vec2(slowWaveA, slowWaveB) * 0.0055;

      float touchWave = sin(dist * 48.0 - uTime * 4.7) * exp(-dist * 5.8) * uHover;
      vec2 touchFlow = dir * touchWave * 0.017;

      vec2 offset = (surfaceFlow + touchFlow) * uIntensity;
      vec2 uv = clamp(coverUv(vUv + offset), 0.001, 0.999);

      float chroma = 0.0035 * uIntensity * (0.35 + uHover * 0.65);
      vec3 color;
      color.r = texture2D(uTexture, clamp(coverUv(vUv + offset + vec2(chroma, -chroma * 0.25)), 0.001, 0.999)).r;
      color.g = texture2D(uTexture, uv).g;
      color.b = texture2D(uTexture, clamp(coverUv(vUv + offset - vec2(chroma * 0.6, -chroma * 0.25)), 0.001, 0.999)).b;

      float highlight = pow(max(0.0, touchWave), 2.0) * 0.48 + (slowWaveA * 0.5 + 0.5) * 0.055;
      float alpha = softMask(vUv) * (0.32 + uHover * 0.24);

      gl_FragColor = vec4(color + highlight, alpha);
    }
  `;

  function getAssetSrc(key) {
    if (window.resolveSiteAsset) return window.resolveSiteAsset(key);
    return (window.SITE_ASSETS && window.SITE_ASSETS[key]) || key;
  }

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(info || "Shader compile failed");
    }

    return shader;
  }

  function createProgram(gl) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(info || "Program link failed");
    }

    return program;
  }

  class RefractionLayer {
    constructor(host) {
      this.host = host;
      this.assetKey = host.dataset.refractionKey;
      this.src = host.dataset.refractionSrc || getAssetSrc(this.assetKey);
      this.intensity = Number(host.dataset.refractionIntensity || 1);
      this.hover = 0;
      this.targetHover = 0;
      this.mouse = { x: 0.5, y: 0.5 };
      this.imageSize = { width: 1, height: 1 };
      this.startTime = performance.now();
      this.rafId = 0;

      this.canvas = host.querySelector(":scope > .refraction-canvas") || document.createElement("canvas");
      this.canvas.classList.add("refraction-canvas");
      this.canvas.setAttribute("aria-hidden", "true");
      this.canvas.dataset.refractionCanvas = "";
      if (!this.canvas.parentElement) host.prepend(this.canvas);

      this.gl = this.canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        preserveDrawingBuffer: false,
      });

      if (!this.gl || !this.src) {
        this.disable();
        return;
      }

      try {
        this.initGl();
        this.bindEvents();
        this.loadTexture(this.src);
      } catch (error) {
        this.disable();
      }
    }

    initGl() {
      const gl = this.gl;
      this.program = createProgram(gl);
      this.locations = {
        position: gl.getAttribLocation(this.program, "aPosition"),
        texture: gl.getUniformLocation(this.program, "uTexture"),
        resolution: gl.getUniformLocation(this.program, "uResolution"),
        imageResolution: gl.getUniformLocation(this.program, "uImageResolution"),
        mouse: gl.getUniformLocation(this.program, "uMouse"),
        time: gl.getUniformLocation(this.program, "uTime"),
        hover: gl.getUniformLocation(this.program, "uHover"),
        intensity: gl.getUniformLocation(this.program, "uIntensity"),
      };

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

      gl.useProgram(this.program);
      gl.enableVertexAttribArray(this.locations.position);
      gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1i(this.locations.texture, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    loadTexture(src) {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        this.imageSize.width = image.naturalWidth || image.width || 1;
        this.imageSize.height = image.naturalHeight || image.height || 1;
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.host.classList.add("has-refraction");
        this.resize();
        this.render();
      };
      image.onerror = () => this.disable();
      image.src = src;
    }

    bindEvents() {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host);

      this.host.addEventListener("pointerenter", (event) => {
        this.targetHover = 1;
        this.updateMouse(event);
      });

      this.host.addEventListener(
        "pointermove",
        (event) => {
          this.updateMouse(event);
        },
        { passive: true }
      );

      this.host.addEventListener("pointerleave", () => {
        this.targetHover = 0;
      });
    }

    updateMouse(event) {
      const rect = this.host.getBoundingClientRect();
      this.mouse.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(rect.width, 1)));
      this.mouse.y = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(rect.height, 1)));
      this.host.style.setProperty("--local-x", `${this.mouse.x * 100}%`);
      this.host.style.setProperty("--local-y", `${(1 - this.mouse.y) * 100}%`);
    }

    resize() {
      const rect = this.host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
      }
    }

    render = () => {
      if (!this.texture) return;

      const gl = this.gl;
      const now = performance.now();
      this.hover += (this.targetHover - this.hover) * 0.075;

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
      gl.uniform2f(this.locations.imageResolution, this.imageSize.width, this.imageSize.height);
      gl.uniform2f(this.locations.mouse, this.mouse.x, this.mouse.y);
      gl.uniform1f(this.locations.time, (now - this.startTime) * 0.001);
      gl.uniform1f(this.locations.hover, this.hover);
      gl.uniform1f(this.locations.intensity, this.intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      this.rafId = window.requestAnimationFrame(this.render);
    };

    disable() {
      this.host.classList.add("no-refraction");
      if (this.canvas) this.canvas.hidden = true;
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.rafId) window.cancelAnimationFrame(this.rafId);
    }
  }

  const hosts = Array.from(document.querySelectorAll("[data-refraction-key]"));
  hosts.forEach((host) => new RefractionLayer(host));
})();
