def product_payload(product_id=1, **overrides):
    payload = {
        "id": product_id,
        "title": f"Produto {product_id}",
        "description": "Descrição do produto",
        "category": "beauty",
        "brand": "Mosaico Test",
        "sku": f"SKU-{product_id}",
        "price": 19.9,
        "discountPercentage": 5.5,
        "stock": 8,
        "availabilityStatus": "In Stock",
        "thumbnail": "https://example.com/thumb.png",
        "images": ["https://example.com/image.png"],
    }
    payload.update(overrides)
    return payload
