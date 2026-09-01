import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { formatMoney } from "../lib/currency";

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  if (type === "monthly-report") {
    const {
      month = "",
      totalSpent = 0,
      totalIncome = 0,
      categories = [],
      insights = [],
      currency = "USD",
    } = data;

    const money = (n) => formatMoney(n, currency);

    const net = totalIncome - totalSpent;

    return (
      <Html>
        <Head />
        <Preview>
          Your {month} summary: {money(totalSpent)} spent
        </Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Your {month} in review</Heading>
            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Here is how last month went, and a few things worth trying next
              month.
            </Text>

            <Section style={styles.statsContainer}>
              <Row>
                <Column style={styles.stat}>
                  <Text style={styles.statLabel}>Income</Text>
                  <Text style={styles.statValue}>{money(totalIncome)}</Text>
                </Column>
                <Column style={styles.stat}>
                  <Text style={styles.statLabel}>Spent</Text>
                  <Text style={styles.statValue}>{money(totalSpent)}</Text>
                </Column>
                <Column style={styles.stat}>
                  <Text style={styles.statLabel}>Net</Text>
                  <Text
                    style={{
                      ...styles.statValue,
                      color: net >= 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {money(net)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {categories.length > 0 && (
              <>
                <Hr style={styles.hr} />
                <Heading as="h2" style={styles.subtitle}>
                  Where it went
                </Heading>
                {categories.map((c) => (
                  <Row key={c.name} style={styles.categoryRow}>
                    <Column>
                      <Text style={styles.categoryName}>{c.name}</Text>
                    </Column>
                    <Column align="right">
                      <Text
                        style={{
                          ...styles.categoryValue,
                          color: c.overBudget ? "#dc2626" : "#334155",
                        }}
                      >
                        {money(c.spent)}
                        {c.budget ? ` of ${money(c.budget)}` : ""}
                      </Text>
                    </Column>
                  </Row>
                ))}
              </>
            )}

            {insights.length > 0 && (
              <>
                <Hr style={styles.hr} />
                <Heading as="h2" style={styles.subtitle}>
                  Suggestions
                </Heading>
                {insights.map((insight, i) => (
                  <Text key={i} style={styles.insight}>
                    • {insight}
                  </Text>
                ))}
              </>
            )}

            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              Sent by BudgetIQ. Figures cover {month} across all your accounts.
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  return null;
}

const styles = {
  body: {
    backgroundColor: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "32px",
    borderRadius: "12px",
    maxWidth: "600px",
  },
  title: {
    color: "#0f172a",
    fontSize: "26px",
    fontWeight: "600",
    margin: "0 0 16px",
  },
  subtitle: {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 12px",
  },
  text: { color: "#334155", fontSize: "15px", lineHeight: "24px", margin: "0 0 12px" },
  statsContainer: {
    margin: "24px 0",
    padding: "20px",
    backgroundColor: "#f1f5f9",
    borderRadius: "10px",
  },
  stat: { textAlign: "center", padding: "0 8px" },
  statLabel: {
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    margin: "0 0 4px",
  },
  statValue: { color: "#0f172a", fontSize: "20px", fontWeight: "600", margin: 0 },
  categoryRow: { padding: "6px 0", borderBottom: "1px solid #f1f5f9" },
  categoryName: { color: "#334155", fontSize: "14px", margin: 0 },
  categoryValue: { fontSize: "14px", fontWeight: "500", margin: 0 },
  insight: { color: "#334155", fontSize: "14px", lineHeight: "22px", margin: "0 0 8px" },
  hr: { borderColor: "#e2e8f0", margin: "24px 0" },
  footer: { color: "#94a3b8", fontSize: "12px", margin: 0 },
};
