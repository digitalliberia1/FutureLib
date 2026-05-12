from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel
from app.models.forum import ForumThread, ForumPost, ThreadCategory
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/forum", tags=["Community Forum"])


class ThreadCreate(BaseModel):
    title: str
    body: str
    category: ThreadCategory = ThreadCategory.GENERAL
    course_id: Optional[str] = None
    tags: List[str] = []


class PostCreate(BaseModel):
    body: str
    parent_post_id: Optional[str] = None


@router.get("/threads")
async def list_threads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    category: Optional[str] = None,
    course_id: Optional[str] = None,
    pinned_first: bool = True,
):
    filters = []
    if category:
        filters.append(ForumThread.category == category)
    if course_id:
        filters.append(ForumThread.course_id == course_id)

    query = ForumThread.find(*filters).sort("-is_pinned", "-created_at")
    total = await query.count()
    threads = await query.skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "threads": [_thread_dict(t) for t in threads],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/threads", status_code=status.HTTP_201_CREATED)
async def create_thread(body: ThreadCreate, current_user: User = Depends(get_current_user)):
    thread = ForumThread(
        title=body.title,
        body=body.body,
        author_id=str(current_user.id),
        author_name=current_user.full_name,
        author_avatar=current_user.avatar_url,
        category=body.category,
        course_id=body.course_id,
        tags=body.tags,
    )
    await thread.insert()
    return {"message": "Thread created", "thread_id": str(thread.id)}


@router.get("/threads/{thread_id}")
async def get_thread(thread_id: str):
    thread = await ForumThread.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    thread.view_count += 1
    await thread.save()
    return _thread_dict(thread)


@router.get("/threads/{thread_id}/posts")
async def get_thread_posts(
    thread_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    thread = await ForumThread.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    query = ForumPost.find(ForumPost.thread_id == thread_id, ForumPost.parent_post_id == None).sort("created_at")
    total = await query.count()
    posts = await query.skip((page - 1) * page_size).limit(page_size).to_list()

    # Fetch nested replies for each top-level post
    result = []
    for p in posts:
        pd = _post_dict(p)
        replies = await ForumPost.find(ForumPost.parent_post_id == str(p.id)).sort("created_at").to_list()
        pd["replies"] = [_post_dict(r) for r in replies]
        result.append(pd)

    return {"posts": result, "total": total, "page": page, "page_size": page_size}


@router.post("/threads/{thread_id}/posts", status_code=status.HTTP_201_CREATED)
async def create_post(thread_id: str, body: PostCreate, current_user: User = Depends(get_current_user)):
    thread = await ForumThread.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    if thread.is_locked:
        raise HTTPException(status_code=403, detail="Thread is locked")

    post = ForumPost(
        thread_id=thread_id,
        body=body.body,
        author_id=str(current_user.id),
        author_name=current_user.full_name,
        author_avatar=current_user.avatar_url,
        parent_post_id=body.parent_post_id,
    )
    await post.insert()

    thread.reply_count += 1
    thread.updated_at = datetime.now(timezone.utc)
    await thread.save()

    return {"message": "Post created", "post_id": str(post.id)}


@router.post("/threads/{thread_id}/upvote")
async def upvote_thread(thread_id: str, current_user: User = Depends(get_current_user)):
    thread = await ForumThread.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    uid = str(current_user.id)
    if uid in thread.upvoter_ids:
        thread.upvoter_ids.remove(uid)
        thread.upvotes = max(0, thread.upvotes - 1)
        action = "removed"
    else:
        thread.upvoter_ids.append(uid)
        thread.upvotes += 1
        action = "added"
    await thread.save()
    return {"upvotes": thread.upvotes, "action": action}


@router.post("/posts/{post_id}/upvote")
async def upvote_post(post_id: str, current_user: User = Depends(get_current_user)):
    post = await ForumPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    uid = str(current_user.id)
    if uid in post.upvoter_ids:
        post.upvoter_ids.remove(uid)
        post.upvotes = max(0, post.upvotes - 1)
        action = "removed"
    else:
        post.upvoter_ids.append(uid)
        post.upvotes += 1
        action = "added"
    await post.save()
    return {"upvotes": post.upvotes, "action": action}


@router.patch("/posts/{post_id}/accept")
async def accept_answer(post_id: str, current_user: User = Depends(get_current_user)):
    post = await ForumPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    thread = await ForumThread.get(post.thread_id)
    if not thread or thread.author_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only thread author can accept answers")
    post.is_accepted_answer = not post.is_accepted_answer
    await post.save()
    return {"is_accepted": post.is_accepted_answer}


@router.get("/categories")
async def get_categories():
    return {"categories": [c.value for c in ThreadCategory]}


@router.get("/stats")
async def forum_stats():
    total_threads = await ForumThread.find().count()
    total_posts = await ForumPost.find().count()
    by_category = {}
    for cat in ThreadCategory:
        count = await ForumThread.find(ForumThread.category == cat).count()
        by_category[cat.value] = count
    return {
        "total_threads": total_threads,
        "total_posts": total_posts,
        "by_category": by_category,
    }


def _thread_dict(t: ForumThread) -> dict:
    return {
        "id": str(t.id),
        "title": t.title,
        "body": t.body[:300] + "..." if len(t.body) > 300 else t.body,
        "author_id": t.author_id,
        "author_name": t.author_name,
        "author_avatar": t.author_avatar,
        "category": t.category,
        "course_id": t.course_id,
        "tags": t.tags,
        "is_pinned": t.is_pinned,
        "is_locked": t.is_locked,
        "view_count": t.view_count,
        "reply_count": t.reply_count,
        "upvotes": t.upvotes,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
    }


def _post_dict(p: ForumPost) -> dict:
    return {
        "id": str(p.id),
        "thread_id": p.thread_id,
        "body": p.body,
        "author_id": p.author_id,
        "author_name": p.author_name,
        "author_avatar": p.author_avatar,
        "parent_post_id": p.parent_post_id,
        "upvotes": p.upvotes,
        "is_accepted_answer": p.is_accepted_answer,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "replies": [],
    }
