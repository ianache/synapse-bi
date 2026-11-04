from synapse_api.preparation.service import PreparationService


def test_unknown_execution_error_uses_readable_sanitized_spanish_message():
    code, message = PreparationService._safe_error(RuntimeError("secret connection details"))

    assert code == "preparation_execution_failed"
    assert message == "Fall\u00f3 la ejecuci\u00f3n t\u00e9cnica. Revisa el c\u00f3digo saneado y vuelve a intentar."
    assert "secret connection details" not in message
