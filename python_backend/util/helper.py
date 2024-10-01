from prisma import Prisma

async def get_doc_modified_time_by_id(doc_id: str):
    db = Prisma()
    doc = await db.document.find_unique(where={"id": doc_id})

    if doc is None:
        raise Exception("Document not found")
    return doc.lastModified


async def get_secret(user_id: str, key: str):
    db = Prisma()
    if not db.is_connected():
        await db.connect()

    query = await db.usersecret.find_first(
        where={
            "userId": user_id,
            'key': key
        }
    )

    if query is None:
        raise Exception(f"Secret not found for user {user_id} for key {key}")

    return query.value
