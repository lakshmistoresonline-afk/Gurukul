package com.gurukul.ai.lms.ui.components

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukul.ai.lms.models.DiagramAsset
import com.gurukul.ai.lms.models.DiagramHotspot

@Composable
fun InteractiveDiagramMap(
    diagram: DiagramAsset,
    subjectCode: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var selectedHotspot by remember { mutableStateOf<DiagramHotspot?>(null) }

    val imagePath = "images/class_5/$subjectCode/${diagram.imageFilename}"
    val bitmap = remember(imagePath) {
        try {
            context.assets.open(imagePath).use { BitmapFactory.decodeStream(it) }
        } catch (e: Exception) {
            null
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
            .background(Color.Black)
    ) {
        if (bitmap != null) {
            Image(
                bitmap = bitmap.asImageBitmap(),
                contentDescription = diagram.title,
                modifier = Modifier.fillMaxSize()
            )
        }

        // Percentage-based Hotspot Overlays
        diagram.hotspots.forEach { hotspot ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .wrapContentSize(Alignment.TopStart)
                    .offset(
                        x = (hotspot.xPercent / 100f * 360).dp,
                        y = (hotspot.yPercent / 100f * 202.5).dp
                    )
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF00D1FF).copy(alpha = 0.85f))
                        .clickable { selectedHotspot = hotspot },
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "•", color = Color.Black, fontSize = 18.sp)
                }
            }
        }
    }

    selectedHotspot?.let { hotspot ->
        AlertDialog(
            onDismissRequest = { selectedHotspot = null },
            title = { Text(text = hotspot.label, style = MaterialTheme.typography.titleMedium) },
            text = { Text(text = hotspot.tooltip, style = MaterialTheme.typography.bodyMedium) },
            confirmButton = {
                TextButton(onClick = { selectedHotspot = null }) {
                    Text("Close")
                }
            }
        )
    }
}
