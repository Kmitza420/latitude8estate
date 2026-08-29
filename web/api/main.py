from fastapi import FastAPI

# TODO(api): Mount the v1 router — see endpoints/v1/router.py for the full list
#   of endpoints the web UI already calls:
#       from endpoints.v1.router import router as v1_router
#       app.include_router(v1_router)
#   The UI requests everything under /api/v1, so the prefix is part of the
#   contract, not a detail.
#
# TODO(api): Add CORS middleware before the UI's forms can work from a browser.
#   Allow the origins that serve web/ui — http://localhost:4321 (astro dev),
#   http://localhost:3001 (docker-compose web_ui) and the production domain —
#   for GET, POST and OPTIONS. Static builds fetch server-side and are
#   unaffected, so this will look fine in a build and fail only in the browser.
#
# TODO(api): Add a /health endpoint that checks postgres, minio and redis, so
#   docker-compose can use a real healthcheck for web_api rather than none.

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}
