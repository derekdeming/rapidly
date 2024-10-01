from fastapi import APIRouter, Header

router = APIRouter()

@router.get("/user")
def user(x_user_name: str = Header(None), x_user_email: str = Header(None), x_user_image: str = Header(None), x_user_id: str = Header(None)):
    return {
        "x_user_name": x_user_name,
        "x_user_email": x_user_email,
        "x_user_image": x_user_image,
        "x_user_id": x_user_id
    }
