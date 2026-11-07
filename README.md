# 高中错题本（Android）

离线可用的高中错题本 App：九科记录、知识点标签、分步解题、掌握度、导出/导入备份。

额外功能：**拍照识题 / 从相册识题**（端上 Google ML Kit 中文 OCR，无需 API Key）。

- 包名：`com.mingchuxue.tiku`
- 技术：Capacitor 8 + 原网页错题本 + 本地 KaTeX + `ocr-zh` 插件

## 安装 APK

1. 把 `gaozhong-tiku.apk`（debug 签名）传到手机
2. 设置里允许「安装未知应用」
3. 打开 APK 安装；首次使用相机/相册时授予权限

## 本地再打包

需要 JDK 21 + Android SDK（platform 36、build-tools 36）。

```bash
npm install
# android/local.properties 写入 sdk.dir=你的SDK路径
npx cap sync android
cd android && ./gradlew assembleDebug
# 产物：android/app/build/outputs/apk/debug/app-debug.apk
```

## 识题说明

- 记一题表单内：「拍照识题」「从相册识题」
- 识别文字写入「题目内容」，可编辑后再保存
- 中文 OCR 模型已打进 APK；手写体/模糊照片识别率会下降
