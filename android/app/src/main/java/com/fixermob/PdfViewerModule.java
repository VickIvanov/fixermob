package com.fixermob;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import java.io.File;

public class PdfViewerModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "PdfViewerModule";
    private ReactApplicationContext reactContext;

    public PdfViewerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void openPdf(String filePath, Promise promise) {
        try {
            File file = new File(filePath);
            android.util.Log.d("PdfViewerModule", "Opening PDF file: " + filePath);
            android.util.Log.d("PdfViewerModule", "File exists: " + file.exists());
            android.util.Log.d("PdfViewerModule", "File can read: " + file.canRead());
            
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "PDF file not found: " + filePath);
                return;
            }

            Uri uri;
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Для Android 7+ используем FileProvider, для старых версий - Uri.fromFile
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                try {
                    uri = FileProvider.getUriForFile(
                        reactContext,
                        reactContext.getPackageName() + ".fileprovider",
                        file
                    );
                    android.util.Log.d("PdfViewerModule", "FileProvider URI: " + uri.toString());
                } catch (Exception e) {
                    android.util.Log.e("PdfViewerModule", "FileProvider error: " + e.getMessage());
                    // Fallback на прямой file:// URI
                    uri = Uri.fromFile(file);
                    android.util.Log.d("PdfViewerModule", "Using file:// URI: " + uri.toString());
                }
            } else {
                uri = Uri.fromFile(file);
                android.util.Log.d("PdfViewerModule", "Using file:// URI (old Android): " + uri.toString());
            }

            // Пробуем сначала с MIME типом
            intent.setDataAndType(uri, "application/pdf");

            // Проверяем, есть ли приложение для открытия
            android.content.pm.PackageManager pm = reactContext.getPackageManager();
            android.content.pm.ResolveInfo resolveInfo = pm.resolveActivity(intent, android.content.pm.PackageManager.MATCH_DEFAULT_ONLY);
            
            if (resolveInfo != null) {
                android.util.Log.d("PdfViewerModule", "Found app to open PDF: " + resolveInfo.activityInfo.packageName);
                reactContext.startActivity(intent);
                promise.resolve(true);
            } else {
                android.util.Log.d("PdfViewerModule", "No app found with application/pdf, trying generic intent");
                // Пробуем открыть без указания типа - система сама определит по расширению
                Intent genericIntent = new Intent(Intent.ACTION_VIEW);
                genericIntent.setData(uri);
                genericIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                genericIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                
                resolveInfo = pm.resolveActivity(genericIntent, android.content.pm.PackageManager.MATCH_DEFAULT_ONLY);
                if (resolveInfo != null) {
                    android.util.Log.d("PdfViewerModule", "Found app with generic intent: " + resolveInfo.activityInfo.packageName);
                    reactContext.startActivity(genericIntent);
                    promise.resolve(true);
                } else {
                    android.util.Log.e("PdfViewerModule", "No app found at all");
                    // Последняя попытка - используем Intent.ACTION_SEND
                    Intent sendIntent = new Intent(Intent.ACTION_SEND);
                    sendIntent.setType("application/pdf");
                    sendIntent.putExtra(Intent.EXTRA_STREAM, uri);
                    sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    
                    Intent chooser = Intent.createChooser(sendIntent, "Открыть PDF");
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    
                    if (chooser.resolveActivity(pm) != null) {
                        android.util.Log.d("PdfViewerModule", "Using ACTION_SEND chooser");
                        reactContext.startActivity(chooser);
                        promise.resolve(true);
                    } else {
                        promise.reject("NO_APP", "No application found to open PDF files. Please install a PDF viewer app.");
                    }
                }
            }
        } catch (Exception e) {
            android.util.Log.e("PdfViewerModule", "Error opening PDF: " + e.getMessage(), e);
            promise.reject("ERROR", "Failed to open PDF: " + e.getMessage());
        }
    }
}

