from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from profiles import router as profiles_router
from users import router as users_router


app = FastAPI(
    title="Company API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(auth_router)


@app.get("/")
def home():
    return {
        "message": "API funcionando"
    }
