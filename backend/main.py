"""
GESTURA Backend Application
FastAPI server handling health checks, dataset management, and ML services.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import get_settings
from backend.routers import health, dataset, model

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Assistive hand gesture translation platform backend API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(dataset.router)
app.include_router(model.router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to GESTURA API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
