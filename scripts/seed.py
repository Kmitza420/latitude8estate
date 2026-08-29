"""
Create the schema and populate it with a representative catalogue.

Run from the repository root::

    python -m scripts.seed              # create tables, seed if empty
    python -m scripts.seed --reset      # drop everything first
    python -m scripts.seed --no-media   # skip the MinIO upload

The seed is deliberately varied rather than uniform, because it doubles as
the fixture the website is verified against. It contains a project with no
price and no tagline (so the "unset" paths render), a draft and an archived
post (so the published-only filter has something to exclude), and one
article whose body carries a full-bleed ``<figure>`` (so the in-content
image interruption has something to lay out).

**Media.** Every image is stored the way production stores it — as a MinIO
object key on a ``MediaRef``, never as an absolute URL — and this script
uploads a branded SVG placeholder for each key so the whole path
(key → :func:`core.clients.storage.public_url` → browser) actually resolves.
If MinIO is unreachable the rows are still written; the images simply will
not load until real ones are uploaded under the same keys.

Schema management is ``create_all`` for now. A migration tool (Alembic) is
the right answer once the schema stops moving; this is not a substitute for
one, and it will not alter an existing table.
"""

from __future__ import annotations

import argparse
import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from xml.sax.saxutils import escape

from core.clients.db import Database
from core.clients.storage import ObjectStorage, public_url
from core.models.dto import (
    AccessFeatures,
    AgentCreate,
    AreaUnit,
    AuthorCreate,
    BlogCreate,
    BlogStatus,
    CategoryCreate,
    DocumentRef,
    Facilities,
    Features,
    GardenFeatures,
    InteriorSpaces,
    LoungeFeatures,
    MediaRef,
    NearbyPlace,
    NearbyPlaces,
    OutdoorSpaces,
    ParkingFeatures,
    PoolFeatures,
    ProjectCreate,
    ProjectFeatures,
    ProjectLocation,
    ProjectStatus,
    ProjectType,
    SecurityFeatures,
    Spaces,
    TerraceFeatures,
    WellnessFeatures,
)
from core.repositories.agent_repository import AgentRepository
from core.repositories.author_repository import AuthorRepository
from core.repositories.blog_repository import BlogRepository
from core.repositories.category_repository import CategoryRepository
from core.repositories.project_repository import ProjectRepository
from core.services.base import to_columns
from core.services.blog_service import BlogService
from core.services.category_service import CategoryService
from core.services.project_service import ProjectService
from core.settings import settings

logger = logging.getLogger("seed")

NOW = datetime.now(timezone.utc)

# Brand palette, from the design brief.
GREEN = "#06362D"
GOLD = "#9A7B36"
CREAM = "#F9F6F0"
SAND = "#EADCC9"


# ── Placeholder artwork ───────────────────────────────────────────────


def placeholder_svg(label: str, subtitle: str, background: str, foreground: str) -> bytes:
    """Render a branded placeholder image.

    SVG rather than a raster format so this needs no image library, and so
    the result stays legible at any size the layout asks for.
    """
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{background}"/>
      <stop offset="100%" stop-color="{foreground}22"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#g)"/>
  <rect x="60" y="60" width="1480" height="880" fill="none" stroke="{foreground}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="120" y="820" font-family="Georgia, serif" font-size="72" fill="{foreground}">{escape(label)}</text>
  <text x="120" y="880" font-family="Helvetica, Arial, sans-serif" font-size="28"
        letter-spacing="6" fill="{foreground}" fill-opacity="0.75">{escape(subtitle.upper())}</text>
</svg>
""".encode("utf-8")


def upload_media(refs: list[tuple[MediaRef, str, str]]) -> bool:
    """Upload a placeholder image for each media reference.

    Args:
        refs: ``(ref, label, subtitle)`` triples. The label is drawn onto the
            placeholder so a page full of images is still readable.

    Returns:
        ``True`` if the upload succeeded, ``False`` if MinIO was unreachable.
    """
    try:
        storage = ObjectStorage()
        storage.ensure_bucket()
    except Exception as exc:  # noqa: BLE001 — any storage failure is non-fatal here
        logger.warning("MinIO unavailable (%s) — seeding rows without uploading images", exc)
        return False

    palettes = [(GREEN, SAND), (SAND, GREEN), (GOLD, CREAM), (CREAM, GREEN)]
    for index, (ref, label, subtitle) in enumerate(refs):
        background, foreground = palettes[index % len(palettes)]
        storage.put_object(
            ref.key,
            placeholder_svg(label, subtitle, background, foreground),
            content_type="image/svg+xml",
        )

    logger.info("Uploaded %d placeholder images to bucket '%s'", len(refs), settings.MINIO_PUBLIC_BUCKET)
    return True


# ── Seed content ──────────────────────────────────────────────────────


def build_agents() -> list[AgentCreate]:
    return [
        AgentCreate(
            name="Suchada Pongsak",
            email="suchada@latitude8estate.com",
            phone="+66 76 555 0148",
            portrait=MediaRef(key="agents/suchada-pongsak.svg", alt="Portrait of Suchada Pongsak, listing agent"),
        ),
        AgentCreate(
            name="Marcus Lindqvist",
            email="marcus@latitude8estate.com",
            phone="+66 76 555 0192",
            portrait=MediaRef(key="agents/marcus-lindqvist.svg", alt="Portrait of Marcus Lindqvist, listing agent"),
        ),
    ]


def build_authors() -> list[AuthorCreate]:
    return [
        AuthorCreate(
            name="Nalinee Charoen",
            email="nalinee@latitude8estate.com",
            bio="Writes on architecture and the coastal property market of southern Thailand.",
            portrait=MediaRef(key="authors/nalinee-charoen.svg", alt="Portrait of Nalinee Charoen, editor"),
        ),
        AuthorCreate(
            name="James Aldridge",
            email="james@latitude8estate.com",
            bio="Former surveyor; covers construction quality, materials and long-term value.",
            portrait=MediaRef(key="authors/james-aldridge.svg", alt="Portrait of James Aldridge, contributing editor"),
        ),
    ]


def build_categories() -> list[CategoryCreate]:
    return [
        CategoryCreate(
            slug="architecture",
            name="Architecture",
            blurb="From tropical modernism to biophilic design, the styles shaping how the coast is built.",
            image=MediaRef(key="categories/architecture.svg", alt="A concrete and timber pavilion opening onto a garden"),
            featured=True,
        ),
        CategoryCreate(
            slug="interiors",
            name="Interiors",
            blurb="Material, light and proportion: how the best rooms on the island are composed.",
            image=MediaRef(key="categories/interiors.svg", alt="A naturally lit living room in muted, sandy tones"),
            featured=True,
        ),
        CategoryCreate(
            slug="lifestyle",
            name="Lifestyle",
            blurb="The rituals, places and objects that define life inside an exceptional home.",
            image=MediaRef(key="categories/lifestyle.svg", alt="A shaded terrace set for lunch above the sea"),
            featured=True,
        ),
        CategoryCreate(
            slug="sustainability",
            name="Sustainability",
            blurb="Renewable systems, low-carbon materials and the quiet craft of building well.",
            image=MediaRef(key="categories/sustainability.svg", alt="Solar panels set into a planted roof"),
            featured=True,
        ),
        CategoryCreate(
            slug="market",
            name="Market",
            blurb="Where value is moving across Phuket, Samui and the Andaman coast.",
            image=MediaRef(key="categories/market.svg", alt="An aerial view of a developing coastline"),
        ),
        CategoryCreate(
            slug="technology",
            name="Technology",
            blurb="The systems disappearing into the fabric of the modern estate.",
            image=MediaRef(key="categories/technology.svg", alt="A concealed control panel set flush into a plaster wall"),
        ),
    ]


def _villa_features(bedrooms: int, bathrooms: int, *, sea_view: bool = True) -> ProjectFeatures:
    return ProjectFeatures(
        facilities=Facilities(
            pool=PoolFeatures(available=True, private=True, deck=True, shower=True),
            wellness=WellnessFeatures(sauna=sea_view, spa=False),
            lounge=LoungeFeatures(available=True, indoor=True, outdoor=True),
            security=SecurityFeatures(security_24_7=True, cctv=True),
            parking=ParkingFeatures(available=True, garage=True),
        ),
        spaces=Spaces(
            interior=InteriorSpaces(
                living_room=True,
                dining_area=True,
                kitchen=True,
                master_bedroom=True,
                guest_bedrooms=bedrooms - 1,
                bathrooms=bathrooms,
                walk_in_wardrobe=True,
                laundry=True,
                storage=True,
                staff_room=True,
            ),
            outdoor=OutdoorSpaces(
                garden=GardenFeatures(available=True, private=True, tropical=True),
                pool_area=True,
                terrace=TerraceFeatures(available=True, covered=True, sea_view=sea_view),
                lounge=LoungeFeatures(available=True, outdoor=True),
                outdoor_dining=True,
                outdoor_kitchen=True,
                sala=True,
                walking_paths=True,
            ),
        ),
        features=Features(
            air_conditioning=True,
            smart_home=True,
            bbq=True,
            jacuzzi=sea_view,
            wine_cellar=sea_view,
            automatic_gate=True,
            kitchen_appliances=["Gaggenau oven", "Sub-Zero refrigeration", "Wine cabinet"],
        ),
        nearby=NearbyPlaces(
            airports=[NearbyPlace(name="Phuket International Airport", distance_m=28400)],
            international_schools=[NearbyPlace(name="UWC Thailand", distance_m=9200)],
            shopping_centers=[NearbyPlace(name="Boat Avenue", distance_m=3100)],
            golf_courses=[NearbyPlace(name="Laguna Golf Phuket", distance_m=5400)],
            marinas=[NearbyPlace(name="Royal Phuket Marina", distance_m=18700)],
            tourist_attractions=[NearbyPlace(name="Bang Tao Beach", distance_m=850)],
        ),
    )


def _condo_features(units: int) -> ProjectFeatures:
    return ProjectFeatures(
        facilities=Facilities(
            pool=PoolFeatures(available=True, children=True, deck=True, shower=True),
            fitness_center=True,
            wellness=WellnessFeatures(sauna=True, spa=True),
            kids_club=True,
            cinema=True,
            library=True,
            gaming_room=units > 90,
            lounge=LoungeFeatures(available=True, indoor=True, rooftop=True),
            security=SecurityFeatures(security_24_7=True, cctv=True),
            access=AccessFeatures(key_card=True, lobby_reception=True),
            parking=ParkingFeatures(available=True, garage=True),
        ),
        spaces=Spaces(
            interior=InteriorSpaces(
                living_room=True,
                dining_area=True,
                kitchen=True,
                master_bedroom=True,
                guest_bedrooms=1,
                bathrooms=2,
                walk_in_wardrobe=True,
                laundry=True,
                storage=True,
            ),
            outdoor=OutdoorSpaces(
                pool_area=True,
                terrace=TerraceFeatures(available=True, rooftop=True, sea_view=True),
                lounge=LoungeFeatures(available=True, rooftop=True, outdoor=True),
                outdoor_dining=True,
                children_area=True,
                walking_paths=True,
            ),
        ),
        features=Features(
            air_conditioning=True,
            smart_home=True,
            kitchen_appliances=["Bosch induction hob", "Integrated dishwasher"],
        ),
        nearby=NearbyPlaces(
            airports=[NearbyPlace(name="Phuket International Airport", distance_m=31000)],
            international_schools=[NearbyPlace(name="British International School", distance_m=14500)],
            shopping_centers=[NearbyPlace(name="Central Phuket", distance_m=11200)],
            marinas=[NearbyPlace(name="Ao Po Grand Marina", distance_m=22100)],
            tourist_attractions=[NearbyPlace(name="Kata Noi Beach", distance_m=600)],
        ),
    )


def build_projects(agent_ids: list[uuid.UUID]) -> list[ProjectCreate]:
    """Six listings, deliberately uneven so the "unset" render paths are covered."""
    return [
        ProjectCreate(
            project_type=ProjectType.VILLA,
            name="Baan Sawan Reserve",
            slug="baan-sawan-reserve",
            status=ProjectStatus.COMPLETED,
            featured=True,
            tagline="Six headland villas above Bang Tao, each turned to hold the whole western horizon.",
            location=ProjectLocation(
                address="118/4 Moo 3, Cherng Talay",
                district="Thalang",
                city="Phuket",
                country="Thailand",
                latitude=8.0021,
                longitude=98.2954,
            ),
            price_from=Decimal("48500000.00"),
            price_currency="THB",
            floor_area=Decimal("642.00"),
            floor_area_unit=AreaUnit.SQM,
            distance_to_beach_m=850,
            total_units=6,
            total_buildings=6,
            completion_date=date(2024, 11, 30),
            agent_id=agent_ids[0],
            features=_villa_features(bedrooms=5, bathrooms=6),
            media=[
                MediaRef(key="projects/baan-sawan-reserve/hero.svg", alt="A headland villa at dusk, its pool terrace open to the Andaman Sea"),
                MediaRef(key="projects/baan-sawan-reserve/living.svg", alt="A double-height living room framed in dark timber"),
                MediaRef(key="projects/baan-sawan-reserve/pool.svg", alt="An infinity pool meeting the horizon line"),
                MediaRef(key="projects/baan-sawan-reserve/sala.svg", alt="A traditional sala set among tropical planting"),
            ],
            documents=[],
        ),
        ProjectCreate(
            project_type=ProjectType.CONDOMINIUM,
            name="Kata Noi Residences",
            slug="kata-noi-residences",
            status=ProjectStatus.UNDER_CONSTRUCTION,
            featured=True,
            tagline="Ninety-four apartments stepped down a south-facing slope, six minutes on foot from Kata Noi.",
            location=ProjectLocation(
                address="44 Kata Noi Road",
                district="Karon",
                city="Phuket",
                country="Thailand",
                latitude=7.8102,
                longitude=98.2977,
            ),
            price_from=Decimal("9750000.00"),
            price_currency="THB",
            floor_area=Decimal("86.50"),
            floor_area_unit=AreaUnit.SQM,
            distance_to_beach_m=600,
            total_units=94,
            total_buildings=3,
            completion_date=date(2026, 6, 30),
            agent_id=agent_ids[1],
            features=_condo_features(units=94),
            media=[
                MediaRef(key="projects/kata-noi-residences/hero.svg", alt="Three stepped residential buildings on a wooded hillside"),
                MediaRef(key="projects/kata-noi-residences/lobby.svg", alt="A staffed lobby in pale stone and rattan"),
                MediaRef(key="projects/kata-noi-residences/rooftop.svg", alt="A rooftop lounge overlooking the bay"),
            ],
            documents=[],
        ),
        ProjectCreate(
            project_type=ProjectType.VILLA,
            name="Laem Sor Villas",
            slug="laem-sor-villas",
            status=ProjectStatus.COMPLETED,
            featured=True,
            tagline="Four courtyard houses on the quiet south coast of Samui, built around water and shade.",
            location=ProjectLocation(
                address="9/2 Moo 4, Laem Sor",
                district="Taling Ngam",
                city="Koh Samui",
                country="Thailand",
                latitude=9.4051,
                longitude=99.9312,
            ),
            price_from=Decimal("31200000.00"),
            price_currency="THB",
            floor_area=Decimal("410.00"),
            floor_area_unit=AreaUnit.SQM,
            distance_to_beach_m=120,
            total_units=4,
            total_buildings=4,
            completion_date=date(2023, 3, 15),
            agent_id=agent_ids[0],
            features=_villa_features(bedrooms=4, bathrooms=4, sea_view=False),
            media=[
                MediaRef(key="projects/laem-sor-villas/hero.svg", alt="A courtyard house with a reflecting pool at its centre"),
                MediaRef(key="projects/laem-sor-villas/courtyard.svg", alt="A planted internal courtyard in deep shade"),
            ],
            documents=[],
        ),
        ProjectCreate(
            project_type=ProjectType.CONDOMINIUM,
            name="Sirinat Terraces",
            slug="sirinat-terraces",
            status=ProjectStatus.PLANNED,
            tagline="A low-rise development on the northern shoreline, released in two phases from 2027.",
            location=ProjectLocation(
                address="Moo 1, Sakhu",
                district="Thalang",
                city="Phuket",
                country="Thailand",
                latitude=8.1247,
                longitude=98.2938,
            ),
            price_from=Decimal("7400000.00"),
            price_currency="THB",
            floor_area=Decimal("72.00"),
            floor_area_unit=AreaUnit.SQM,
            distance_to_beach_m=310,
            total_units=48,
            total_buildings=4,
            completion_date=date(2027, 12, 31),
            agent_id=agent_ids[1],
            features=_condo_features(units=48),
            media=[
                MediaRef(key="projects/sirinat-terraces/hero.svg", alt="A low-rise development set behind casuarina trees"),
            ],
            documents=[],
        ),
        ProjectCreate(
            project_type=ProjectType.VILLA,
            name="Ao Yon House",
            slug="ao-yon-house",
            status=ProjectStatus.COMPLETED,
            # No tagline and no price: a private resale where neither is
            # published. The site composes a lead from type, place and status
            # rather than printing an invented one.
            location=ProjectLocation(
                address="27 Ao Yon Beach Road",
                district="Wichit",
                city="Phuket",
                country="Thailand",
                latitude=7.8028,
                longitude=98.4139,
            ),
            distance_to_beach_m=40,
            total_units=1,
            total_buildings=1,
            completion_date=date(2019, 8, 1),
            agent_id=agent_ids[0],
            features=_villa_features(bedrooms=3, bathrooms=3),
            media=[
                MediaRef(key="projects/ao-yon-house/hero.svg", alt="A single-storey house set directly behind a quiet beach"),
            ],
            documents=[],
        ),
        ProjectCreate(
            project_type=ProjectType.VILLA,
            name="Naithon Cliff Estate",
            slug="naithon-cliff-estate",
            status=ProjectStatus.UNDER_CONSTRUCTION,
            tagline="A single estate on eleven rai of cliff, with its own beach access cut into the rock.",
            location=ProjectLocation(
                address="Naithon Beach Road",
                district="Thalang",
                city="Phuket",
                country="Thailand",
                latitude=8.0889,
                longitude=98.2704,
            ),
            price_from=Decimal("165000000.00"),
            price_currency="THB",
            floor_area=Decimal("1180.00"),
            floor_area_unit=AreaUnit.SQM,
            distance_to_beach_m=210,
            total_units=1,
            total_buildings=3,
            completion_date=date(2026, 10, 1),
            agent_id=agent_ids[1],
            features=_villa_features(bedrooms=7, bathrooms=8),
            media=[
                MediaRef(key="projects/naithon-cliff-estate/hero.svg", alt="A cliff-top estate above a narrow white beach"),
                MediaRef(key="projects/naithon-cliff-estate/terrace.svg", alt="A cantilevered terrace projecting over the rock face"),
                MediaRef(key="projects/naithon-cliff-estate/pool.svg", alt="A long lap pool cut into the cliff edge"),
            ],
            documents=[
                # Stored as object keys, resolved on read like any other asset.
                # A private listing would want signed URLs instead — see
                # ObjectStorage.presigned_url.
                DocumentRef(
                    title="Site Plan",
                    key="projects/naithon-cliff-estate/site-plan.pdf",
                    size_bytes=2_411_000,
                    content_type="application/pdf",
                ),
                DocumentRef(
                    title="Specification Summary",
                    key="projects/naithon-cliff-estate/specification.pdf",
                    size_bytes=811_000,
                    content_type="application/pdf",
                ),
            ],
        ),
    ]


#: One article carries a full-bleed ``<figure>`` in its body. That is how the
#: image interruption the design calls for is expressed — inside the content,
#: where an editor can place it — rather than as three separate body columns
#: on the table. The ``src`` is resolved through the same media pipeline as
#: every other asset, so it is an absolute URL by the time it is stored.
ARTICLE_WITH_FIGURE = """<p>Concrete has a bad reputation on this coast, and most of it is deserved. Poured
badly, in this humidity, it stains within a season and spalls within five years. Poured
well, with the right aggregate and enough cover over the steel, it is the only material
here that improves with weather.</p>
<p>The difference is almost entirely in the preparation. Formwork that is planned as a
drawing rather than assembled on site produces a surface worth leaving exposed, and a
surface worth leaving exposed removes an entire trade — and an entire maintenance cycle —
from the life of the building.</p>
<h2>Reading a wall</h2>
<p>Look for the tie holes. If they fall on a regular grid that lines up with the openings,
the wall was drawn before it was poured, and everything behind it was probably drawn too.
If they wander, the rest of the house will wander with them.</p>
<figure class="interruption">
  <img src="__FIGURE_URL__" alt="A board-formed concrete wall with the grain of the shuttering still visible" />
  <figcaption>Board-formed concrete at Baan Sawan Reserve, three years after completion.</figcaption>
</figure>
<h2>What it costs</h2>
<p>Exposed work runs perhaps fifteen per cent above a plastered equivalent at the point of
pouring, and rather less than that over ten years, because nothing needs repainting. The
calculation only fails if the client changes their mind halfway, which is the one thing
concrete cannot absorb.</p>
<p>That is the real constraint, and it is not a technical one. A house of this kind has to
be decided early and left decided.</p>"""


def build_blogs(author_ids: list[uuid.UUID], category_ids: dict[str, uuid.UUID]) -> list[BlogCreate]:
    """Eight articles: six published, one draft, one archived."""
    return [
        BlogCreate(
            title="What Board-Formed Concrete Actually Costs",
            slug="board-formed-concrete-costs",
            excerpt="Exposed concrete is cheaper over ten years and more expensive on the day it is poured. The difference is entirely in the preparation.",
            content=ARTICLE_WITH_FIGURE.replace(
                "__FIGURE_URL__", public_url("journal/board-formed-concrete-detail.svg")
            ),
            featured_image=MediaRef(key="journal/board-formed-concrete.svg", alt="A board-formed concrete wall with the shuttering grain still visible"),
            status=BlogStatus.PUBLISHED,
            featured=True,
            author_id=author_ids[1],
            category_id=category_ids["architecture"],
            published_at=NOW - timedelta(days=4),
            seo_title="Board-formed concrete: real costs over ten years",
            seo_description="Why exposed concrete costs more to pour and less to own, and how to tell good work from bad.",
        ),
        BlogCreate(
            title="The Case Against the Open-Plan Ground Floor",
            slug="against-the-open-plan-ground-floor",
            excerpt="In a climate this humid, the room that can be closed and cooled is worth more than the room that flows.",
            content="""<p>Open plan arrived here as an import and stayed as a habit. It suits a temperate
climate and a small household. It suits neither the weather nor the way most houses on this
coast are actually lived in.</p>
<p>The problem is thermal before it is social. A single volume containing the kitchen, the
dining table and the seating cannot be cooled selectively, so it is cooled entirely, all
day, whether or not anyone is in three quarters of it.</p>
<h2>Rooms that close</h2>
<p>The alternative is not a return to corridors. It is a small number of generous rooms with
real doors, arranged so that two of them can be opened into one when the evening is cool
enough to want it.</p>""",
            featured_image=MediaRef(key="journal/open-plan.svg", alt="A dining room separated from a living room by tall pivoting doors"),
            status=BlogStatus.PUBLISHED,
            author_id=author_ids[0],
            category_id=category_ids["interiors"],
            published_at=NOW - timedelta(days=11),
        ),
        BlogCreate(
            title="Where the Andaman Market Is Moving",
            slug="andaman-market-movement",
            excerpt="Transaction volume has shifted north of the airport for three consecutive quarters. The reasons are mostly infrastructural.",
            content="""<p>For a decade the centre of gravity on Phuket sat between Bang Tao and Kamala.
It has been drifting north since the Sakhu road works finished, and the drift now shows up
clearly in registered transfers rather than only in asking prices.</p>
<h2>Why north</h2>
<p>Three things: the airport is closer than the traffic once made it feel, the coastline
north of Naithon is protected and therefore cannot be built out, and the land that is
available comes in parcels large enough to plan properly.</p>
<p>None of that is speculative. All of it is slow.</p>""",
            featured_image=MediaRef(key="journal/andaman-market.svg", alt="An aerial view of the northern Phuket coastline"),
            status=BlogStatus.PUBLISHED,
            author_id=author_ids[1],
            category_id=category_ids["market"],
            published_at=NOW - timedelta(days=19),
        ),
        BlogCreate(
            title="Shade Before Glass",
            slug="shade-before-glass",
            excerpt="A deep overhang does more for comfort than any coating on the market, and it costs less than the coating.",
            content="""<p>Every specification meeting reaches the same point: someone proposes a
high-performance glazing unit to solve a solar gain problem that a roof overhang would
have prevented for a fraction of the money.</p>
<h2>The order of operations</h2>
<p>Shade the opening. Then orient it. Then, if there is still a problem, coat the glass.
Reversing that order is how a house ends up with tinted windows and a dark interior in a
place with this much daylight.</p>""",
            featured_image=MediaRef(key="journal/shade-before-glass.svg", alt="A deep timber overhang casting shade across a glazed wall"),
            status=BlogStatus.PUBLISHED,
            author_id=author_ids[0],
            category_id=category_ids["sustainability"],
            published_at=NOW - timedelta(days=27),
        ),
        BlogCreate(
            title="The Sala, Reconsidered",
            slug="the-sala-reconsidered",
            excerpt="The most-used room in most houses here has no walls, no cooling and no fixed purpose.",
            content="""<p>Ask an owner which part of the house they actually use and the answer is
almost never the room the budget went into. It is the sala: a roof on posts, sited
correctly, with a table under it.</p>
<h2>Siting is everything</h2>
<p>A sala placed for the view and against the prevailing breeze will sit empty. Placed for
the breeze, it will take over the house. The view is a secondary consideration and the
plans rarely admit it.</p>""",
            featured_image=MediaRef(key="journal/the-sala.svg", alt="An open-sided pavilion with a table set beneath it"),
            status=BlogStatus.PUBLISHED,
            author_id=author_ids[0],
            category_id=category_ids["lifestyle"],
            published_at=NOW - timedelta(days=38),
        ),
        BlogCreate(
            title="Home Systems That Survive a Power Cut",
            slug="systems-that-survive-a-power-cut",
            excerpt="Every smart home here is eventually a dumb home for two hours. Design for that afternoon, not the demonstration.",
            content="""<p>The demonstration always works. The question worth asking is what the house
does at four in the afternoon in October, when the supply drops and the automation
controller reboots into an unknown state.</p>
<h2>Manual overrides</h2>
<p>Every automated circuit needs a switch a guest can find in the dark. Not an app, not a
scene — a switch. Systems that cannot be operated by someone who has never seen them are
not finished.</p>""",
            featured_image=MediaRef(key="journal/power-cut.svg", alt="A discreet wall switch plate set into plaster"),
            status=BlogStatus.PUBLISHED,
            author_id=author_ids[1],
            category_id=category_ids["technology"],
            published_at=NOW - timedelta(days=52),
        ),
        BlogCreate(
            title="Notes on the 2027 Coastal Setback Review",
            slug="coastal-setback-review-2027",
            excerpt="Draft — pending confirmation of the consultation dates.",
            content="<p>Draft. Do not publish until the consultation timetable is confirmed.</p>",
            status=BlogStatus.DRAFT,
            author_id=author_ids[1],
            category_id=category_ids["market"],
        ),
        BlogCreate(
            title="Teak Supply After the 2021 Restrictions",
            slug="teak-supply-2021-restrictions",
            excerpt="Superseded by later guidance; retained for reference.",
            content="<p>This article has been superseded and is retained for reference only.</p>",
            status=BlogStatus.ARCHIVED,
            author_id=author_ids[0],
            category_id=category_ids["sustainability"],
            published_at=NOW - timedelta(days=900),
        ),
    ]


# ── Runner ────────────────────────────────────────────────────────────


def collect_media(
    agents: list[AgentCreate],
    authors: list[AuthorCreate],
    categories: list[CategoryCreate],
    projects: list[ProjectCreate],
    blogs: list[BlogCreate],
) -> list[tuple[MediaRef, str, str]]:
    """Gather every media reference in the seed, with a label for the placeholder."""
    refs: list[tuple[MediaRef, str, str]] = []

    for agent in agents:
        if agent.portrait:
            refs.append((agent.portrait, agent.name, "Listing agent"))
    for author in authors:
        if author.portrait:
            refs.append((author.portrait, author.name, "Editorial"))
    for category in categories:
        if category.image:
            refs.append((category.image, category.name, "Lifestyle"))
    for project in projects:
        for index, ref in enumerate(project.media):
            refs.append((ref, project.name, "Hero" if index == 0 else f"Gallery {index}"))
    for blog in blogs:
        if blog.featured_image:
            refs.append((blog.featured_image, blog.title, "Journal"))

    # Images embedded inside article bodies are not on any column, so they are
    # named here explicitly. Keep this in step with the HTML above.
    refs.append(
        (
            MediaRef(
                key="journal/board-formed-concrete-detail.svg",
                alt="A board-formed concrete wall with the grain of the shuttering still visible",
            ),
            "Board-Formed Concrete",
            "In-article figure",
        )
    )

    return refs


def main() -> None:
    parser = argparse.ArgumentParser(description="Create and populate the latitude8estate schema.")
    parser.add_argument("--reset", action="store_true", help="Drop all tables before creating them.")
    parser.add_argument("--no-media", action="store_true", help="Skip uploading placeholder images to MinIO.")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

    db = Database(
        db_username=settings.DATABASE_USER,
        db_password=settings.DATABASE_PASSWORD,
        db_host=settings.DATABASE_HOST,
        db_port=settings.DATABASE_PORT,
        db_name=settings.DATABASE_NAME,
    )

    if not db.test_connection():
        raise SystemExit(
            f"Cannot reach postgres at {settings.DATABASE_HOST}:{settings.DATABASE_PORT}"
            f"/{settings.DATABASE_NAME}. Start it with `docker compose up -d postgres`."
        )

    if args.reset:
        logger.info("Dropping all tables")
        db.drop_tables()

    db.create_tables()
    logger.info("Schema is up to date")

    with db.session_scope() as session:
        project_repository = ProjectRepository(session)
        if project_repository.count() and not args.reset:
            logger.info("Database already contains data — nothing to do (use --reset to reseed)")
            return

        author_repository = AuthorRepository(session)
        agent_repository = AgentRepository(session)
        category_service = CategoryService(CategoryRepository(session))
        project_service = ProjectService(project_repository)
        blog_service = BlogService(BlogRepository(session))

        agents = build_agents()
        authors = build_authors()
        categories = build_categories()

        agent_ids = [agent_repository.create(**to_columns(a, {"portrait"})).id for a in agents]
        author_ids = [author_repository.create(**to_columns(a, {"portrait"})).id for a in authors]
        category_ids = {c.slug: category_service.create_category(c).id for c in categories}

        projects = build_projects(agent_ids)
        for project in projects:
            project_service.create_project(project)

        blogs = build_blogs(author_ids, category_ids)
        for blog in blogs:
            blog_service.create_blog(blog)

        logger.info(
            "Seeded %d agents, %d authors, %d categories, %d projects, %d blogs",
            len(agents), len(authors), len(categories), len(projects), len(blogs),
        )

    if not args.no_media:
        upload_media(collect_media(agents, authors, categories, projects, blogs))


if __name__ == "__main__":
    main()
