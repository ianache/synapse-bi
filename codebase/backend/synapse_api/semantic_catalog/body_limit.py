"""Bound actual bytes before parsing JSON; never trust Content-Length."""
from starlette.responses import JSONResponse


class SemanticBodyLimitMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if (scope['type'] != 'http' or scope.get('method') not in {'POST', 'PUT'}
                or not (scope.get('path', '') == '/api/v1/semantic-catalog'
                        or scope.get('path', '').startswith('/api/v1/semantic-catalog/'))):
            return await self.app(scope, receive, send)
        async def reject(status, code, message):
            response = JSONResponse(status_code=status, content={'error': {
                'code': code, 'message': message,
                'requestId': scope.get('state', {}).get('request_id', 'unavailable')}})
            await response(scope, receive, send)
        headers = dict(scope.get('headers', []))
        if headers.get(b'content-type', b'').split(b';')[0].strip().lower() != b'application/json':
            return await reject(415, 'unsupported_media_type', 'Se requiere application/json.')
        body = bytearray()
        while True:
            message = await receive()
            if message['type'] == 'http.disconnect':
                return
            chunk = message.get('body', b'')
            if len(body) + len(chunk) > 262144:
                return await reject(413, 'body_too_large', 'La solicitud supera el límite de 256 KiB.')
            body.extend(chunk)
            if not message.get('more_body', False):
                break
        delivered = False
        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {'type': 'http.request', 'body': bytes(body), 'more_body': False}
            return await receive()
        await self.app(scope, replay, send)
