import os
import litellm
from litellm import Router

litellm.success_callback = ["langsmith"]
# litellm.set_verbose=True # uncomment to see LiteLLM debug messages

model_list = [
    {
        "model_name": "openai:gpt-3.5-instruct",
        "litellm_params": {
            "model": "gpt-3.5-turbo-instruct",
            "api_key": os.getenv("OPENAI_API_KEY"),
        },
    },
    {
        "model_name": "openai:gpt-3.5",
        "litellm_params": {
            "model": "gpt-3.5-turbo",
            "api_key": os.getenv("OPENAI_API_KEY"),
        },
    },
    {
        "model_name": "openai:gpt-4",
        "litellm_params": {
            "model": "gpt-4-1106-preview",
            "api_key": os.getenv("OPENAI_API_KEY"),
        },
    },
    {
        "model_name": "openai:embeddings",
        "litellm_params": {
            "model": "text-embedding-ada-002",
            "api_key": os.getenv("OPENAI_API_KEY"),
        },
    }
]

LiteLLM = Router(model_list=model_list)
