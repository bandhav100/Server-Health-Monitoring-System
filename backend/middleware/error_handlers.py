from flask import Flask
from utils.response import api_response


def register_error_handlers(app: Flask):
    @app.errorhandler(400)
    def bad_request(_error):
        return api_response(False, "Bad request", None, 400)

    @app.errorhandler(401)
    def unauthorized(_error):
        return api_response(False, "Unauthorized", None, 401)

    @app.errorhandler(403)
    def forbidden(_error):
        return api_response(False, "Forbidden", None, 403)

    @app.errorhandler(404)
    def not_found(_error):
        return api_response(False, "Resource not found", None, 404)

    @app.errorhandler(500)
    def internal_error(_error):
        app.logger.exception("Unhandled server error")
        return api_response(False, "Internal server error", None, 500)

    @app.errorhandler(Exception)
    def handle_exception(error):
        app.logger.exception("Unexpected exception: %s", error)
        return api_response(False, "Unexpected error", None, 500)
