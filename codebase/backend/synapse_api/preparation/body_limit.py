from starlette.responses import JSONResponse


class PreparationBodyLimitMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        path = scope.get("path", "")
        if scope["type"] != "http" or scope.get("method") != "POST" or path != "/api/v1/preparation-runs":
            # Retry paths are matched below without accepting arbitrary body sizes.
            if not (path.startswith("/api/v1/preparation-runs/") and path.endswith("/retry") and scope.get("method") == "POST"):
                return await self.app(scope, receive, send)
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            if len(body) + len(chunk) > 1_048_576:
                response = JSONResponse(status_code=413, content={"error": {
                    "code": "body_too_large", "message": "El lote CDC supera el límite de 1 MiB.",
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
