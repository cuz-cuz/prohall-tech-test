from django.contrib import admin

from .models import Customer, CustomerAccessCode


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "email")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("name", "id")


@admin.register(CustomerAccessCode)
class CustomerAccessCodeAdmin(admin.ModelAdmin):
    list_display = ("customer", "expires_at", "used_at", "attempt_count", "created_at")
    list_filter = ("used_at",)
    search_fields = ("customer__email", "customer__name")
    readonly_fields = ("customer", "code_hash", "expires_at", "used_at", "attempt_count", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
