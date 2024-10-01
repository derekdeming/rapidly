from typing import List

NEWLINE = "\n--\n"

class Source():
    id: str
    file_type: str
    last_author_name: str
    last_author_picture_url: str
    last_modified: str
    title: str
    url: str
    chunks: List[str]

    def __init__(self, id: str, file_type: str, last_author_name: str, last_author_picture_url: str, last_modified: str, title: str, url: str, chunks: List[str]):
        self.id = id
        self.file_type = file_type
        self.last_author_name = last_author_name
        self.last_author_picture_url = last_author_picture_url
        self.last_modified = last_modified
        self.title = title
        self.url = url
        self.chunks = chunks

    def to_content_str(self):
        return f"""\
Title: {self.title}
Chunks: {NEWLINE.join(self.chunks)}
"""

    def to_json(self):
        return {
            "id": self.id,
            "file_type": self.file_type,
            "last_author_name": self.last_author_name,
            "last_author_picture_url": self.last_author_picture_url,
            "last_modified": self.last_modified,
            "title": self.title,
            "url": self.url,
            "chunks": self.chunks
        }
