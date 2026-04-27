# Unemployment Insurance Claim-Service Interview Prep

## 1) Project Overview (Interview-Friendly)

This project is a modern unemployment insurance claims platform for a Department of Labor.

At a high level:

- Citizens submit unemployment claims.
- Case workers review claims.
- Eligibility is validated by business rules.
- Approved claims trigger payment scheduling.
- Every important action is stored for audit/compliance.

This is split into microservices so each domain can scale and evolve independently:

- `claimant-service` -> claimant profile data
- `claim-service` -> core claim lifecycle (deep-dive service)
- `eligibility-service` -> eligibility checks
- `payment-service` -> payment calculation/scheduling
- `document-service` -> S3 document metadata + storage
- `notification-service` -> email/SMS via SQS/SNS
- `audit-service` -> immutable compliance trail

How to say it in an interview (short):

> "I worked on a reactive, event-driven claims platform. `claim-service` was the core orchestrator for submission, status transitions, and integration with eligibility, payment, and audit workflows."

---

## 2) Text-Based Architecture Diagram

```text
[Web/Mobile/Portal]
        |
        v
[Route53 DNS]
        |
        v
[API Gateway or ALB]
        |
        v
------------------- VPC -------------------
|                                        |
|  [ECS Fargate/EKS: claim-service]      |
|      |         |         |             |
|      |         |         +--> [S3] (docs metadata refs)
|      |         +--> [RDS PostgreSQL]   |
|      +--> [SQS/SNS Events] -----------+--------------------+
|                                        |                    |
|                          [eligibility-service]              |
|                          [payment-service]                  |
|                          [notification-service]             |
|                          [audit-service]                    |
|                                                             |
|  [Secrets Manager] -> DB creds/API secrets                  |
|  [CloudWatch Logs + Metrics + Alarms]                       |
--------------------------------------------------------------
```

---

## 3) Claim Submission Request Flow (Baby Steps)

### A) Synchronous Request Flow (API call)

1. User submits `POST /api/v1/claims`.
2. Request enters API Gateway/ALB.
3. Routed to `claim-service`.
4. Controller validates payload (`@Valid`).
5. Service checks claimant existence (via `claimant-service` client).
6. Service checks duplicate active claim rule.
7. Service saves claim in PostgreSQL (R2DBC).
8. Service writes initial status history (`SUBMITTED`).
9. Service writes audit event (`CLAIM_SUBMITTED`).
10. API returns `201 Created` with `claimId` + `status`.

### B) Async Event Flow (after save)

1. `claim-service` publishes `ClaimSubmittedEvent` to SNS/SQS.
2. `eligibility-service` consumes event and evaluates rules.
3. If eligible, status moves toward approval workflow.
4. `payment-service` schedules payments after approval.
5. `notification-service` sends user updates.
6. `audit-service` keeps compliance event records.

### C) Interview Way to Explain Flow

> "First, we do all critical validations and persistence in `claim-service` transaction flow. After durable save, we publish domain events for downstream services. That gives consistency for core data and loose coupling for side effects."

---

## 4) Industry-Standard Claim-Service Project Structure

Base package: `com.dol.unemployment.claimservice`

- `config` - Spring config, WebClient beans, security, OpenAPI, R2DBC converters
- `controller` - REST endpoints
- `service` - business logic orchestration
- `repository` - reactive DB access (`ReactiveCrudRepository` / custom queries)
- `entity` - DB-mapped domain objects
- `dto` - request/response contracts
- `mapper` - entity <-> DTO conversion
- `exception` - custom exceptions + handler
- `validation` - business validators (status transitions, rules)
- `event` - domain events + publisher/consumer interfaces
- `client` - WebClient integrations (claimant/eligibility/audit)
- `audit` - audit command models/helpers
- `util` - common helpers/constants

Suggested layout:

```text
src/main/java/com/dol/unemployment/claimservice
  ├─ config
  ├─ controller
  ├─ service
  ├─ repository
  ├─ entity
  ├─ dto
  ├─ mapper
  ├─ exception
  ├─ validation
  ├─ event
  ├─ client
  ├─ audit
  └─ util

src/main/resources
  ├─ application.yml
  ├─ application-local.yml
  ├─ application-dev.yml
  └─ application-prod.yml
```

---

## 5) Production-Style `application.yml` + Explanation

```yaml
spring:
  application:
    name: claim-service
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:local}

  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:claims_db}
    username: ${DB_USERNAME:claims_user}
    password: ${DB_PASSWORD:claims_pass}
    pool:
      enabled: true
      initial-size: 5
      max-size: 30

  flyway:
    enabled: true
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:claims_db}
    user: ${DB_USERNAME:claims_user}
    password: ${DB_PASSWORD:claims_pass}
    locations: classpath:db/migration

server:
  port: ${SERVER_PORT:8081}

aws:
  region: ${AWS_REGION:us-east-1}
  sqs:
    claim-submitted-queue: ${CLAIM_SUBMITTED_QUEUE:claim-submitted-queue}
  s3:
    claim-doc-bucket: ${CLAIM_DOC_BUCKET:dol-claims-docs}

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
  endpoint:
    health:
      probes:
        enabled: true
      show-details: always
  metrics:
    tags:
      application: claim-service

logging:
  level:
    root: INFO
    com.dol.unemployment.claimservice: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} %-5level [%X{traceId:-}] %logger - %msg%n"

resilience4j:
  circuitbreaker:
    instances:
      claimantClient:
        slidingWindowSize: 20
        failureRateThreshold: 50
        waitDurationInOpenState: 20s
  retry:
    instances:
      claimantClient:
        maxAttempts: 3
        waitDuration: 500ms
```

What each section does:

- `spring.application.name` -> service identity in logs/metrics
- `spring.profiles.active` -> environment profile (`local/dev/prod`)
- `spring.r2dbc.*` -> reactive PostgreSQL DB connection
- `spring.r2dbc.pool.*` -> DB connection pool config
- `spring.flyway.*` -> DB schema migration at startup (Flyway uses JDBC)
- `server.port` -> app listening port
- `aws.region` -> AWS region
- `aws.sqs.*` -> queue name for claim events
- `aws.s3.*` -> bucket for claim docs
- `management.*` -> Actuator health/metrics endpoints
- `logging.*` -> log levels + trace-friendly pattern
- `resilience4j.circuitbreaker` -> prevent repeated downstream failures
- `resilience4j.retry` -> transient retry policy for client calls

Interview line:

> "We externalize all environment-specific values using env placeholders, so the same artifact runs across local/dev/prod with profile-driven behavior."

---

## 6) One Sample API Implementation Flow (`POST /api/v1/claims`)

### Request Example

```json
{
  "claimantId": "c9f8a0d9-8bb9-4b90-9f77-1f0d65f83e90",
  "employmentEndDate": "2026-03-15",
  "reasonCode": "LAYOFF",
  "weeklyWage": 850.00
}
```

### Implementation Flow (step-by-step)

1. Controller receives request and validates fields.
2. Service verifies claimant exists via WebClient.
3. Service checks no existing active claim for claimant.
4. Service creates claim entity with status `SUBMITTED`.
5. Repository saves claim (`Mono<ClaimEntity>`).
6. Service saves status history row.
7. Service saves audit event row.
8. Service publishes `ClaimSubmittedEvent` to SQS/SNS.
9. Mapper converts entity to response DTO.
10. Controller returns `201 Created`.

### Minimal Industry-Style Reactive Snippet

```java
@PostMapping("/api/v1/claims")
public Mono<ResponseEntity<ClaimResponse>> submitClaim(@Valid @RequestBody Mono<CreateClaimRequest> requestMono) {
    return requestMono
        .flatMap(claimService::submitClaim)
        .map(res -> ResponseEntity.status(HttpStatus.CREATED).body(res));
}
```

```java
public Mono<ClaimResponse> submitClaim(CreateClaimRequest req) {
    return claimantClient.existsById(req.claimantId())
        .flatMap(exists -> exists ? Mono.just(true) : Mono.error(new BusinessException("CLAIMANT_NOT_FOUND")))
        .then(claimRepository.existsActiveClaim(req.claimantId()))
        .flatMap(active -> active ? Mono.error(new BusinessException("ACTIVE_CLAIM_EXISTS")) : Mono.empty())
        .then(claimRepository.save(mapper.toEntity(req)))
        .flatMap(saved -> statusHistoryRepository.save(ClaimStatusHistoryEntity.initial(saved.getId()))
            .then(auditRepository.save(ClaimAuditEventEntity.submitted(saved.getId(), req.claimantId())))
            .then(eventPublisher.publishClaimSubmitted(saved))
            .thenReturn(saved))
        .map(mapper::toResponse);
}
```

Why this looks strong in interview:

- Non-blocking end-to-end (`Mono`, no `.block()`)
- Clear business validation sequence
- DB-first durability, then async event publish
- Clean error signaling with domain exceptions
- No manual `subscribe()` in service (WebFlux best practice)

---

## Next Step

Continue with one of these:

- Database design
- Full code snippets
- AWS deployment deep dive
- Interview Q&A practice set