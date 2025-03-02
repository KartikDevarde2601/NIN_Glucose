package com.nin

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.annotation.NonNull
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = ManageStorageModule.NAME)
class ManageStorageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "ManageStorage"
    }

    @NonNull
    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun requestManageExternalStoragePermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                try {
                    val uri = Uri.parse("package:" + reactApplicationContext.packageName)
                    val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, uri)
                    currentActivity?.startActivityForResult(intent, 1)
                    promise.resolve("Permission requested")
                } catch (e: Exception) {
                    promise.reject("ERROR", e.message)
                }
            } else {
                promise.resolve("Permission already granted")
            }
        } else {
            promise.resolve("Not applicable for this Android version")
        }
    }
}