from django.db import models


def normalize_customer_email(value: str) -> str:
    return value.strip().casefold()


class Customer(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name", "id")

    def save(self, *args, **kwargs):
        self.name = self.name.strip()
        self.email = normalize_customer_email(self.email)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"
