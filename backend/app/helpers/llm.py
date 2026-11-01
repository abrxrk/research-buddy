"""OpenRouter chat models: free structured-output models tried in order, then the auto free router."""
import asyncio
from functools import lru_cache

from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import Runnable, RunnableConfig, RunnableLambda
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.core.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1"
# Hard limit for one model's whole reply. The HTTP timeout alone isn't enough: OpenRouter sends keep-alive
# bytes while a free model is queued, which resets the read timeout, so a stalled call could hang forever.
MODEL_DEADLINE_S = 150


def _deadline(runnable: Runnable) -> Runnable:
    """Cancel the call after MODEL_DEADLINE_S so .with_fallbacks() moves on to the next model."""

    async def call(x, config: RunnableConfig):
        return await asyncio.wait_for(runnable.ainvoke(x, config), MODEL_DEADLINE_S)

    return RunnableLambda(lambda x, config: runnable.invoke(x, config), afunc=call)


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
    primary, *rest = [_deadline(_chat(m, temperature)) for m in settings.llm_models]
    last_resort = _deadline(_chat(settings.llm_fallback_model, temperature, strict_routing=False))
    return primary.with_fallbacks([*rest, last_resort])


def get_structured_llm(schema: type[BaseModel], temperature: float = 0.1) -> Runnable:
    """Returns a `schema` instance. OpenRouter enforces the JSON schema on the pinned models; the final
    auto-router fallback may not support that, so it gets the schema in the prompt + Pydantic parsing."""
    primary, *rest = [
        _deadline(_chat(m, temperature).with_structured_output(schema, method="json_schema", strict=True))
        for m in settings.llm_models
    ]
    parser = PydanticOutputParser(pydantic_object=schema)
    last_resort = _deadline(
        RunnableLambda(lambda msgs: [*msgs, HumanMessage(parser.get_format_instructions())])
        | _chat(settings.llm_fallback_model, temperature, strict_routing=False)
        | parser
    )
    return primary.with_fallbacks([*rest, last_resort])
