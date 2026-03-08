export async function main() {
  // Intentionally empty. Seed data will be added when domain models exist.
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Seed complete (no-op).");
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  });
