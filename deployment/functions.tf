resource "google_cloudfunctions_function" "carto_janitor" {
  name    = "${var.app_name}-janitor"
  runtime = "nodejs16"

  available_memory_mb   = 128
  source_archive_bucket = "${var.app_name}-code"
  source_archive_object = google_storage_bucket_object.janitor_archive.name
  entry_point           = "trigger"
  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.janitor.name
  }

  environment_variables = {
    DISCORD_TOKEN = var.discord_token
    MAP_BUCKET    = "${var.app_name}-map-uploads"
  }
}
