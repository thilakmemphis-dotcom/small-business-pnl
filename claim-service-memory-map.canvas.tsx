import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
} from "cursor/canvas";

export default function ClaimServiceMemoryMap() {
  return (
    <Stack gap={20}>
      <H1>Claim-Service Visual Memory Map</H1>
      <Text>
        One-page interview view for the Unemployment Insurance Claims Platform.
      </Text>
      <Callout tone="info">
        Memory rule:{" "}
        <Text>
          Gateway {"->"} Claim Service {"->"} DB {"->"} Event {"->"} Downstream {"->"} Monitoring
        </Text>
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat label="Core Service" value="claim-service" />
        <Stat label="API Flow Steps" value="10" />
        <Stat label="Claim Statuses" value="6" />
        <Stat label="Major AWS Blocks" value="12" />
      </Grid>

      <Divider />

      <H2>Architecture At A Glance</H2>
      <Grid columns={3} gap={12}>
        <Card>
          <CardHeader>Entry Layer</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>1) Web/Mobile Portal</Text>
              <Text>2) Route 53</Text>
              <Text>3) API Gateway or ALB</Text>
              <Pill tone="info">North-South traffic</Pill>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Core Runtime</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>4) ECS Fargate/EKS</Text>
              <Text>5) claim-service (WebFlux + R2DBC)</Text>
              <Text>6) RDS PostgreSQL</Text>
              <Pill tone="info">Synchronous path</Pill>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Async + Ops</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>7) SNS/SQS Events</Text>
              <Text>8) eligibility/payment/notification/audit</Text>
              <Text>9) CloudWatch + Secrets Manager</Text>
              <Pill tone="info">Event-driven path</Pill>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Divider />

      <H2>Claim Submission: 10-Step Flow</H2>
      <Table
        headers={["Step", "What Happens", "Why It Matters"]}
        rows={[
          ["1", "Client calls POST /api/v1/claims", "Starts claim lifecycle"],
          ["2", "Gateway routes to claim-service", "Single secure entry"],
          ["3", "Controller validates request", "Reject bad input early"],
          ["4", "Service checks claimant exists", "Business integrity"],
          ["5", "Service checks duplicate active claim", "Fraud/rule prevention"],
          ["6", "Save claim in PostgreSQL (R2DBC)", "Durable system of record"],
          ["7", "Save claim status history", "Track lifecycle transitions"],
          ["8", "Save audit event", "Compliance and traceability"],
          ["9", "Publish ClaimSubmitted event", "Decouple downstream processing"],
          ["10", "Return 201 with claimId/status", "Client gets immediate result"],
        ]}
      />

      <Divider />

      <H2>Status Transition Map</H2>
      <Card>
        <CardHeader>Allowed Transitions Only</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Row gap={8}>
              <Pill tone="neutral">SUBMITTED</Pill>
              <Text>{"->"}</Text>
              <Pill tone="neutral">UNDER_REVIEW</Pill>
            </Row>
            <Row gap={8}>
              <Pill tone="neutral">UNDER_REVIEW</Pill>
              <Text>{"->"}</Text>
              <Pill tone="success">APPROVED</Pill>
              <Text>or</Text>
              <Pill tone="warning">REJECTED</Pill>
            </Row>
            <Row gap={8}>
              <Pill tone="success">APPROVED</Pill>
              <Text>{"->"}</Text>
              <Pill tone="info">PAYMENT_SCHEDULED</Pill>
            </Row>
            <Row gap={8}>
              <Pill tone="info">PAYMENT_SCHEDULED</Pill>
              <Text>{"->"}</Text>
              <Pill tone="success">PAID</Pill>
            </Row>
            <Callout tone="warning">
              Any invalid transition throws a business exception and is audited.
            </Callout>
          </Stack>
        </CardBody>
      </Card>

      <Divider />

      <H2>Interview 30-Second Script</H2>
      <Text>
        "In our unemployment platform, claim-service is the core workflow engine.
        We accept claims through API Gateway, validate claimant and duplicate rules,
        persist to PostgreSQL using reactive R2DBC, store status and audit records,
        and publish events to SNS/SQS for eligibility and payment services. This
        gives us strong data consistency for core claims and scalable async processing
        for downstream workflows. We run on ECS Fargate with Secrets Manager for
        credentials and CloudWatch for logs, metrics, and alerts."
      </Text>

      <H3>Memory Anchors</H3>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>Anchor 1: Request Path</CardHeader>
          <CardBody>
            <Text>Portal {"->"} Gateway {"->"} claim-service {"->"} RDS {"->"} 201 response</Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Anchor 2: Event Path</CardHeader>
          <CardBody>
            <Text>claim-service {"->"} SNS/SQS {"->"} eligibility/payment/notification/audit</Text>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}
