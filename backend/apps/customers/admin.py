from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "email")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("name", "id")
