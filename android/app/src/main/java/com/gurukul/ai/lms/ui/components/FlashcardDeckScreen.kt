package com.gurukul.ai.lms.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukul.ai.lms.models.Flashcard
import com.gurukul.ai.lms.models.LeitnerBox

/**
 * 3D Flip Flashcard Deck Composable.
 * Uses `graphicsLayer` rotationY for realistic 3D card flips.
 * Provides Leitner Box spaced-repetition action buttons ("Needs Review" / "Mastered").
 */
@Composable
fun FlashcardDeckScreen(
    flashcards: List<Flashcard>,
    onCardStatusUpdate: (flashcardId: String, newBox: LeitnerBox) -> Unit = { _, _ -> },
    modifier: Modifier = Modifier
) {
    if (flashcards.isEmpty()) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No flashcards available for this chapter.", color = Color.Gray)
        }
        return
    }

    var currentIndex by remember { mutableIntStateOf(0) }
    var isFlipped by remember { mutableStateOf(false) }

    val currentCard = flashcards[currentIndex]

    // 3D Rotation Animation
    val rotation by animateFloatAsState(
        targetValue = if (isFlipped) 180f else 0f,
        animationSpec = tween(durationMillis = 500, easing = FastOutSlowInEasing),
        label = "3D Card Rotation"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Deck Header & Progress Indicator
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "REVISION FLASHCARDS",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = Color(0xFF818CF8),
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.5.sp
                )
            )
            Surface(
                color = Color(0xFF1E293B),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "Card ${currentIndex + 1} of ${flashcards.size}",
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = Color(0xFFCBD5E1),
                        fontWeight = FontWeight.Bold
                    ),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }
        }

        // 3D Flip Card Container
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .padding(vertical = 16.dp)
                .graphicsLayer {
                    rotationY = rotation
                    cameraDistance = 12 * density
                }
                .clickable { isFlipped = !isFlipped },
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (rotation <= 90f) Color(0xFF0F172A) else Color(0xFF1E1B4B)
            ),
            border = BorderStroke(1.dp, Color(0xFF6366F1).copy(alpha = 0.4f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                if (rotation <= 90f) {
                    // Front Face
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            color = Color(0xFF6366F1).copy(alpha = 0.15f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "QUESTION / TERM",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Color(0xFFA5B4FC),
                                    fontWeight = FontWeight.Bold
                                ),
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                        Text(
                            text = currentCard.frontText,
                            style = MaterialTheme.typography.headlineSmall.copy(
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center,
                                lineHeight = 30.sp
                            )
                        )
                        Text(
                            text = "↻ Tap card to flip for answer",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = Color(0xFF818CF8),
                                fontSize = 11.sp
                            )
                        )
                    }
                } else {
                    // Back Face (Mirrored 180deg to display correctly)
                    Column(
                        modifier = Modifier.graphicsLayer { rotationY = 180f },
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            color = Color(0xFF10B981).copy(alpha = 0.15f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "ANSWER / DEFINITION",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Color(0xFF34D399),
                                    fontWeight = FontWeight.Bold
                                ),
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                        Text(
                            text = currentCard.backText,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                color = Color(0xFFE2E8F0),
                                textAlign = TextAlign.Center,
                                lineHeight = 24.sp
                            )
                        )
                    }
                }
            }
        }

        // Spaced Repetition Leitner Action Controls
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = {
                        onCardStatusUpdate(currentCard.id, LeitnerBox.BOX_1_NEW)
                        isFlipped = false
                        currentIndex = (currentIndex + 1) % flashcards.size
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Needs Review ✗", color = Color.White, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        onCardStatusUpdate(currentCard.id, LeitnerBox.BOX_3_MASTERED)
                        isFlipped = false
                        currentIndex = (currentIndex + 1) % flashcards.size
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Mastered ✓", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }

            // Deck Navigation
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                OutlinedButton(
                    onClick = {
                        isFlipped = false
                        currentIndex = (currentIndex - 1 + flashcards.size) % flashcards.size
                    },
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("← Previous")
                }

                OutlinedButton(
                    onClick = {
                        isFlipped = false
                        currentIndex = (currentIndex + 1) % flashcards.size
                    },
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Next →")
                }
            }
        }
    }
}
