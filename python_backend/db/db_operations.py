import logging
from .db import database
from prisma import Prisma
from prisma.models import DocumentCreateInput, DocumentUpdateInput

prisma_instance = database.db

logger = logging.getLogger(__name__)

class CRUD:
    def __init__(self, prisma_client):
        self.prisma = prisma_client

    async def _connect(self):
        if not self.prisma.is_connected():
            await self.prisma.connect()

    async def _disconnect(self):
        if self.prisma.is_connected():
            await self.prisma.disconnect()

    async def add_or_sync_document_to_db(data: DocumentCreateInput):
        """
        Adds a new document or syncs it if it already exists.
        """
        db = Prisma(auto_register=True)
        await db.connect()
        # we will check if the document exists
        doc = await db.document.find_unique(where={'id': data.id})
        if not doc:
            # create new document if it doesn't exist from above
            await db.document.create(data=data)
        else:
            update_data = DocumentUpdateInput(
                lastSyncedAt=data.lastSyncedAt,
                lastModified=data.lastModified,
                # ... other fields to update
            )
            await db.document.update(
                where={'id': data.id},
                data=update_data
            )
        # Handle your textChunks and embeddings here
        await db.disconnect()

    async def create(self, model, **data):
        await self._connect() 
        try:
            record = await getattr(self.prisma, model).create(data=data)
            return record
        except Exception as e:
            logger.error(f"Error during create operation: {e}")
            raise e
        finally:
            await self._disconnect()



    async def read(self, model, **conditions):
        await self._connect()
        try:
            records = await getattr(self.prisma, model).find_many(where=conditions)
            return records
        finally:
            await self._disconnect()

    async def update(self, model, record_id, **data):
        await self._connect()
        try:
            record = await getattr(self.prisma, model).update(where={"id": record_id}, data=data)
            await self.prisma.transaction.commit()
            return record
        except Exception as e:
            await self.prisma.transaction.rollback()
            logger.error(f"Error during update operation: {e}")
            raise e
        finally:
            await self._disconnect()

    async def delete(self, model, record_id):
        await self._connect()
        try:
            record = await getattr(self.prisma, model).delete(where={"id": record_id})
            await self.prisma.transaction.commit()
            return record
        except Exception as e:
            await self.prisma.transaction.rollback()
            logger.error(f"Error during delete operation: {e}")
            raise e
        finally:
            await self._disconnect()

    async def get(self, model, **conditions):
        await self._connect()
        try:
            record = await getattr(self.prisma, model).find_first(where=conditions)
            return record
        finally:
            await self._disconnect()

    async def list(self, model, skip: int = 0, limit: int = 10):
        await self._connect()
        try:
            records = await getattr(self.prisma, model).find_many(skip=skip, take=limit)
            return records
        finally:
            await self._disconnect()

crud = CRUD(prisma_instance)
