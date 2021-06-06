provider "google" {
  project = "carto-bot"
  region  = "us-central1"
}

terraform {
  backend "gcs" {
    bucket = "carto-bot-tfstate"
    prefix = "carto-bot-janitor"
  }
}
