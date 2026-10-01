from dataclasses import dataclass
from uuid import uuid4

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.utils import timezone
from PIL import Image, UnidentifiedImageError


IMAGE_FORMATS = {
    "JPEG": ("jpg", "image/jpeg"),
    "PNG": ("png", "image/png"),
    "WEBP": ("webp", "image/webp"),
}


class MediaStorageUnavailable(Exception):
    pass


class MediaUploadError(Exception):
    pass


@dataclass(frozen=True)
class ImageMetadata:
    extension: str
    content_type: str
    width: int
    height: int


@dataclass(frozen=True)
class StoredImage:
    url: str
    width: int
    height: int


def inspect_image(uploaded_file) -> ImageMetadata:
    try:
        uploaded_file.seek(0)
        with Image.open(uploaded_file) as image:
            image_format = image.format
            width, height = image.size
            image.verify()
    except (Image.DecompressionBombError, UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValueError("Envie uma imagem JPEG, PNG ou WebP válida.") from exc
    finally:
        uploaded_file.seek(0)

    if image_format not in IMAGE_FORMATS:
        raise ValueError("Envie uma imagem JPEG, PNG ou WebP.")
    if width < 1 or height < 1 or width * height > settings.R2_MAX_IMAGE_PIXELS:
        raise ValueError("A imagem possui dimensões maiores que o limite permitido.")

    extension, content_type = IMAGE_FORMATS[image_format]
    return ImageMetadata(extension, content_type, width, height)


def upload_image(uploaded_file) -> StoredImage:
    if not settings.R2_MEDIA_ENABLED:
        raise MediaStorageUnavailable("O armazenamento de mídias ainda não está configurado.")

    metadata = inspect_image(uploaded_file)
    key = f"banners/{timezone.now():%Y/%m}/{uuid4().hex}.{metadata.extension}"
    client = boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )

    try:
        client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=key,
            Body=uploaded_file,
            ContentLength=uploaded_file.size,
            ContentType=metadata.content_type,
            CacheControl="public, max-age=31536000, immutable",
        )
    except (BotoCoreError, ClientError) as exc:
        raise MediaUploadError("Não foi possível enviar a imagem ao armazenamento.") from exc

    return StoredImage(
        url=f"{settings.R2_PUBLIC_BASE_URL}/{key}",
        width=metadata.width,
        height=metadata.height,
    )
