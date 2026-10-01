from dataclasses import dataclass
from datetime import timedelta
from io import StringIO

from django.conf import settings
from django.core.management import call_command
from django.db import connection, transaction
from django.utils import timezone

from apps.catalog.models import Banner, ImportedProduct, Listing, Menu, MenuListing
from apps.catalog.services.importer import persist_products, prepare_products
from apps.core.models import DemoResetState, StoreSettings
from apps.customers.models import Customer, CustomerAccessCode
from apps.orders.models import Order, OrderItem


RESET_CONFIRMATION = "RESTAURAR DEMONSTRAÇÃO"
RESET_LEASE_MINUTES = 15


class DemoResetUnavailable(RuntimeError):
    pass


class DemoResetInProgress(RuntimeError):
    pass


@dataclass(frozen=True)
class DemoResetCooldown(RuntimeError):
    retry_after: int


def reset_status():
    state = DemoResetState.objects.get(pk=DemoResetState.SINGLETON_PK)
    now = timezone.now()
    retry_after = _retry_after(state, now)
    return {
        "enabled": settings.DEMO_RESET_ENABLED,
        "running": bool(state.locked_until and state.locked_until > now),
        "can_reset": bool(
            settings.DEMO_RESET_ENABLED
            and not (state.locked_until and state.locked_until > now)
            and retry_after == 0
        ),
        "confirmation_phrase": RESET_CONFIRMATION,
        "cooldown_seconds": settings.DEMO_RESET_COOLDOWN_SECONDS,
        "retry_after": retry_after,
        "last_reset_at": state.last_reset_at,
        "last_reset_by": state.last_reset_by,
        "last_summary": state.last_summary,
    }


def restore_demo(*, username: str):
    if not settings.DEMO_RESET_ENABLED:
        raise DemoResetUnavailable

    _claim_lease()
    try:
        # The source is fully downloaded and validated before destructive work.
        prepared = prepare_products()
        with transaction.atomic():
            _lock_business_tables()
            state = DemoResetState.objects.select_for_update().get(
                pk=DemoResetState.SINGLETON_PK
            )
            removed = {
                "orders_removed": Order.objects.count(),
                "customers_removed": Customer.objects.count(),
                "listings_removed": Listing.objects.count(),
                "menus_removed": Menu.objects.count(),
                "banners_removed": Banner.objects.count(),
                "products_removed": ImportedProduct.objects.count(),
            }

            Order.objects.all().delete()
            Customer.objects.all().delete()
            Menu.objects.all().delete()
            Banner.objects.all().delete()
            Listing.objects.all().delete()
            ImportedProduct.objects.all().delete()

            store_settings = StoreSettings.load()
            store_settings.free_shipping_minimum = settings.FREE_SHIPPING_MINIMUM
            store_settings.save(update_fields=("free_shipping_minimum", "updated_at"))

            imported = persist_products(prepared)
            call_command("seed_demo", skip_admin=True, stdout=StringIO())

            summary = {
                **removed,
                "products_imported": imported.total,
                "products_skipped": imported.skipped,
                "listings_created": Listing.objects.count(),
                "menus_created": Menu.objects.count(),
                "banners_created": Banner.objects.count(),
            }
            completed_at = timezone.now()
            state.locked_until = None
            state.last_reset_at = completed_at
            state.last_reset_by = username
            state.last_summary = summary
            state.save(
                update_fields=(
                    "locked_until",
                    "last_reset_at",
                    "last_reset_by",
                    "last_summary",
                )
            )
            return {**summary, "completed_at": completed_at}
    except Exception:
        _release_lease()
        raise


def _claim_lease():
    now = timezone.now()
    with transaction.atomic():
        state = DemoResetState.objects.select_for_update().get(
            pk=DemoResetState.SINGLETON_PK
        )
        if state.locked_until and state.locked_until > now:
            raise DemoResetInProgress
        retry_after = _retry_after(state, now)
        if retry_after:
            raise DemoResetCooldown(retry_after)
        state.locked_until = now + timedelta(minutes=RESET_LEASE_MINUTES)
        state.save(update_fields=("locked_until",))


def _release_lease():
    DemoResetState.objects.filter(pk=DemoResetState.SINGLETON_PK).update(
        locked_until=None
    )


def _retry_after(state, now):
    if state.last_reset_at is None:
        return 0
    elapsed = (now - state.last_reset_at).total_seconds()
    return max(0, int(settings.DEMO_RESET_COOLDOWN_SECONDS - elapsed + 0.999))


def _lock_business_tables():
    """Prevent checkout or panel writes from interleaving with the reset."""

    if connection.vendor != "postgresql":
        return
    models = (
        OrderItem,
        Order,
        CustomerAccessCode,
        Customer,
        MenuListing,
        Menu,
        Banner,
        Listing,
        ImportedProduct,
        StoreSettings,
    )
    tables = ", ".join(
        connection.ops.quote_name(model._meta.db_table) for model in models
    )
    with connection.cursor() as cursor:
        cursor.execute(f"LOCK TABLE {tables} IN ACCESS EXCLUSIVE MODE")
