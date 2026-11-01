import re

_TOKEN = re.compile(r"[a-z0-9]+(?:[-.][a-z0-9]+)*")
_STOP = frozenset(
    "a an and are as at be by for from has have in is it its of on or that the this to was were will with we our "
    "what which who how why does do did can".split()
)


def tokenize(text: str) -> list[str]:
    """Lowercase word tokens for BM25; keeps things like 'bleu-4', 'gpt-3.5'."""
    return [t for t in _TOKEN.findall(text.lower()) if t not in _STOP]


if __name__ == "__main__":
    assert tokenize("What is the BLEU-4 score of GPT-3.5?") == ["bleu-4", "score", "gpt-3.5"]
    print("text ok")
