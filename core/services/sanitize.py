"""
HTML sanitisation for author-supplied blog content.

``Blog.content`` is rendered into the page unescaped — the article template
uses Astro's ``set:html``. That makes this module the site's XSS trust
boundary, and it is the only thing standing on it.

Sanitisation runs on **write** (so the database never holds a payload) and
again on **read** (so a row written before this existed, or by some other
path, still cannot reach a browser intact). Neither pass is redundant: the
write pass keeps the store clean, the read pass makes the guarantee hold
regardless of how the row got there.

The allowlist is deliberately small — it is what the article layout styles
and nothing more. ``nh3`` drops every tag and attribute not named here,
along with every event handler and any ``javascript:`` URL, by construction
rather than by pattern-matching.
"""

from __future__ import annotations

import nh3

#: Tags an article body may use. ``figure``/``figcaption`` are what a
#: full-bleed image interruption is written as, and ``img`` is what it holds.
ALLOWED_TAGS: set[str] = {
    "p",
    "br",
    "hr",
    "h2",
    "h3",
    "h4",
    "em",
    "i",
    "strong",
    "b",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "figure",
    "figcaption",
    "img",
    "span",
}

#: Attributes allowed per tag. ``class`` is permitted on the few elements the
#: stylesheet hooks onto; it is not a general-purpose escape hatch.
#:
#: ``rel`` is deliberately absent from ``a``: ``link_rel`` below sets it on
#: every link, and ammonia refuses (loudly) to do both — an author-supplied
#: ``rel`` would otherwise be able to override the one we add.
ALLOWED_ATTRIBUTES: dict[str, set[str]] = {
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "loading", "width", "height"},
    "figure": {"class"},
    "figcaption": {"class"},
    "p": {"class"},
    "span": {"class"},
    "blockquote": {"class"},
}

#: Everything else — ``javascript:``, ``data:`` and friends — is stripped.
ALLOWED_URL_SCHEMES: set[str] = {"http", "https", "mailto"}


def sanitize_html(html: str | None) -> str | None:
    """Return *html* with everything outside the allowlist removed.

    Args:
        html: Untrusted HTML, or ``None``.

    Returns:
        Sanitised HTML, or ``None`` if the input was ``None``.
    """
    if html is None:
        return None

    return nh3.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=ALLOWED_URL_SCHEMES,
        link_rel="noopener noreferrer",
        strip_comments=True,
    )
