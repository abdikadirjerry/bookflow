const requiredEnvironmentVariables = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLIENT_URL",
];

const validateEnvironment = () => {
  const missingVariables = requiredEnvironmentVariables.filter(
    (variable) => !process.env[variable],
  );

  if (missingVariables.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );

    process.exit(1);
  }
};

module.exports = validateEnvironment;
