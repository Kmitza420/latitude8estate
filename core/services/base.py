"""
Shared helpers for the service layer.

Services sit between the Pydantic DTOs and the ORM. The one non-obvious job
they have is getting a validated payload into columns of two different
kinds — ordinary scalar columns, which want Python values, and JSONB
columns, which want JSON-safe ones.
"""

from __future__ import annotations

from pydantic import BaseModel


def to_columns(payload: BaseModel, jsonb_fields: set[str]) -> dict:
    """Turn a ``*Create``/``*Update`` DTO into keyword arguments for a repository.

    ``model_dump()`` alone is not enough. In Python mode a ``Decimal`` stays a
    ``Decimal`` and a ``date`` stays a ``date`` — correct for a ``Numeric`` or
    ``Date`` column, wrong for JSONB, which cannot hold either. In JSON mode
    every value becomes JSON-safe — correct for JSONB, but it would hand a
    string to every scalar column and rely on the driver to cast it back.

    So: dump in Python mode for the scalars, then re-dump just the named JSONB
    fields in JSON mode.

    Args:
        payload:      A validated DTO. ``exclude_unset`` is applied, so a
                      partial ``*Update`` only touches the fields it names.
        jsonb_fields: Names of the fields backed by JSONB columns.

    Returns:
        A dict of column names to values, ready to splat into
        ``repository.create(**values)`` or ``repository.update(pk, **values)``.
    """
    values = payload.model_dump(exclude_unset=True)

    for name in jsonb_fields & values.keys():
        attribute = getattr(payload, name)
        if attribute is None:
            values[name] = None
        elif isinstance(attribute, list):
            values[name] = [item.model_dump(mode="json") for item in attribute]
        else:
            values[name] = attribute.model_dump(mode="json")

    return values
