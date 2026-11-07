import { registerPlugin } from '@capacitor/core';

const OcrZh = registerPlugin('OcrZh', {
  web: () => ({
    async process() {
      throw new Error('OCR 仅在 Android App 中可用');
    }
  })
});

export { OcrZh };
export default OcrZh;
