/* 高中错题本 — 拍照/相册识题（端上中文 OCR） */
(function (global) {
  function isNative() {
    try {
      return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());
    } catch (_) {
      return false;
    }
  }

  function getPlugin(name) {
    return global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins[name];
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("读取图片失败"));
      reader.readAsDataURL(file);
    });
  }

  function compressDataUrl(dataUrl, maxSide, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality || 0.85));
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error("图片解码失败"));
      img.src = dataUrl;
    });
  }

  async function pickWithCameraPlugin(source) {
    const Camera = getPlugin("Camera");
    if (!Camera) throw new Error("相机插件不可用");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: "dataUrl",
      source: source, // "CAMERA" | "PHOTOS"
      correctOrientation: true,
      width: 2000,
    });
    if (!photo || !photo.dataUrl) throw new Error("未获取到图片");
    return photo.dataUrl;
  }

  async function pickWithFileInput(mode) {
    const input = document.getElementById(mode === "camera" ? "ocrCameraInput" : "ocrAlbumInput");
    if (!input) throw new Error("文件选择器不可用");
    return new Promise((resolve, reject) => {
      const onChange = async () => {
        input.removeEventListener("change", onChange);
        const file = input.files && input.files[0];
        input.value = "";
        if (!file) {
          reject(new Error("已取消"));
          return;
        }
        try {
          const raw = await readFileAsDataUrl(file);
          resolve(await compressDataUrl(raw, 2000, 0.85));
        } catch (e) {
          reject(e);
        }
      };
      input.addEventListener("change", onChange, { once: true });
      input.click();
    });
  }

  async function pickImage(mode) {
    // mode: "camera" | "album"
    if (isNative() && getPlugin("Camera")) {
      try {
        return await pickWithCameraPlugin(mode === "camera" ? "CAMERA" : "PHOTOS");
      } catch (e) {
        // User cancel often comes as message containing cancel
        const msg = (e && (e.message || e.errorMessage || String(e))) || "";
        if (/cancel|取消|User cancelled|No image/i.test(msg)) throw new Error("已取消");
        // fall through to file input
        console.warn("Camera plugin failed, fallback to file input", e);
      }
    }
    return pickWithFileInput(mode);
  }

  async function recognize(dataUrl) {
    const OcrZh = getPlugin("OcrZh");
    if (!OcrZh || typeof OcrZh.process !== "function") {
      throw new Error("中文 OCR 插件不可用（请在 App 内使用）");
    }
    // Ensure JPEG data URL for native decoder
    let image = dataUrl;
    if (!/^data:image\//i.test(image)) {
      throw new Error("图片格式无效");
    }
    if (image.length > 6_000_000) {
      image = await compressDataUrl(image, 1600, 0.8);
    }
    const res = await OcrZh.process({ image });
    if (res && typeof res.text === "string" && res.text.trim()) {
      return res.text.trim();
    }
    if (res && Array.isArray(res.results) && res.results.length) {
      return res.results.map((r) => r.text).filter(Boolean).join("\n").trim();
    }
    return "";
  }

  async function pickAndRecognize(mode, onProgress) {
    if (onProgress) onProgress("正在选择图片…");
    const dataUrl = await pickImage(mode);
    if (onProgress) onProgress("正在识别文字（端上中文 OCR）…");
    const text = await recognize(dataUrl);
    if (!text) throw new Error("未识别到文字，请换一张更清晰的题目照片");
    return text;
  }

  global.TikuOcr = {
    isNative,
    pickAndRecognize,
    recognize,
  };
})(window);
