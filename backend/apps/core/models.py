from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class StoreSettings(models.Model):
    """Store-wide commercial configuration, editable by the staff panel.

    A single row, so the value can change in production without a redeploy.
    `FREE_SHIPPING_MINIMUM` only seeds the first row and is ignored afterwards.
    """

    SINGLETON_PK = 1

    free_shipping_minimum = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=(MinValueValidator(Decimal("0.01")),),
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "configuração da loja"
        verbose_name_plural = "configurações da loja"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(id=1),
                name="core_storesettings_is_singleton",
            ),
            models.CheckConstraint(
                condition=models.Q(free_shipping_minimum__gt=0),
                name="core_storesettings_free_shipping_minimum_positive",
            ),
        ]

    def save(self, *args, **kwargs):
        self.pk = self.SINGLETON_PK
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise NotImplementedError("A configuração da loja não pode ser removida.")

    @classmethod
    def load(cls) -> "StoreSettings":
        instance, _ = cls.objects.get_or_create(
            pk=cls.SINGLETON_PK,
            defaults={"free_shipping_minimum": settings.FREE_SHIPPING_MINIMUM},
        )
        return instance

    def __str__(self) -> str:
        return f"Frete grátis a partir de {self.free_shipping_minimum}"
