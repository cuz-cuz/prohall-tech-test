from typing import Any

import httpx
from django.conf import settings


class DummyJSONError(RuntimeError):
    """Base exception for failures while reading the external catalog."""


class DummyJSONTransportError(DummyJSONError):
    """Raised when the external API cannot be reached successfully."""


class DummyJSONResponseError(DummyJSONError):
    """Raised when the external API returns an invalid contract."""


class DummyJSONClient:
    def __init__(
        self,
        *,
        client: httpx.Client | None = None,
        base_url: str | None = None,
        timeout: float | None = None,
    ) -> None:
        self._owns_client = client is None
        self._client = client or httpx.Client(
            base_url=(base_url or settings.DUMMYJSON_BASE_URL).rstrip("/"),
            timeout=timeout or settings.DUMMYJSON_TIMEOUT_SECONDS,
            headers={
                "Accept": "application/json",
                "User-Agent": "Mosaico/0.1 (+catalog-import)",
            },
        )

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        self.close()

    def fetch_all_products(self, *, page_size: int | None = None) -> list[dict[str, Any]]:
        requested_limit = page_size or settings.DUMMYJSON_PAGE_SIZE
        if isinstance(requested_limit, bool) or not isinstance(requested_limit, int):
            raise ValueError("page_size must be an integer.")
        if requested_limit < 1 or requested_limit > 100:
            raise ValueError("page_size must be between 1 and 100.")

        products: list[dict[str, Any]] = []
        seen_ids: set[int] = set()
        skip = 0
        expected_total: int | None = None

        while True:
            payload = self._fetch_page(limit=requested_limit, skip=skip)
            page_products, page_total, page_skip = self._validate_page(payload)

            if page_skip != skip:
                raise DummyJSONResponseError(
                    f"Unexpected pagination offset: requested {skip}, received {page_skip}."
                )

            if expected_total is None:
                expected_total = page_total
            elif page_total != expected_total:
                raise DummyJSONResponseError(
                    "The product total changed while the catalog was being read."
                )

            if not page_products:
                if skip < page_total:
                    raise DummyJSONResponseError(
                        "The API returned an empty page before the declared total."
                    )
                break

            for product in page_products:
                product_id = product.get("id")
                if isinstance(product_id, bool) or not isinstance(product_id, int):
                    raise DummyJSONResponseError(
                        "Every external product must have an integer id."
                    )
                if product_id in seen_ids:
                    raise DummyJSONResponseError(
                        f"Duplicate external product id received: {product_id}."
                    )
                seen_ids.add(product_id)
                products.append(product)

            skip += len(page_products)
            if skip >= page_total:
                break

        if expected_total is not None and len(products) != expected_total:
            raise DummyJSONResponseError(
                f"Expected {expected_total} products, received {len(products)}."
            )

        return products

    def _fetch_page(self, *, limit: int, skip: int) -> dict[str, Any]:
        try:
            response = self._client.get(
                "/products",
                params={"limit": limit, "skip": skip},
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise DummyJSONTransportError(
                "The DummyJSON product endpoint could not be reached."
            ) from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise DummyJSONResponseError(
                "The DummyJSON product endpoint returned invalid JSON."
            ) from exc

        if not isinstance(payload, dict):
            raise DummyJSONResponseError("The DummyJSON response must be an object.")
        return payload

    @staticmethod
    def _validate_page(
        payload: dict[str, Any],
    ) -> tuple[list[dict[str, Any]], int, int]:
        products = payload.get("products")
        total = payload.get("total")
        skip = payload.get("skip")

        if not isinstance(products, list):
            raise DummyJSONResponseError("The response field 'products' must be a list.")
        if isinstance(total, bool) or not isinstance(total, int) or total < 0:
            raise DummyJSONResponseError(
                "The response field 'total' must be a non-negative integer."
            )
        if isinstance(skip, bool) or not isinstance(skip, int) or skip < 0:
            raise DummyJSONResponseError(
                "The response field 'skip' must be a non-negative integer."
            )
        if not all(isinstance(product, dict) for product in products):
            raise DummyJSONResponseError("Every product must be a JSON object.")

        return products, total, skip
