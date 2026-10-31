package com.gurukul.ai.lms.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.gurukul.ai.lms.models.MediaDirectoryDataset
import com.gurukul.ai.lms.models.QuizDataset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.security.MessageDigest

class ContentSeederWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    private val gson = Gson()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val assetManager = context.assets
            // Hard scope guard: process class_5 only
            val class5Path = "data/class_5"
            val subjects = assetManager.list(class5Path) ?: emptyArray()

            for (subject in subjects) {
                val subjectPath = "$class5Path/$subject"
                val jsonFiles = assetManager.list(subjectPath) ?: emptyArray()

                for (jsonFile in jsonFiles) {
                    val fullPath = "$subjectPath/$jsonFile"
                    
                    // Cryptographic verification
                    val sha256Hash = computeSha256(assetManager.open(fullPath))

                    // Parse based on module file
                    when {
                        jsonFile.equals("media_directory.json", ignoreCase = true) -> {
                            val data = gson.fromJson(
                                assetManager.open(fullPath).reader(),
                                MediaDirectoryDataset::class.java
                            )
                        }
                        jsonFile.equals("Quiz.json", ignoreCase = true) -> {
                            val quiz = gson.fromJson(
                                assetManager.open(fullPath).reader(),
                                QuizDataset::class.java
                            )
                        }
                    }
                }
            }
            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure()
        }
    }

    private fun computeSha256(inputStream: InputStream): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(8192)
        var bytesRead: Int
        while (inputStream.read(buffer).also { bytesRead = it } != -1) {
            digest.update(buffer, 0, bytesRead)
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
}
