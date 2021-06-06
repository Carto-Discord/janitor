data "archive_file" "package_zip" {
  type        = "zip"
  source_dir  = "../package/"
  output_path = "../package.zip"
}

resource "google_storage_bucket_object" "janitor_archive" {
  name   = "${var.app_name}_janitor.${data.archive_file.package_zip.output_md5}.zip"
  bucket = "${var.app_name}-code"
  source = data.archive_file.package_zip.output_path
}
