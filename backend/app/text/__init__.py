"""Server-side clean-up of text people type in. The frontend stars out
profanity as it is typed; this repeats the check so nothing skips it."""

import logging

try:
    from better_profanity import profanity
except ModuleNotFoundError:  # pragma: no cover - only when the package wasn't installed
    # Keep the API up if a deploy is missing the package; the frontend still filters.
    profanity = None
    logging.getLogger(__name__).warning("better-profanity is not installed; names aren't filtered")
else:
    profanity.load_censor_words()


def clean_text(text: str) -> str:
    """Replaces profanity with asterisks (****); clean text is returned as is."""
    if profanity is None or not profanity.contains_profanity(text):
        return text
    return profanity.censor(text, "*")
