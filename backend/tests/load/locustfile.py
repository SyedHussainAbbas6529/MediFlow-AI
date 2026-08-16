from locust import HttpUser, task, between

class MediFlowUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Login to obtain access token
        response = self.client.post("/api/v1/auth/login", json={
            "email": "admin@mediflowai.health",
            "password": "Password123!"
        })
        if response.status_code == 200:
            token = response.json()["access_token"]
            self.client.headers["Authorization"] = f"Bearer {token}"

    @task(4)
    def load_dashboard(self):
        self.client.get("/api/v1/dashboard/metrics")

    @task(3)
    def view_claims(self):
        self.client.get("/api/v1/claims?limit=25")

    @task(2)
    def view_denials(self):
        self.client.get("/api/v1/denials")

    @task(2)
    def view_providers(self):
        self.client.get("/api/v1/providers")

    @task(1)
    def ask_ai_assistant(self):
        self.client.post("/api/v1/assistant/chat", json={
            "message": "Summarize Medicare LCD L33777 requirements"
        })
