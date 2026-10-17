"""All aggregate lookups include the tenant; the service owns transactions."""
from ..errors import ApiError


class ModelRepository:
    def __init__(self, conn, user):
        self.conn, self.user = conn, user

    def model(self, item_id):
        row = self.conn.execute('SELECT * FROM models_registry WHERE tenant_id=? AND id=?',
                                (self.user.tenant, item_id)).fetchone()
        if row is None:
            raise ApiError(404, 'not_found', 'Modelo no disponible.')
        return row

    def draft(self, model_id, item_id):
        row = self.conn.execute('SELECT * FROM models_drafts WHERE tenant_id=? AND model_id=? AND id=?',
                                (self.user.tenant, model_id, item_id)).fetchone()
        if row is None:
            raise ApiError(404, 'not_found', 'Borrador no disponible.')
        return row
