"""Server-side clean-up of text people type in. The frontend stars out
profanity as it is typed; this repeats the check so nothing skips it."""

from better_profanity import profanity

profanity.load_censor_words()


def clean_text(text: str) -> str:
    """Replaces profanity with asterisks (****); clean text is returned as is."""
    return profanity.censor(text, "*") if profanity.contains_profanity(text) else text
