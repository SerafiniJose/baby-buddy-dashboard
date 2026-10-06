import httpx
from fastapi.testclient import TestClient

from backend import server


class FakeBabyBuddyClient:
    async def request(self, method, url, params=None, content=None, headers=None):
        return httpx.Response(
            400,
            content=b'{"time":["Date/time can not be in the future."]}',
            headers={
                "Date": "Tue, 06 Oct 2026 09:59:57 GMT",
                "Server": "BabyBuddy",
                "X-Trace": "keep-me",
            },
        )


class FakeNoDateClient:
    async def request(self, method, url, params=None, content=None, headers=None):
        return httpx.Response(204, content=b"", headers={"Server": "BabyBuddy"})


def test_proxy_forwards_baby_buddy_date_under_diagnostic_header():
    with TestClient(server.app) as client:
        original = server.http_client
        server.http_client = FakeBabyBuddyClient()
        try:
            response = client.post("/api/baby-buddy/feedings/", json={"child": 1})
        finally:
            server.http_client = original

    assert response.status_code == 400
    assert response.headers["x-baby-buddy-date"] == "Tue, 06 Oct 2026 09:59:57 GMT"
    assert response.headers["x-trace"] == "keep-me"
    # Uvicorn/TestClient may add its own Date header; the proxied Baby Buddy Date must not
    # be forwarded as a second raw Date header.
    assert response.headers.get("date") != "Tue, 06 Oct 2026 09:59:57 GMT"
    assert "server" not in response.headers


def test_proxy_omits_diagnostic_date_header_when_baby_buddy_sent_no_date():
    with TestClient(server.app) as client:
        original = server.http_client
        server.http_client = FakeNoDateClient()
        try:
            response = client.delete("/api/baby-buddy/notes/1/")
        finally:
            server.http_client = original

    assert response.status_code == 204
    assert "x-baby-buddy-date" not in response.headers
