from fastapi import FastAPI
from api import root, user, qa, conversation

app = FastAPI()

app.include_router(root.router)
app.include_router(user.router)
app.include_router(qa.router)
app.include_router(conversation.router)
