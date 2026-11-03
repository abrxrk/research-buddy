from pymongo import AsyncMongoClient

from app.core.config import settings

client = AsyncMongoClient(settings.mongo_uri)
db = client[settings.mongo_db]
users = db.users
papers = db.papers
chats = db.chats
comparisons = db.comparisons


async def init_indexes():
    await users.create_index("email", unique=True)
    await papers.create_index("user_id")
    await chats.create_index("paper_id")
    await comparisons.create_index("user_id")
