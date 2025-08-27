import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_URL ||
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjg2OTk5OSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDc2ZDUwQjBFMTQ3OWE5QmEyYkQ5MzVGMUU5YTI3QzBjNjQ5QzhDMTIifQ",
      payload: "eyJkb21haW4iOiJ2dGFtYXJhLWdsb3dpbmd2aXN0YWFwcC52ZXJjZWwuYXBwIn0",
      signature: "MHg2NGUzMTg3YjcyNzQ0ZGI0ZjE0M2QzNWIwNTI2ZWEyY2M3NGE3ZjU3ODU1MjY5Mzg3ZTIxM2FlNzZkMTZlZDEyMjgxYjFmZjc1NDJlNTIyMDJkYTFkOWEwMjk5NTExZjAxNmRlMWEyNTAwMGQ2MzI1MGRhM2Y2OGY2NzY2ZWMwODFj",
    },
    frame: {
      version: "1",
      name: PROJECT_TITLE,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og.png`,
      buttonTitle: "Open",
      webhookUrl: `${appUrl}/api/webhook`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#555555",
      primaryCategory: "social",
    },
  };

  return Response.json(config);
}
