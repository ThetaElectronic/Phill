from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse


def add_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def custom_http_exception_handler(_, exc: HTTPException):  # type: ignore[override]
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_, exc: Exception):  # type: ignore[override]
        return JSONResponse(status_code=500, content={"detail": str(exc)})
