from django.test import SimpleTestCase
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
