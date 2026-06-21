# Future Enhancements & Production-Grade Architecture

This document maps out the scaling roadmap, production architecture, and architectural upgrades required to transition the **Gridlock.AI** prototype into a high-availability, mission-critical traffic management system.

---

## 1. Target Production Architecture

To support thousands of live telemetry streams and multiple agency dashboards concurrently, we propose transitioning from a monolithic backend structure to a highly scalable, event-driven microservices architecture:

```mermaid
flowchart TD
    Client[Next.js Client Dashboards] --> LB[Cloud Load Balancer]
    LB --> GW[Kong API Gateway / OAuth Auth]
    
    subgraph Service Mesh (Kubernetes)
        GW --> AppSvc[FastAPI Application Service]
        GW --> AnalyticsSvc[FastAPI Analytics Service]
        
        AppSvc --> Redis[(Redis Distributed Cache)]
        AnalyticsSvc --> Redis
        
        AppSvc -- Produce Event --> Kafka{Apache Kafka Message Bus}
        
        subgraph Decoupled ML Engine
            Kafka --> MLConsumer[Prediction consumer workers]
            MLConsumer -- Async Predict --> Triton[Triton Inference Server / CatBoost GPU]
            Triton --> ModelRegistry[(MLflow Model Registry)]
        end
    end

    subgraph Data Tier
        MLConsumer -- Async Write --> DBCluster[(PostgreSQL Cluster + PostGIS)]
        DBCluster -- Replicate --> DBReplica[(PostgreSQL Read Replicas)]
        DBReplica --> AnalyticsSvc
    end
    
    subgraph Observability
        AppSvc & Triton --> Prom[Prometheus Metrics] --> Grafana[Grafana HUDs]
    end
```

---

## 2. Key Enhancement Areas

### 1. Decoupling Model Serving (Triton Inference Server / BentoML)
* **Current Limitation**: The model is loaded in-process inside FastAPI. This blocks CPU threads and limits horizontal scaling.
* **Production Approach**: Move the model to **Triton Inference Server** or **BentoML** deployed on GPU-enabled Kubernetes nodes.
  * **Dynamic Batching**: Groups multiple incoming prediction requests within a millisecond window to process them simultaneously.
  * **Model Versioning**: Updates the model (e.g., CatBoost v3) on-the-fly without restarting application servers.

### 2. Event-Driven Asynchronous Processing (Apache Kafka)
* **Current Limitation**: Writing events to the database and recalculating hotspot scores is done synchronously during the API call.
* **Production Approach**: Use **Apache Kafka** or **RabbitMQ** to ingest streams.
  * The frontend submits an incident parameter -> FastAPI validates it and immediately returns an ingestion ID.
  * The request is pushed to a Kafka topic.
  * Async workers pull from the queue, run ML predictions, write outputs to PostgreSQL, and push notifications to clients via WebSockets.
  * This guarantees that a slow database or model server cannot degrade the client's interface latency.

### 3. Distributed Cache Layer (Redis)
* **Current Limitation**: Database queries are made directly to PostgreSQL for dashboard panels and historical records.
* **Production Approach**: Deploy a **Redis Cluster** in front of the database.
  * Cache aggregated metrics (Analytics, KPI cards) with a time-to-live (TTL) of 60 seconds.
  * Cache static geographic indices (Junction coords) to minimize database lookups.
  * Use Redis Pub/Sub to broadcast real-time hotspot updates to connected operators.

### 4. Advanced Geospatial Queries (PostGIS Extension)
* **Current Limitation**: Coordinates are stored as standard decimals (`latitude`, `longitude`).
* **Production Approach**: Enable the **PostGIS** extension in PostgreSQL.
  * Store locations as native `GEOMETRY(Point, 4326)` columns.
  * Run complex spatial operations:
    * *Radius Search*: Find all police officers within 2km of an incident:
      ```sql
      SELECT name FROM officers 
      WHERE ST_DWithin(geom, ST_SetSRID(ST_Point(77.59, 12.97), 4326), 2000);
      ```
    * *Spatial Indexing*: Add `GIST` indexes to points for instant spatial calculations.

### 5. Automated CI/CD & Deployment Pipeline
* Deploy the stack inside **Docker** containers managed by **Kubernetes (EKS/GKE)**.
* **Horizontal Pod Autoscaling (HPA)**: Auto-scale the FastAPI application pods based on CPU consumption or request counts.
* **GitOps CI/CD**:
  ```
  Code Commit -> GitHub Actions -> Build Docker Image -> Push to AWS ECR -> Helm deploy to K8s
  ```

### 6. Robust Enterprise Security
* **Access Control**: Secure API routes with **OAuth2 / OpenID Connect (OIDC)** authentication (Auth0, Supabase Auth).
* **Data Encryption**: Force TLS 1.3 for all HTTP traffic. Encrypt database volumes at rest (AES-256).
* **Network Isolation**: Restrict database and ML servers to private subnets. Access is allowed only through the API Gateway via Virtual Private Cloud (VPC) peering.
