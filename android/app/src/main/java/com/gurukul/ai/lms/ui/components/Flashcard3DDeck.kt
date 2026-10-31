package com.gurukul.ai.lms.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukul.ai.lms.models.FlashcardItem

@Composable
fun Flashcard3DDeck(
    card: FlashcardItem,
    onGrade: (quality: Int) -> Unit // SuperMemo-2 (SM-2): 1 = Hard, 3 = Medium, 5 = Easy
) {
    var isFlipped by remember { mutableStateOf(false) }

    val rotationY by animateFloatAsState(
        targetValue = if (isFlipped) 180f else 0f,
        animationSpec = tween(durationMillis = 500),
        label = "3D_Flip_Animation"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(280.dp)
            .graphicsLayer {
                this.rotationY = rotationY
                cameraDistance = 12f * density
            }
            .clickable { isFlipped = !isFlipped },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            if (rotationY <= 90f) {
                // Front Side
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = card.term, style = MaterialTheme.typography.headlineMedium)
                    card.phonetics?.let {
                        Text(text = it, style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = "Tap to Flip", fontSize = 12.sp, color = Color(0xFF00D1FF))
                }
            } else {
                // Back Side (3D Flipped)
                Column(
                    modifier = Modifier.graphicsLayer { this.rotationY = 180f },
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(text = card.definition, style = MaterialTheme.typography.bodyLarge)
                    card.example?.let {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = "Example: $it", style = MaterialTheme.typography.bodySmall, color = Color.LightGray)
                    }
                    Spacer(modifier = Modifier.height(16.dp))

                    // SuperMemo-2 (SM-2) Self-Grading Buttons
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { onGrade(1) }) { Text("Hard") }
                        Button(onClick = { onGrade(3) }) { Text("Medium") }
                        Button(onClick = { onGrade(5) }) { Text("Easy") }
                    }
                }
            }
        }
    }
}
