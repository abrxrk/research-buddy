"""OpenRouter chat models: free structured-output models tried in order, then the auto free router."""
from functools import lru_cache

from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import Runnable, RunnableLambda
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.core.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1"


@lru_cache
def _chat(model: str, temperature: float, strict_routing: bool = True) -> ChatOpenAI:
    extra = {"provider": {"require_parameters": True}} if strict_routing else None
    return ChatOpenAI(
        model=model,
        api_key=settings.openrouter_api_key,
        base_url=OPENROUTER_URL,
        temperature=temperature,
        timeout=120,
        max_retries=2,  # covers 429 rate limits with backoff
        default_headers={"X-OpenRouter-Title": "Research Buddy"},
        # strict_routing: only route to providers that honour every param we send (e.g. json_schema).
        extra_body=extra,
    )


def get_llm(temperature: float = 0.2) -> Runnable:
    """Plain chat model (text / streaming) with the full fallback chain."""
    primary, *rest = settings.llm_models
    chain = [_chat(m, temperature) for m in rest] + [_chat(settings.llm_fallback_model, temperature, False)]
    return _chat(primary, temperature).with_fallbacks(chain)


def get_structured_llm(schema: type[BaseModel], temperature: float = 0.1) -> Runnable:
    """Returns a `schema` instance. OpenRouter enforces the JSON schema on the pinned models; the final
    auto-router fallback may not support that, so it gets the schema in the prompt + Pydantic parsing."""
    primary, *rest = [
        _chat(m, temperature).with_structured_output(schema, method="json_schema", strict=True)
        for m in settings.llm_models
    ]
    parser = PydanticOutputParser(pydantic_object=schema)
    last_resort = (
        RunnableLambda(lambda msgs: [*msgs, HumanMessage(parser.get_format_instructions())])
        | _chat(settings.llm_fallback_model, temperature, strict_routing=False)
        | parser
    )
    return primary.with_fallbacks([*rest, last_resort])
