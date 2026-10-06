"""Medication minimum-interval checks for Baby Buddy.

Baby Buddy's ``next_dose_interval`` is a safety interval: it indicates when another dose
may be logged, not that a dose is required. The Home Assistant entity therefore reports
availability only and never labels a dose due, missed, or overdue.
"""

import asyncio
import logging
import unicodedata
from datetime import datetime, timedelta, timezone

import httpx

logger = logging.getLogger(__name__)

CHECK_INTERVAL_SECONDS = 300
ENTITY_ID = "binary_sensor.baby_buddy_medication_available"
PAGE_SIZE = 500
MAX_PAGES = 20


def parse_duration_hours(value):
    if not value:
        return None
    parts = str(value).strip().split(" ")
    try:
        if len(parts) > 1:
            days = float(parts[0])
            hms = parts[1].split(":")
        else:
            days = 0.0
            hms = parts[0].split(":")
        hours = float(hms[0]) if len(hms) > 0 else 0.0
        minutes = float(hms[1]) if len(hms) > 1 else 0.0
        seconds = float(hms[2]) if len(hms) > 2 else 0.0
    except (TypeError, ValueError):
        return None
    total = days * 24 + hours + minutes / 60 + seconds / 3600
    return total or None


def _parse_time(value):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _medication_key(value):
    return " ".join(unicodedata.normalize("NFKC", str(value or "")).split()).casefold()


def medication_availability(medications, now=None):
    """Return the earliest next-dose time for the latest entry of each medication name."""
    now = now or datetime.now(timezone.utc)
    latest_by_name = {}
    for med in medications or []:
        name = " ".join(str(med.get("name") or "").split())
        key = _medication_key(name)
        if not key:
            continue
        dose_time = _parse_time(med.get("time"))
        if not dose_time:
            continue
        existing = latest_by_name.get(key)
        if not existing or dose_time > existing["dose_time"]:
            latest_by_name[key] = {"entry": med, "dose_time": dose_time, "name": name}

    rows = []
    for item in latest_by_name.values():
        hours = parse_duration_hours(item["entry"].get("next_dose_interval"))
        if hours is None:
            continue
        interval = timedelta(hours=hours)
        available_at = item["dose_time"] + interval
        rows.append({
            "name": item["name"],
            "available_at": available_at,
            "available": available_at <= now,
            "entry": item["entry"],
        })
    return sorted(rows, key=lambda r: r["available_at"])


def is_any_medication_available(medications, now=None):
    return any(row["available"] for row in medication_availability(medications, now=now))


async def _check_once(baby_buddy_client: httpx.AsyncClient):
    children = []
    for page in range(MAX_PAGES):
        children_res = await baby_buddy_client.get(
            "/api/children/",
            params={"limit": PAGE_SIZE, "offset": page * PAGE_SIZE},
        )
        children_res.raise_for_status()
        payload = children_res.json()
        results = payload.get("results", [])
        children.extend(results)
        if not payload.get("next") or not results:
            break
    all_slots = []

    for child in children:
        medications = []
        for page in range(MAX_PAGES):
            meds_res = await baby_buddy_client.get(
                "/api/medication/",
                params={
                    "child": child["id"],
                    "limit": PAGE_SIZE,
                    "offset": page * PAGE_SIZE,
                    "ordering": "-time",
                },
            )
            if meds_res.status_code in (404, 405):
                medications = []
                break
            meds_res.raise_for_status()
            payload = meds_res.json()
            results = payload.get("results", [])
            medications.extend(results)
            if not payload.get("next") or not results:
                break
        for item in medication_availability(medications):
            all_slots.append({**item, "child_id": child.get("id"), "child_name": child.get("first_name") or child.get("name") or str(child.get("id"))})
    return all_slots


async def _publish_state(ha_client: httpx.AsyncClient, entries):
    available = [entry for entry in (entries or []) if entry["available"]]
    response = await ha_client.post(
        f"/states/{ENTITY_ID}",
        json={
            "state": "on" if available else "off",
            "attributes": {
                "friendly_name": "Baby Buddy Medication Available",
                "icon": "mdi:pill",
                "available_count": len(available),
                "medications": [
                    {
                        "child": entry.get("child_name"),
                        "medication": entry["name"],
                        "available_at": entry["available_at"].isoformat(),
                    }
                    for entry in available
                ],
            },
        },
    )
    response.raise_for_status()


async def _delete_entity_state(ha_client: httpx.AsyncClient):
    response = await ha_client.delete(f"/states/{ENTITY_ID}")
    if response.status_code != 404:
        response.raise_for_status()


async def delete_medication_entity(supervisor_token: str):
    """Remove the entity owned by this integration when the opt-in is disabled."""
    if not supervisor_token:
        return
    async with httpx.AsyncClient(
        base_url="http://supervisor/core/api",
        headers={"Authorization": f"Bearer {supervisor_token}"},
        timeout=10.0,
    ) as ha_client:
        await _delete_entity_state(ha_client)


async def run_medication_alert_loop(baby_buddy_client: httpx.AsyncClient, supervisor_token: str):
    async with httpx.AsyncClient(
        base_url="http://supervisor/core/api",
        headers={"Authorization": f"Bearer {supervisor_token}", "Content-Type": "application/json"},
        timeout=10.0,
    ) as ha_client:
        while True:
            try:
                entries = await _check_once(baby_buddy_client)
                await _publish_state(ha_client, entries)
            except Exception:
                logger.warning("Medication alert check failed, will retry next cycle", exc_info=True)
            await asyncio.sleep(CHECK_INTERVAL_SECONDS)
