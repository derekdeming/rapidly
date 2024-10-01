from fastapi import FastAPI, Header, Query

app = FastAPI()

@app.get("/hi")
def t():
    return {"Hello": "World"}