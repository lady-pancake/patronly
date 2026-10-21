"""What each view (role) is allowed to do.

The backend sends these lists with `me { roles { role entitlements } }`; the
frontend checks for an action in the list rather than looking at the role.
"""

from enum import StrEnum


class Entitlement(StrEnum):
    SAVE_FAVOURITES = "save_favourites"
    SEND_INQUIRIES = "send_inquiries"
    MESSAGE = "message"
    MANAGE_STUDIO = "manage_studio"
    VIEW_DASHBOARD = "view_dashboard"


_PATRON = frozenset({Entitlement.SAVE_FAVOURITES, Entitlement.SEND_INQUIRIES, Entitlement.MESSAGE})
_ARTIST = _PATRON | {Entitlement.MANAGE_STUDIO, Entitlement.VIEW_DASHBOARD}

ROLE_ENTITLEMENTS: dict[str, frozenset[Entitlement]] = {"patron": _PATRON, "artist": _ARTIST}


def entitlements_for(role: str) -> frozenset[Entitlement]:
    return ROLE_ENTITLEMENTS.get(role, frozenset())


def has(role: str, entitlement: Entitlement) -> bool:
    return entitlement in entitlements_for(role)
