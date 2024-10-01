import asyncio
import os
from datetime import datetime
from io import BytesIO
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import textract

from llama_index.readers.base import BasePydanticReader
from llama_index.schema import Document, MetadataMode
from prisma import Prisma, Json

from util.ServiceContext import embed_model, node_parser, vector_store
from util.logs import end_log, start_log, Code

TEMP_DIR = "./temp"

'''
Metadata:
    *title: str
    id: str
    url: str
    file_type: str
    *last_modified: datestr
    *last_author_name: str
    last_author_picture_url: str

    permissions_user: list
    permissions_group: list
    permissions_misc: str
'''

excluded_embed_metadata_keys = ['id', 'url', 'last_author_picture_url', 'permissions_user', 'permissions_group', 'permissions_misc']
excluded_llm_metadata_keys = ['id', 'url', 'last_author_picture_url', 'permissions_user', 'permissions_group', 'permissions_misc']

# the only mimeTypes we will process
WHITELISTED_MIMETYPES = [
    'application/pdf',  # .pdf
    'application/vnd.google-apps.document',  # google doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
    'application/msword'  # .doc
]

EXPORT_MIMETYPES = {
    "application/vnd.google-apps.document": {
        "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "extension": ".docx",
    },
    "application/vnd.google-apps.spreadsheet": {
        "mimetype": (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        "extension": ".xlsx",
    },
    "application/vnd.google-apps.presentation": {
        "mimetype": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "extension": ".pptx",
    },
}


class GDriveReader(BasePydanticReader):
    '''
    Google Drive Reader
    '''

    user_id: str
    service: Any = None
    page_token: str | None = None
    SimpleDirectoryReader: SimpleDirectoryReader = None

    @classmethod
    def class_name(cls) -> str:
        return "GDriveReader"

    def __init__(self, user_id: str):
        super().__init__(user_id=user_id, service=None,
                         page_token=None, SimpleDirectoryReader=None)
        self.user_id = user_id
        vector_store._initialize()

        # create temp directory if it doesn't exist
        import os
        if not os.path.exists(TEMP_DIR):
            os.makedirs(TEMP_DIR)

    async def initialize(self):
        '''
        Initialize the reader with async calls
        '''
        db = Prisma()
        await db.connect()

        acc = await db.account.find_first(
            where={
                'userId': self.user_id,
                'provider': 'drive'
            })

        if not acc:
            raise "Account not found"

        creds = Credentials(
            token=acc.access_token,
            refresh_token=acc.refresh_token,
            client_id=os.environ.get("GOOGLE_CLIENT_ID"),
            client_secret=os.environ.get(
                "GOOGLE_CLIENT_SECRET"),
            token_uri="https://oauth2.googleapis.com/token",
            expiry=datetime.fromtimestamp(acc.expires_at),
            scopes=acc.scope.split(" ")
        )

        if creds.expired:
            creds.refresh(Request())

            # Update the token in the database
            await db.account.update_many( # todo: make this unique only
                where={
                    'userId': self.user_id,
                    'provider': 'drive'
                },
                data={
                    'access_token': creds.token,
                    'expires_at': int(creds.expiry.timestamp())
                }
            )

        self.service = build('drive', 'v3',
                             credentials=creds)
        self.page_token = acc.metadata['pageToken'] if 'pageToken' in acc.metadata else None

    async def _save_page_token(self, page_token: str):
        '''
        Saves the page token to the database for the next sync
        '''
        db = Prisma()
        await db.connect()
        acc = await db.account.find_first(
            where={
                'userId': self.user_id,
                'provider': 'drive'
            })
        if not acc:
            raise "Account not found"

        acc.metadata['pageToken'] = page_token
        await db.account.update_many(
            where={
                'userId': self.user_id,
                'provider': 'drive'
            },
            data={
                'metadata': Json(acc.metadata)  # update metadata
            })

    def _get_permissions(self, file_id: str):

        # return self.service.files().get(fileId=file_id).execute()

        permissions = self.service.permissions().list(
            fileId=file_id, fields='permissions(id, emailAddress, role, type)').execute()
        # relevant_permissions = []
        user_permissions = []
        group_permissions = []
        misc_permissions = None  # domain, anyone(with link), None

        for permission in permissions.get('permissions', []):
            # Check if the permission role is 'reader', 'commenter', 'writer', or 'owner'
            if permission.get('role') in ['reader', 'commenter', 'writer', 'owner']:
                perm_type = permission.get('type')
                email = permission.get('emailAddress')

                # If the permission is a user or group type, fetch the email address
                if perm_type in ['user'] and email:
                    user_permissions.append(email)
                elif perm_type in ['group'] and email:
                    group_permissions.append(email)
                else:
                    misc_permissions = permission.get(
                        'type')  # anyone, domain, None

        return (user_permissions, group_permissions, misc_permissions)

    async def _process_file(self, file: dict):
        '''
        Given file data, temporarily downloads the file, converts it to text, and saves it to the db
        '''
        filemetadata = self.service.files().get(
            fileId=file['id'], fields='lastModifyingUser, modifiedTime, webViewLink, parents').execute()
        # download the file
        saved_file_name = self._download_file(
            file['id'], file['name'], file['mimeType'])

        # supported file types: https://textract.readthedocs.io/en/stable/
        text = textract.process(f"{TEMP_DIR}/{saved_file_name}")

        doc = Document(text=text, doc_id=f'drive-{file["id"]}')

        # permissions
        permissions_user, permissions_group, permissions_misc = self._get_permissions(
            file['id'])

        doc.metadata = {
            'id': f'drive-{file["id"]}',
            'title': file['name'],
            'file_type': file['mimeType'],
            'url': filemetadata.get("webViewLink"),
            'last_modified': filemetadata.get("modifiedTime"),
            'last_author_name': filemetadata.get("lastModifyingUser").get("displayName"),
            'last_author_picture_url': filemetadata.get("lastModifyingUser").get("photoLink"),

            'permissions_user': permissions_user,
            'permissions_group': permissions_group,
            'permissions_misc': permissions_misc,
        }

        doc.excluded_embed_metadata_keys = excluded_embed_metadata_keys
        doc.excluded_llm_metadata_keys = excluded_llm_metadata_keys

        db = Prisma()
        if not db.is_connected():
            await db.connect()
        sql_query = f"""
            DELETE FROM "data_v1"
            WHERE metadata_ ->> 'doc_id' = '{doc.doc_id}' -- #TODO:  check
        """
        await db.execute_raw(sql_query)

        nodes = node_parser.get_nodes_from_documents([doc])
        for n in nodes:
            n.embedding = embed_model.get_text_embedding(
                n.get_content(metadata_mode=MetadataMode.EMBED))

        vector_store.add(nodes)

        # delete the temp file
        import os
        os.remove(f"{TEMP_DIR}/{saved_file_name}")

    def _download_file(self, file_id: str, file_name: str | None = None, file_mimetype: str | None = None):
        '''
        Get file from Google Drive, downloads to temp directory, and returns the new file name
        '''
        if not file_name or not file_mimetype:
            file_metadata = self.service.files().get(fileId=file_id).execute()
            file_name = file_metadata['name'].replace(
                "/", "-").replace("\\", "-")
            file_mimetype = file_metadata['mimeType']

        if file_mimetype in EXPORT_MIMETYPES:
            # download and convert file
            download_mimetype = EXPORT_MIMETYPES[file_mimetype]["mimetype"]
            download_extension = EXPORT_MIMETYPES[file_mimetype]["extension"]
            new_file_name = file_name + download_extension
            request = self.service.files().export_media(
                fileId=file_id,
                mimeType=download_mimetype
            )
        else:
            # download file without conversion
            new_file_name = file_name
            request = self.service.files().get_media(fileId=file_id)

        file_data = BytesIO()
        downloader = MediaIoBaseDownload(file_data, request)
        done = False

        while not done:
            _status, done = downloader.next_chunk()

        with open(f"{TEMP_DIR}/{new_file_name}", "wb") as f:
            f.write(file_data.getvalue())

        return new_file_name

    def _get_files(self, folder_id: str | None = None, next_page_query: str | None = None):
        '''
        Lists all files in a certain folder
        '''
        files = []
        query = "(" + " or ".join(["mimeType = '" + mimeType +
                                   "'" for mimeType in WHITELISTED_MIMETYPES]) + ") and "
        query += f"'{folder_id or 'root'}' in parents"

        while True:
            res = self.service.files().list(
                pageSize=10,
                fields="nextPageToken, files(id, name, mimeType)",
                q=query,
                pageToken=next_page_query
            ).execute()

            if 'files' in res:
                files.extend(res['files'])

            if 'nextPageToken' in res and res['nextPageToken']:
                next_page_query = res['nextPageToken']
            else:
                break

        return files

    def _get_folders(self, folder_id: str | None = None, next_page_query: str | None = None):
        '''
        Lists all folders in a certain folder
        '''
        folders = []

        query = "mimeType = 'application/vnd.google-apps.folder' and "
        query += f"'{folder_id or 'root'}' in parents"

        while True:
            res = self.service.files().list(
                pageSize=10,
                fields="nextPageToken, files(id, name, mimeType)",
                q=query,
                pageToken=next_page_query
            ).execute()

            if 'files' in res:
                folders.extend(res['files'])

            if 'nextPageToken' in res and res['nextPageToken']:
                next_page_query = res['nextPageToken']
            else:
                break

        return folders

    async def init_sync(self):
        '''
        Initial sync of a Drive. Recursively fetches all folders and files.
        '''
        await start_log(self.user_id, 'google_drive')
        file_count = 0

        try:
            folders_arr = [{'id': '10SXk63vMPlu95eIFG4Xk7EXFx29KGEd2'}]  # start with root folder # TODO: start with urban planning folder
            synced_folders = []

            while len(folders_arr) != 0:
                folder = folders_arr.pop()
                folder_id = folder['id']
                folders = self._get_folders(folder_id)
                files = self._get_files(folder_id)

                for file in files:
                    print("processing file")
                    print(file)
                    await self._process_file(file)
                    file_count += 1

                folders_arr.extend(folders)
                synced_folders.extend(folders)

        except Exception as e:
            await end_log(self.user_id, 'google_drive', Code.FAILED, str(e))
            return True
        
        await end_log(self.user_id, 'google_drive', Code.SUCCESS, f'Initialized {file_count} files')

    async def sync(self):
        '''
        Gets all changes since the last sync
        '''
        await start_log(self.user_id, 'google_drive')

        change_count = 0

        try:
            if self.page_token is None:
                # first time sync, use init
                # add start token to db, but keep all the other metadata
                start_token_data = self.service.changes().getStartPageToken().execute()
                next_cursor = start_token_data.get('startPageToken')

                await self._save_page_token(next_cursor)
                await self.init_sync()
            else:
                # use a standard sync, using pageToken
                next_cursor = self.page_token

                finished = False
                while not finished:
                    data = self.service.changes().list(
                        pageToken=next_cursor,
                        fields="*"
                    ).execute()
                    changes = data['changes']
                    next_cursor = data['newStartPageToken']

                    if (len(changes) == 0):
                        # no more changes to process, save the page token for next sync
                        finished = True
                        break

                    change_data = [{
                        'id': change['file']['id'],
                        'name': change['file']['name'],
                        'mimeType': change['file']['mimeType'],
                    } for change in changes if change['file']['mimeType'] != 'application/vnd.google-apps.folder']

                    for file in change_data:
                        await self._process_file(file)
                        change_count += 1

                await self._save_page_token(next_cursor)
        
        except Exception as e:
            await end_log(self.user_id, 'google_drive', Code.FAILED, str(e))
            return True
        
        await end_log(self.user_id, 'google_drive', Code.SUCCESS, f'Synced {change_count} files')


if __name__ == "__main__":
    async def main():
        gdrive_reader = GDriveReader(user_id="clo4oqiji0000b9nir2p1hxug")
        await gdrive_reader.initialize()

        await gdrive_reader.init_sync()
        # await gdrive_reader.sync()

    asyncio.run(main())
