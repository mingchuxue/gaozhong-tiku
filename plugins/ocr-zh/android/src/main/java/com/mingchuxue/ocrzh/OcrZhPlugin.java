package com.mingchuxue.ocrzh;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import java.io.IOException;

@CapacitorPlugin(name = "OcrZh")
public class OcrZhPlugin extends Plugin {

    @PluginMethod
    public void process(PluginCall call) {
        String imageString = call.getString("image");
        if (imageString == null || imageString.isEmpty()) {
            call.reject("缺少图片");
            return;
        }

        TextRecognizer recognizer =
            TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build());

        try {
            InputImage image;
            if (imageString.startsWith("data:")) {
                String payload = imageString;
                if (payload.contains(",")) {
                    payload = payload.split(",", 2)[1];
                }
                byte[] decoded = Base64.decode(payload, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(decoded, 0, decoded.length);
                if (bitmap == null) {
                    call.reject("无法解析图片数据");
                    return;
                }
                // Downscale large images to speed OCR
                int maxSide = 2000;
                int w = bitmap.getWidth();
                int h = bitmap.getHeight();
                if (Math.max(w, h) > maxSide) {
                    float scale = (float) maxSide / (float) Math.max(w, h);
                    bitmap = Bitmap.createScaledBitmap(
                        bitmap,
                        Math.round(w * scale),
                        Math.round(h * scale),
                        true
                    );
                }
                image = InputImage.fromBitmap(bitmap, 0);
            } else {
                image = InputImage.fromFilePath(getContext(), Uri.parse(imageString));
            }

            recognizer
                .process(image)
                .addOnSuccessListener(
                    (visionText) -> {
                        JSArray resultsArray = new JSArray();
                        StringBuilder full = new StringBuilder();
                        for (Text.TextBlock block : visionText.getTextBlocks()) {
                            for (Text.Line line : block.getLines()) {
                                JSObject observation = new JSObject();
                                observation.put("text", line.getText());
                                observation.put("confidence", line.getConfidence());
                                resultsArray.put(observation);
                                if (full.length() > 0) full.append("\n");
                                full.append(line.getText());
                            }
                        }
                        JSObject results = new JSObject();
                        results.put("results", resultsArray);
                        results.put("text", full.toString());
                        call.resolve(results);
                    }
                )
                .addOnFailureListener((e) -> call.reject("识别失败: " + e.getMessage(), e));
        } catch (IOException e) {
            call.reject("读取图片失败", e);
        } catch (Exception e) {
            call.reject("处理图片出错: " + e.getMessage(), e);
        }
    }
}
