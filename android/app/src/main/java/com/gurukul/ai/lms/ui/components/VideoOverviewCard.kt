package com.gurukul.ai.lms.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.gurukul.ai.lms.models.StudioVideoItem

@Composable
fun VideoOverviewCard(
    video: StudioVideoItem,
    onPlayClick: (videoId: String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = video.title, style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))

            // Topic Tags
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                video.topicsCovered.forEach { topic ->
                    SuggestionChip(onClick = {}, label = { Text(topic) })
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = { onPlayClick(video.videoId) },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Play Studio Lesson")
            }
        }
    }
}
