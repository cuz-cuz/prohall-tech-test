from django.test import SimpleTestCase, override_settings
from django.urls import reverse


class HealthCheckTests(SimpleTestCase):
    def test_health_check_returns_service_status(self):
        response = self.client.get(reverse("core:health"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "service": "mosaico-api"},
        )

    def test_health_check_rejects_post(self):
        response = self.client.post(reverse("core:health"))

        self.assertEqual(response.status_code, 405)

    def test_health_check_allows_local_frontend_origin(self):
        response = self.client.get(
            reverse("core:health"),
            HTTP_ORIGIN="http://localhost:5173",
        )

        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "http://localhost:5173",
        )
        self.assertEqual(response.headers["Access-Control-Allow-Credentials"], "true")

    def test_health_check_does_not_allow_an_unknown_origin(self):
        response = self.client.get(
            reverse("core:health"),
            HTTP_ORIGIN="https://malicious.example",
        )

        self.assertNotIn("Access-Control-Allow-Origin", response.headers)

    @override_settings(SECURE_SSL_REDIRECT=True)
    def test_health_check_answers_plain_http_when_ssl_redirect_is_enabled(self):
        response = self.client.get(reverse("core:health"))

        self.assertEqual(response.status_code, 200)

    @override_settings(SECURE_SSL_REDIRECT=True)
    def test_other_routes_still_redirect_plain_http(self):
        response = self.client.get("/api/storefront/")

        self.assertEqual(response.status_code, 301)
