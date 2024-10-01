from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from services.retriever_service import query_engine

router = APIRouter()

@router.get("/qa/response")
def get_qa_response(q: str = Query(default=None)):
    response = query_engine.query(q)
    return StreamingResponse(response.response_gen, media_type="text/plain")

@router.get("/qa/sources")
async def get_qa(q: str = Query(default=1)):
    try:
        sources = query_engine.retrieve(q)
        return {
            "items": sources,
            "totalCount": len(sources)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
