import { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const REGION = import.meta.env.VITE_COGNITO_REGION;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

const client = new CognitoIdentityProviderClient({ region: REGION });

/**
 * Sends an OTP to the specified email by calling Cognito signUp.
 * A dummy password is used since the focus is on email verification.
 */
export const sendOtp = async (email) => {
  const dummyPassword = "Password123!" + Math.random().toString(36).slice(-8);
  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: dummyPassword,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  });

  try {
    return await client.send(command);
  } catch (error) {
    // If user already exists, we might need to handle it.
    // For this minimal implementation, we'll just throw the error.
    console.error("Error in sendOtp:", error);
    throw error;
  }
};

/**
 * Verifies the OTP entered by the user by calling Cognito confirmSignUp.
 */
export const verifyOtp = async (email, code) => {
  const command = new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });

  try {
    return await client.send(command);
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    throw error;
  }
};
