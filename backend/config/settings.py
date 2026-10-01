import os
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlparse

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


def env_decimal(name: str, default: str) -> Decimal:
    try:
        return Decimal(os.getenv(name, default))
    except InvalidOperation as exc:
        raise ImproperlyConfigured(f"{name} must be a decimal number.") from exc


DEBUG = env_bool("DEBUG", default=True)
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-local-development-only")

if not DEBUG and SECRET_KEY == "django-insecure-local-development-only":
    raise ImproperlyConfigured("SECRET_KEY must be set when DEBUG is false.")

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")

if not DEBUG and not os.getenv("ALLOWED_HOSTS", "").strip():
    raise ImproperlyConfigured("ALLOWED_HOSTS must be set when DEBUG is false.")
if not DEBUG and "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured("ALLOWED_HOSTS cannot contain * when DEBUG is false.")


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "corsheaders",
    "rest_framework",
    "apps.core.apps.CoreConfig",
    "apps.catalog.apps.CatalogConfig",
    "apps.storefront.apps.StorefrontConfig",
    "apps.customers.apps.CustomersConfig",
    "apps.orders.apps.OrdersConfig",
    "apps.backoffice.apps.BackofficeConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

if not DEBUG:
    MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


DATABASES = {
    "default": dj_database_url.config(
        default="postgresql://mosaico:mosaico_dev@localhost:5432/mosaico",
        conn_max_age=600,
        conn_health_checks=True,
    )
}


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True


STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS", "http://localhost:5173"
)

if not DEBUG:
    if not os.getenv("CORS_ALLOWED_ORIGINS", "").strip():
        raise ImproperlyConfigured(
            "CORS_ALLOWED_ORIGINS must be set when DEBUG is false."
        )
    if not os.getenv("CSRF_TRUSTED_ORIGINS", "").strip():
        raise ImproperlyConfigured(
            "CSRF_TRUSTED_ORIGINS must be set when DEBUG is false."
        )
    insecure_origins = [
        origin
        for origin in CORS_ALLOWED_ORIGINS + CSRF_TRUSTED_ORIGINS
        if not origin.startswith("https://")
    ]
    if insecure_origins:
        raise ImproperlyConfigured(
            "CORS and CSRF origins must use HTTPS when DEBUG is false."
        )

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = os.getenv("CSRF_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SECURE = not DEBUG

valid_same_site_values = {"Lax", "Strict", "None"}
if SESSION_COOKIE_SAMESITE not in valid_same_site_values:
    raise ImproperlyConfigured(
        "SESSION_COOKIE_SAMESITE must be Lax, Strict or None."
    )
if CSRF_COOKIE_SAMESITE not in valid_same_site_values:
    raise ImproperlyConfigured(
        "CSRF_COOKIE_SAMESITE must be Lax, Strict or None."
    )
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", default=not DEBUG)
# O healthcheck do Railway chama o container por HTTP interno e trata 301 como falha.
SECURE_REDIRECT_EXEMPT = [r"^api/health/$"]
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool(
    "SECURE_HSTS_INCLUDE_SUBDOMAINS", default=False
)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", default=False)


REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"]
    + (["rest_framework.renderers.BrowsableAPIRenderer"] if DEBUG else []),
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
}


DUMMYJSON_BASE_URL = os.getenv("DUMMYJSON_BASE_URL", "https://dummyjson.com")
DUMMYJSON_TIMEOUT_SECONDS = float(os.getenv("DUMMYJSON_TIMEOUT_SECONDS", "20"))
DUMMYJSON_PAGE_SIZE = int(os.getenv("DUMMYJSON_PAGE_SIZE", "50"))

FREE_SHIPPING_MINIMUM = env_decimal("FREE_SHIPPING_MINIMUM", "199.00")
PIX_DISCOUNT_PERCENT = env_decimal("PIX_DISCOUNT_PERCENT", "10.00")
# Flat simulated delivery fee, waived once the order reaches the free shipping minimum.
SHIPPING_FEE = env_decimal("SHIPPING_FEE", "19.90")
MAX_INSTALLMENTS = int(os.getenv("MAX_INSTALLMENTS", "12"))

if FREE_SHIPPING_MINIMUM <= 0:
    raise ImproperlyConfigured("FREE_SHIPPING_MINIMUM must be greater than zero.")
if not Decimal("0") <= PIX_DISCOUNT_PERCENT < Decimal("100"):
    raise ImproperlyConfigured("PIX_DISCOUNT_PERCENT must be between 0 and 100.")
if SHIPPING_FEE < 0:
    raise ImproperlyConfigured("SHIPPING_FEE cannot be negative.")
if MAX_INSTALLMENTS < 1:
    raise ImproperlyConfigured("MAX_INSTALLMENTS must be at least one.")

DEMO_ADMIN_USERNAME = os.getenv("DEMO_ADMIN_USERNAME", "admin")
DEMO_ADMIN_EMAIL = os.getenv("DEMO_ADMIN_EMAIL", "admin@mosaico.local")
DEMO_ADMIN_PASSWORD = os.getenv("DEMO_ADMIN_PASSWORD", "")
DEMO_RESET_ENABLED = env_bool("DEMO_RESET_ENABLED", default=False)
DEMO_RESET_COOLDOWN_SECONDS = int(os.getenv("DEMO_RESET_COOLDOWN_SECONDS", "600"))
if DEMO_RESET_COOLDOWN_SECONDS < 0:
    raise ImproperlyConfigured("DEMO_RESET_COOLDOWN_SECONDS cannot be negative.")

R2_MEDIA_ENABLED = env_bool("R2_MEDIA_ENABLED", default=False)
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "").strip()
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "").strip()
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "").strip()
R2_PUBLIC_BASE_URL = os.getenv("R2_PUBLIC_BASE_URL", "").strip().rstrip("/")
R2_MAX_UPLOAD_BYTES = int(os.getenv("R2_MAX_UPLOAD_BYTES", str(8 * 1024 * 1024)))
R2_MAX_IMAGE_PIXELS = int(os.getenv("R2_MAX_IMAGE_PIXELS", "40000000"))

if R2_MAX_UPLOAD_BYTES < 1 or R2_MAX_IMAGE_PIXELS < 1:
    raise ImproperlyConfigured("R2 upload limits must be positive integers.")
if R2_MEDIA_ENABLED:
    r2_required = {
        "R2_ACCOUNT_ID": R2_ACCOUNT_ID,
        "R2_ACCESS_KEY_ID": R2_ACCESS_KEY_ID,
        "R2_SECRET_ACCESS_KEY": R2_SECRET_ACCESS_KEY,
        "R2_BUCKET_NAME": R2_BUCKET_NAME,
        "R2_PUBLIC_BASE_URL": R2_PUBLIC_BASE_URL,
    }
    missing_r2 = [name for name, value in r2_required.items() if not value]
    if missing_r2:
        raise ImproperlyConfigured(
            f"Missing R2 media settings: {', '.join(missing_r2)}."
        )
    public_media_url = urlparse(R2_PUBLIC_BASE_URL)
    valid_schemes = {"http", "https"} if DEBUG else {"https"}
    if public_media_url.scheme not in valid_schemes or not public_media_url.netloc:
        raise ImproperlyConfigured(
            "R2_PUBLIC_BASE_URL must be a valid public HTTPS URL in production."
        )
    if public_media_url.path not in {"", "/"} or public_media_url.params or public_media_url.query or public_media_url.fragment:
        raise ImproperlyConfigured("R2_PUBLIC_BASE_URL must not contain a path, query or fragment.")

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND", "django.core.mail.backends.locmem.EmailBackend"
)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "no-reply@example.com")
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = env_bool("EMAIL_USE_SSL", default=False)

if not DEBUG and EMAIL_BACKEND == "django.core.mail.backends.locmem.EmailBackend":
    raise ImproperlyConfigured(
        "Configure um backend de e-mail de produção para liberar o acesso do cliente."
    )
if (
    EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
    and not EMAIL_HOST
):
    raise ImproperlyConfigured("EMAIL_HOST é obrigatório para o backend SMTP.")

REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "customer_access_request": "3/hour",
    "customer_access_verify": "10/hour",
}
