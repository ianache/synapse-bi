"""Bound actual ASGI bytes before JSON parsing, independent of Content-Length."""
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send


class DatasetBodyLimitMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        path = scope.get("path", "")
        if scope["type"] != "http" or scope.get("method") not in {"POST", "PUT"} or not (path == "/api/v1/datasets" or path.startswith("/api/v1/datasets/")):
            return await self.app(scope, receive, send)
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            if len(body) + len(chunk) > 262144:
                response = JSONResponse(status_code=413, content={"error": {
                    "code": "body_too_large", "message": "La solicitud supera el límite de 256 KiB.",
                    "requestId": scope.get("state", {}).get("request_id", "unavailable")}})
                return await response(scope, receive, send)
            body.extend(chunk)
            if not message.get("more_body", False):
                break
        delivered = False
        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()
        await self.app(scope, replay, send)
