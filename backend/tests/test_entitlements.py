from app.auth.entitlements import Entitlement, entitlements_for, has


def test_patrons_can_save_but_not_run_a_studio():
    assert has("patron", Entitlement.SAVE_FAVOURITES)
    assert not has("patron", Entitlement.MANAGE_STUDIO)


def test_artists_get_everything_patrons_have_plus_studio_tools():
    assert entitlements_for("patron") < entitlements_for("artist")
    assert has("artist", Entitlement.VIEW_DASHBOARD)
    assert has("artist", Entitlement.RECEIVE_INQUIRIES)
    assert not has("patron", Entitlement.RECEIVE_INQUIRIES)


def test_unknown_roles_get_nothing():
    assert entitlements_for("admin") == frozenset()
