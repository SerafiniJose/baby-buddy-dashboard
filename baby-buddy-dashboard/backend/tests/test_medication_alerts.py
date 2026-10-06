import asyncio
import json
from datetime import datetime, timedelta, timezone

import httpx
import pytest

from backend.medication_alerts import (
    ENTITY_ID,
    is_any_medication_available,
    medication_availability,
    parse_duration_hours,
    _check_once,
    _delete_entity_state,
    _publish_state,
)

NOW = datetime(2026, 7, 20, 12, 0, 0, tzinfo=timezone.utc)


def dose(hours_ago, interval, name="Tylenol"):
    return {
        "name": name,
        "time": (NOW - timedelta(hours=hours_ago)).isoformat(),
        "next_dose_interval": interval,
    }


def test_parse_duration_hours():
    assert parse_duration_hours(None) is None
    assert parse_duration_hours("06:00:00") == 6.0
    assert parse_duration_hours("00:30:00") == 0.5
    assert parse_duration_hours("1 00:00:00") == 24.0
    assert parse_duration_hours("00:00:00") is None


def test_interval_is_one_time_availability_not_recurring_schedule():
    entries = medication_availability([dose(14, "06:00:00", name="Antibiotic")], now=NOW)
    assert len(entries) == 1
    assert entries[0]["available"] is True
    assert "overdue" not in entries[0]
    assert is_any_medication_available([dose(14, "06:00:00")], now=NOW) is True


def test_latest_dose_per_medication_name_counts():
    meds = [dose(8, "06:00:00"), dose(1, "06:00:00")]
    assert is_any_medication_available(meds, now=NOW) is False


def test_latest_entry_without_interval_does_not_resurrect_an_older_interval():
    meds = [dose(10, "06:00:00"), dose(1, None)]
    assert medication_availability(meds, now=NOW) == []


def test_medication_identity_is_case_and_whitespace_insensitive():
    meds = [dose(10, "06:00:00", "  TYLENOL "), dose(1, "06:00:00", "Tylenol")]
    rows = medication_availability(meds, now=NOW)
    assert len(rows) == 1
    assert rows[0]["available"] is False


def test_invalid_medication_times_are_ignored():
    assert medication_availability([{"name": "Drops", "time": "not-a-date", "next_dose_interval": "06:00:00"}], now=NOW) == []


def make_baby_buddy_client(children, medications_by_child):
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/children/":
            return httpx.Response(200, json={"results": children})
        if request.url.path == "/api/medication/":
            child_id = request.url.params.get("child")
            return httpx.Response(200, json={"results": medications_by_child.get(child_id, [])})
        return httpx.Response(404)

    return httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://fake-baby-buddy")


def test_check_once_returns_availability_across_children():
    async def run():
        current_overdue_dose = {
            "name": "Tylenol",
            "time": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat(),
            "next_dose_interval": "06:00:00",
        }
        client = make_baby_buddy_client(
            children=[{"id": 1, "first_name": "Emma"}, {"id": 2, "first_name": "Liam"}],
            medications_by_child={"1": [current_overdue_dose], "2": []},
        )
        async with client:
            return await _check_once(client)

    slots = asyncio.run(run())
    assert len([s for s in slots if s["available"]]) == 1
    assert slots[0]["child_name"] == "Emma"


def test_check_once_treats_unsupported_medication_api_as_no_slots():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/children/":
            return httpx.Response(200, json={"results": [{"id": 1, "first_name": "Emma"}]})
        if request.url.path == "/api/medication/":
            return httpx.Response(405, json={"detail": "Method not allowed"})
        return httpx.Response(404)

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://fake-baby-buddy") as client:
            return await _check_once(client)

    assert asyncio.run(run()) == []


def test_check_once_pages_before_selecting_latest_medication_entry():
    offsets = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/children/":
            return httpx.Response(200, json={"results": [{"id": 1, "first_name": "Emma"}]})
        if request.url.path == "/api/medication/":
            offset = int(request.url.params.get("offset", "0"))
            offsets.append(offset)
            if offset == 0:
                return httpx.Response(200, json={"results": [dose(10, "06:00:00")], "next": "next-page"})
            return httpx.Response(200, json={"results": [dose(1, None)], "next": None})
        return httpx.Response(404)

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://fake-baby-buddy") as client:
            return await _check_once(client)

    assert asyncio.run(run()) == []
    assert offsets == [0, 500]


def test_check_once_pages_through_children():
    child_offsets = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/children/":
            offset = int(request.url.params.get("offset", "0"))
            child_offsets.append(offset)
            if offset == 0:
                return httpx.Response(200, json={"results": [{"id": 1, "first_name": "One"}], "next": "next-page"})
            return httpx.Response(200, json={"results": [{"id": 2, "first_name": "Two"}], "next": None})
        if request.url.path == "/api/medication/":
            return httpx.Response(200, json={"results": [dose(10, "06:00:00")], "next": None})
        return httpx.Response(404)

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://fake-baby-buddy") as client:
            return await _check_once(client)

    slots = asyncio.run(run())
    assert child_offsets == [0, 500]
    assert {slot["child_id"] for slot in slots} == {1, 2}


def test_publish_state_posts_available_medications_without_due_claims():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={})

    async def publish(slots):
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://supervisor/core/api") as client:
            await _publish_state(client, slots)

    entries = medication_availability([dose(14, "06:00:00", "Antibiotic")], now=NOW)
    asyncio.run(publish(entries))

    assert captured["url"] == f"http://supervisor/core/api/states/{ENTITY_ID}"
    assert captured["body"]["state"] == "on"
    assert captured["body"]["attributes"]["available_count"] == 1
    assert captured["body"]["attributes"]["medications"][0]["medication"] == "Antibiotic"
    assert "overdue" not in json.dumps(captured["body"]).lower()

    asyncio.run(publish([]))
    assert captured["body"]["state"] == "off"


def test_publish_state_raises_on_home_assistant_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"message": "unauthorized"})

    async def publish():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://supervisor/core/api") as client:
            await _publish_state(client, [])

    with pytest.raises(httpx.HTTPStatusError):
        asyncio.run(publish())


def test_delete_entity_state_removes_owned_home_assistant_entity():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["url"] = str(request.url)
        return httpx.Response(200, json={})

    async def remove():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://supervisor/core/api") as client:
            await _delete_entity_state(client)

    asyncio.run(remove())
    assert captured == {
        "method": "DELETE",
        "url": f"http://supervisor/core/api/states/{ENTITY_ID}",
    }
