import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subgroup import Subgroup
from app.models.user import User


async def create_subgroups_for_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    users: list[User],
    target_size: int = 5,
) -> list[Subgroup]:
    """Partition users into subgroups of target_size using round-robin."""
    num_subgroups = max(1, len(users) // target_size)
    if len(users) % target_size > 0:
        num_subgroups += 1

    # Avoid creating a tiny last group — redistribute if last group would be < 3
    if num_subgroups > 1:
        last_group_size = len(users) - (num_subgroups - 1) * target_size
        if last_group_size < 3:
            num_subgroups -= 1

    subgroups = []
    for i in range(num_subgroups):
        sg = Subgroup(
            session_id=session_id,
            label=f"ThinkTank {i + 1}",
        )
        db.add(sg)
        subgroups.append(sg)

    await db.flush()  # Get IDs assigned

    # Round-robin assignment
    for idx, user in enumerate(users):
        user.subgroup_id = subgroups[idx % num_subgroups].id

    await db.flush()
    return subgroups


async def assign_user_to_subgroup(
    db: AsyncSession,
    user: User,
    session_id: uuid.UUID,
    target_size: int = 5,
) -> Subgroup:
    """Assign a late-joining user to the smallest subgroup, or create a new one."""
    # Get subgroups with member counts
    result = await db.execute(
        select(Subgroup, func.count(User.id).label("member_count"))
        .outerjoin(User, User.subgroup_id == Subgroup.id)
        .where(Subgroup.session_id == session_id)
        .group_by(Subgroup.id)
        .order_by(func.count(User.id).asc())
    )
    rows = result.all()

    if rows and rows[0][1] < target_size:
        # Assign to smallest subgroup
        subgroup = rows[0][0]
    else:
        # All full — create new subgroup
        count = len(rows)
        subgroup = Subgroup(
            session_id=session_id,
            label=f"ThinkTank {count + 1}",
        )
        db.add(subgroup)
        await db.flush()

    user.subgroup_id = subgroup.id
    await db.flush()
    return subgroup
