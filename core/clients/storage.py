"""
Object storage (MinIO) client and public URL resolution.

Two distinct concerns live here:

``public_url``
    Pure string arithmetic, no network. The database stores *object keys*
    (``projects/sunrise/hero.jpg``), never absolute URLs, because the host
    a browser should use changes between local development, docker-compose
    and production. Resolving on read means the same row serves the right
    URL everywhere, and it is the reason ``MINIO_PUBLIC_BASE_URL`` exists
    in :mod:`core.settings`.

:class:`ObjectStorage`
    A thin wrapper over the MinIO SDK for the write side (the CRM, and
    anything that uploads). The public read API never constructs one — it
    only calls ``public_url`` — so a MinIO outage cannot take the website
    down with it.
"""

from __future__ import annotations

import io
import json

from minio import Minio

from core.settings import settings

_ABSOLUTE_PREFIXES = ("http://", "https://", "//", "data:")


def public_url(key: str) -> str:
    """Resolve a stored object key to an absolute, browser-reachable URL.

    A key that is already absolute is returned untouched, which lets a row
    point at an externally hosted image without a special case at the call
    site.

    Args:
        key: An object key within the public bucket, or an absolute URL.

    Returns:
        An absolute URL a browser can fetch.
    """
    if key.startswith(_ABSOLUTE_PREFIXES):
        return key

    base = settings.MINIO_PUBLIC_BASE_URL.strip().rstrip("/")
    if not base:
        # No explicit public base configured — address the bucket directly on
        # whichever endpoint the browser can reach.
        endpoint = settings.MINIO_EXTERNAL_ENDPOINT.strip() or settings.MINIO_ENDPOINT
        secure = (
            settings.MINIO_EXTERNAL_SECURE
            if settings.MINIO_EXTERNAL_ENDPOINT.strip()
            else settings.MINIO_SECURE
        )
        scheme = "https" if secure else "http"
        base = f"{scheme}://{endpoint}/{settings.MINIO_PUBLIC_BUCKET}"

    return f"{base}/{key.lstrip('/')}"


class ObjectStorage:
    """Manages MinIO buckets and objects.

    Typical usage::

        storage = ObjectStorage()
        storage.ensure_bucket(public=True)
        key = storage.put_object("projects/sunrise/hero.jpg", data, "image/jpeg")
    """

    def __init__(
        self,
        endpoint: str | None = None,
        access_key: str | None = None,
        secret_key: str | None = None,
        bucket: str | None = None,
        secure: bool | None = None,
    ):
        """Initialise the storage client.

        Args:
            endpoint:   ``host:port`` of the MinIO server.
            access_key: MinIO access key.
            secret_key: MinIO secret key.
            bucket:     Bucket this instance reads and writes.
            secure:     Whether to use TLS.
        """
        self.bucket = bucket or settings.MINIO_PUBLIC_BUCKET
        self.client = Minio(
            endpoint or settings.MINIO_ENDPOINT,
            access_key=access_key or settings.MINIO_ACCESS_KEY,
            secret_key=secret_key or settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE if secure is None else secure,
        )

    def ensure_bucket(self, public_read: bool = True) -> None:
        """Create the bucket if it does not already exist.

        Args:
            public_read: Grant anonymous ``GetObject`` on the bucket. This is
                what makes :func:`public_url` actually resolve in a browser —
                a new MinIO bucket is private, so without it every image 403s.
                Pass ``False`` for a private bucket (documents behind signed
                URLs, for instance).
        """
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

        if public_read:
            self.client.set_bucket_policy(self.bucket, json.dumps(self._public_read_policy()))

    def _public_read_policy(self) -> dict:
        """An anonymous read-only policy for this bucket."""
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{self.bucket}/*"],
                }
            ],
        }

    def put_object(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload an object and return the key it was stored under.

        Args:
            key:          Object key within the bucket.
            data:         Raw object bytes.
            content_type: MIME type recorded on the object.

        Returns:
            The object key, ready to be stored on a ``MediaRef``.
        """
        self.client.put_object(
            self.bucket,
            key,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return key

    def remove_object(self, key: str) -> None:
        """Delete an object from the bucket."""
        self.client.remove_object(self.bucket, key)

    def presigned_url(self, key: str, expires_seconds: int = 3600) -> str:
        """Return a signed, expiring URL for an object in a *private* bucket.

        Used for anything that should not be publicly crawlable — floor plans
        and brochures on a private listing, for example. Public media should
        go through :func:`public_url` instead, which costs no round trip.
        """
        from datetime import timedelta

        return self.client.presigned_get_object(
            self.bucket, key, expires=timedelta(seconds=expires_seconds)
        )
