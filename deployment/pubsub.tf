resource "google_pubsub_topic" "janitor" {
  name = "janitor-trigger"
}

resource "google_cloud_scheduler_job" "daily_job" {
  name        = "daily-janitor-job"
  description = "Runs the janitor daily at 8am to cleanup database"
  schedule    = "0 8 * * *"

  pubsub_target {
    topic_name = google_pubsub_topic.janitor.id
    data       = base64encode("run")
  }
}
