from app.text import clean_text


def test_stars_out_profanity():
    assert clean_text("what the fuck") == "what the ****"


def test_leaves_clean_text_alone():
    assert clean_text("Ana Lima") == "Ana Lima"
