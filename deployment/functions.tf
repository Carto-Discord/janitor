resource "google_cloudfunctions_function" "carto_janitor" {
  name    = "${var.app_name}-janitor"
  runtime = "nodejs14"

  available_memory_mb   = 128
  source_archive_bucket = "${var.app_name}-code"
  source_archive_object = google_storage_bucket_object.janitor_archive.name
  trigger_http          = true
  entry_point           = "trigger"

  environment_variables = {
    DISCORD_TOKEN = var.discord_token
    MAP_BUCKET    = "${var.app_name}-map-uploads"
  }
}
