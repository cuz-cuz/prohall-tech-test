from decimal import Decimal

from rest_framework import serializers

from apps.customers.models import normalize_customer_email

from .models import Order, OrderItem


class StrictSerializer(serializers.Serializer):
    """Reject undeclared input instead of silently accepting sensitive fields."""

    def to_internal_value(self, data):
        if hasattr(data, "keys"):
            unknown_fields = set(data.keys()) - set(self.fields.keys())
            if unknown_fields:
                raise serializers.ValidationError(
                    {
                        field: ["Este campo não é permitido."]
                        for field in sorted(unknown_fields)
                    }
                )
        return super().to_internal_value(data)


class CheckoutCustomerSerializer(StrictSerializer):
    name = serializers.CharField(min_length=2, max_length=150, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)

    def validate_email(self, value):
        return normalize_customer_email(value)


class CheckoutItemSerializer(StrictSerializer):
    listing_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=999)
    expected_unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )


class CheckoutPaymentSerializer(StrictSerializer):
    method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices,
        default=Order.PaymentMethod.CARD,
    )
    card_last_four = serializers.RegexField(r"^\d{4}$", required=False)
    # Simulated Pix outcome, playing the role of the 4242/0000 card digits.
    pix_outcome = serializers.ChoiceField(
        choices=(("paid", "Pago"), ("expired", "Expirado")),
        required=False,
    )

    def validate(self, attrs):
        if attrs["method"] == Order.PaymentMethod.CARD:
            if "pix_outcome" in attrs:
                raise serializers.ValidationError(
                    {"pix_outcome": ["Use este campo somente com Pix."]}
                )
            if "card_last_four" not in attrs:
                raise serializers.ValidationError(
                    {"card_last_four": ["Informe o final fictício do cartão."]}
                )
        else:
            if "card_last_four" in attrs:
                raise serializers.ValidationError(
                    {"card_last_four": ["Pix não usa dados de cartão."]}
                )
            if "pix_outcome" not in attrs:
                raise serializers.ValidationError(
                    {"pix_outcome": ["Informe o resultado simulado do Pix."]}
                )
        return attrs


class CheckoutSerializer(StrictSerializer):
    customer = CheckoutCustomerSerializer()
    items = CheckoutItemSerializer(many=True, min_length=1, max_length=50)
    payment = CheckoutPaymentSerializer()
    idempotency_key = serializers.UUIDField()

    def validate_items(self, value):
        listing_ids = [item["listing_id"] for item in value]
        if len(listing_ids) != len(set(listing_ids)):
            raise serializers.ValidationError(
                "Cada produto deve aparecer apenas uma vez no checkout."
            )
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    listing_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "listing_id",
            "listing_title",
            "product_external_id",
            "sku",
            "unit_price",
            "quantity",
            "subtotal",
            "image_url",
        )


class OrderSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "public_id",
            "status",
            "payment_status",
            "payment_method",
            "subtotal",
            "product_discount",
            "pix_discount",
            "shipping_fee",
            "shipping_saved",
            "total",
            "payment_last_four",
            "customer",
            "items",
            "created_at",
        )

    def get_customer(self, order):
        # The name is the snapshot taken at checkout, so renaming the account
        # never relabels past orders. The e-mail is the account identity and
        # cannot change without becoming a different customer.
        return {"name": order.customer_name, "email": order.customer.email}


class CustomerAccessRequestSerializer(StrictSerializer):
    email = serializers.EmailField(max_length=254)

    def validate_email(self, value):
        return normalize_customer_email(value)


class CustomerAccessVerifySerializer(CustomerAccessRequestSerializer):
    code = serializers.RegexField(r"^\d{6}$")
