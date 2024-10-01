from typing import List, Optional
from Source import Source
from SubQueryData import SubQueryData


class Message():
    message: Optional[str]
    is_user: bool
    # first subquery will always be the original query's if no additional subqueries
    subqueries: List[SubQueryData]

    def __init__(self, is_user: bool, message: Optional[str] = None, subqueries: Optional[List[SubQueryData]] = None):
        self.message = message
        self.is_user = is_user
        self.subqueries = subqueries if subqueries is not None else []

    def to_content_str(self):
        return f"""\
        {"User" if self.is_user else "AI"}: {self.message}
        """


class UserMessage(Message):
    message: str

    def __init__(self, message: str):
        super().__init__(message=message, is_user=True)


class AIMessage(Message):
    def __init__(self, message: Optional[str], subqueries: List[SubQueryData]):
        super().__init__(message=message, is_user=False, subqueries=subqueries)
