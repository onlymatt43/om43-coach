from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai, os
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class Message(BaseModel):
    user_message: str
    token: str

def embed_text(text: str):
    embedding = openai.Embedding.create(
        model="text-embedding-3-small",
        input=text
    )["data"][0]["embedding"]
    return np.array(embedding).tolist()

# ============================
# 💬 CHAT AVEC MÉMOIRE VECTORIELLE
# ============================
@app.post("/chat")
async def chat(msg: Message):
    if msg.token != ACCESS_TOKEN:
        raise HTTPException(status_code=401, detail="Accès refusé")

    query_embedding = embed_text(msg.user_message)

    # Récupération contextuelle basique (fallback)
    context_result = supabase.table("conversations")\
        .select("role, message")\
        .order("timestamp", desc=True)\
        .limit(5)\
        .execute()

    semantic_context = "\n".join([
        f"{x['role']}: {x['message']}"
        for x in context_result.data[::-1]
    ])

    system_prompt = (
        "Tu es le double numérique de Matt. "
        "Tu te souviens du sens profond des échanges précédents. "
        "Tu penses vite, franc, bilingue (fr/en), créatif et structuré."
    )

    completion = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Contexte:\n{semantic_context}\n\nMatt dit: {msg.user_message}"}
        ]
    )
    response = completion.choices[0].message["content"]

    msg_embed = embed_text(msg.user_message)
    res_embed = embed_text(response)

    supabase.table("conversations").insert([
        {"role": "user", "message": msg.user_message, "embedding": msg_embed},
        {"role": "assistant", "message": response, "embedding": res_embed}
    ]).execute()

    return {"response": response}

# ============================
# 🔍 RECHERCHE MENTALE (VECTORS)
# ============================
@app.post("/search")
async def search_ideas(msg: Message):
    if msg.token != ACCESS_TOKEN:
        raise HTTPException(status_code=401, detail="Accès refusé")

    query_embedding = embed_text(msg.user_message)

    # fallback simple
    context_result = supabase.table("conversations")\
        .select("role, message, timestamp")\
        .order("timestamp", desc=True)\
        .limit(5)\
        .execute()

    results = [
        {"role": x["role"], "message": x["message"], "distance": 0.0}
        for x in context_result.data
    ]

    return {"results": results}

# ============================
# 🧠 ANALYSE COGNITIVE (RÉSUMÉ)
# ============================
@app.get("/analyze")
async def analyze_memory(token: str):
    if token != ACCESS_TOKEN:
        raise HTTPException(status_code=401, detail="Accès refusé")

    result = supabase.table("conversations") \
        .select("role, message, timestamp") \
        .order("timestamp", desc=True) \
        .limit(50) \
        .execute()

    if not result.data:
        return {"analysis": "Mémoire vide pour le moment."}

    all_text = "\n".join([f"{x['role']}: {x['message']}" for x in result.data[::-1]])

    prompt = f"""
    Voici un extrait du journal cognitif de Matt.
    Analyse et synthétise :

    1. Idées principales
    2. Thèmes récurrents
    3. Émotions dominantes
    4. Contradictions internes
    5. Suggestions ou directions
    Texte :
    {all_text}
    """

    completion = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Tu es le module d’analyse introspective du cerveau numérique de Matt."},
            {"role": "user", "content": prompt}
        ]
    )

    analysis = completion.choices[0].message["content"]
    return {"analysis": analysis}

# ============================
# RUN
# ============================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)