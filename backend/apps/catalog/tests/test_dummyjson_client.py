import httpx
from django.test import SimpleTestCase

from apps.catalog.services.dummyjson import (
    DummyJSONClient,
    DummyJSONResponseError,
    DummyJSONTransportError,
)

from .factories import product_payload


class DummyJSONClientTests(SimpleTestCase):
    def test_fetches_every_page(self):
        requested_skips = []

        def handler(request):
            skip = int(request.url.params["skip"])
            requested_skips.append(skip)
            products = (
                [product_payload(1), product_payload(2)]
                if skip == 0
                else [product_payload(3)]
            )
            return httpx.Response(
                200,
                json={"products": products, "total": 3, "skip": skip, "limit": 2},
            )

        transport = httpx.MockTransport(handler)
        with httpx.Client(base_url="https://dummyjson.test", transport=transport) as http:
            client = DummyJSONClient(client=http)
            products = client.fetch_all_products(page_size=2)

        self.assertEqual([product["id"] for product in products], [1, 2, 3])
        self.assertEqual(requested_skips, [0, 2])

    def test_rejects_empty_page_before_total(self):
        transport = httpx.MockTransport(
            lambda request: httpx.Response(
                200,
                json={"products": [], "total": 2, "skip": 0, "limit": 2},
            )
        )
        with httpx.Client(base_url="https://dummyjson.test", transport=transport) as http:
            client = DummyJSONClient(client=http)
            with self.assertRaisesMessage(
                DummyJSONResponseError,
                "empty page before the declared total",
            ):
                client.fetch_all_products(page_size=2)

    def test_rejects_duplicate_product_ids(self):
        transport = httpx.MockTransport(
            lambda request: httpx.Response(
                200,
                json={
                    "products": [product_payload(1), product_payload(1)],
                    "total": 2,
                    "skip": 0,
                    "limit": 2,
                },
            )
        )
        with httpx.Client(base_url="https://dummyjson.test", transport=transport) as http:
            client = DummyJSONClient(client=http)
            with self.assertRaisesMessage(
                DummyJSONResponseError,
                "Duplicate external product id",
            ):
                client.fetch_all_products(page_size=2)

    def test_wraps_http_errors_without_exposing_response_body(self):
        transport = httpx.MockTransport(
            lambda request: httpx.Response(503, json={"internal": "details"})
        )
        with httpx.Client(base_url="https://dummyjson.test", transport=transport) as http:
            client = DummyJSONClient(client=http)
            with self.assertRaisesMessage(
                DummyJSONTransportError,
                "could not be reached",
            ):
                client.fetch_all_products(page_size=2)

    def test_rejects_invalid_json(self):
        transport = httpx.MockTransport(
            lambda request: httpx.Response(200, content=b"not-json")
        )
        with httpx.Client(base_url="https://dummyjson.test", transport=transport) as http:
            client = DummyJSONClient(client=http)
            with self.assertRaisesMessage(
                DummyJSONResponseError,
                "invalid JSON",
            ):
                client.fetch_all_products(page_size=2)
