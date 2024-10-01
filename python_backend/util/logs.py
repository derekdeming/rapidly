from prisma import Prisma
from enum import Enum


class Status(Enum):
    START = "START"
    END = "END"


class Code(Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


async def create_log(userId: str, source: str, status: Status, message: str | None = None, code: Code | None = None):
    db = Prisma()
    if not db.is_connected():
        await db.connect()

    await db.synclog.create({
        'userId': userId,
        'source': source,
        'status': status.value,
        'message': message,
        'code': code if code is not None else None
    })


async def start_log(userId: str, source: str):
    await create_log(userId, source, Status.START)


async def end_log(userId: str, source: str, code: Code, message: str | None = None):
    await create_log(userId, source, Status.END, message, code.value)


async def fetch_last_sync_log(userId: str, source: str):
    db = Prisma()
    if not db.is_connected():
        await db.connect()

    end_log = await db.synclog.find_first(
        order={
            'ts': 'desc'
        },
        where={
            'userId': userId,
            'source': source,
            'status': Status.END.value,
            'code': Code.SUCCESS.value
        }
    )

    if not end_log:
        return None
    
    # gets the corresponding start log for when the last sync started
    start_log = await db.synclog.find_first(
        order={
            'ts': 'desc'
        },
        where={
            'userId': userId,
            'source': source,
            'status': Status.START.value,
            'ts': {
                'lte': end_log.ts
            }
        }
    )

    return start_log
