// lib/amplify-client.ts
import { Amplify } from "aws-amplify";

let configured = false;

export function initAmplify() {
  if (configured) return;

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID!,
        loginWith: {
          email: true,
        },
      },
    },
  });

  configured = true;
}
